import { _x, _xem, _xlog, type XCommand, XModule } from "@xpell/node";

import { VibeKnowledgeSelector } from "./VibeKnowledgeSelector.js";
import { VibeOutputParser } from "./VibeOutputParser.js";
import {
  infer_artifact_type,
  type VibeArtifactType,
  type VibeRequestedArtifactType,
  VibePromptBuilder,
} from "./VibePromptBuilder.js";

type VibeAIMode = "full" | "refine";
const DEFAULT_ENV = "default";
const DEFAULT_VIEW_ID = "view-main";

function is_plain_object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function read_prompt(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Invalid 'prompt': expected non-empty string");
  }

  return value.trim();
}

function read_required_string(value: unknown, field_name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid '${field_name}': expected non-empty string`);
  }

  return value.trim();
}

function read_optional_string(value: unknown, field_name: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid '${field_name}': expected non-empty string`);
  }

  return value.trim();
}

function read_optional_string_array(value: unknown, field_name: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Invalid '${field_name}': expected string array`);
  }

  return value.map((item) => read_required_string(item, field_name));
}

function read_mode(value: unknown): VibeAIMode {
  if (value === undefined) {
    return "full";
  }

  if (value === "full" || value === "refine") {
    return value;
  }

  throw new Error("Invalid '_mode': expected 'full' or 'refine'");
}

function read_artifact_type(value: unknown): VibeRequestedArtifactType | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    value === "view" ||
    value === "flow" ||
    value === "entity" ||
    value === "command" ||
    value === "auto"
  ) {
    return value;
  }

  throw new Error("Invalid '_artifact_type': expected view, flow, entity, command, or auto");
}

function read_generated_text(value: unknown): string {
  if (is_plain_object(value) && typeof value._text === "string" && value._text.trim().length > 0) {
    return value._text;
  }

  throw new Error("Invalid xai response: missing '_text'");
}

function unwrap_command_result(value: unknown): unknown {
  if (!is_plain_object(value) || typeof value._ok !== "boolean") {
    return value;
  }

  if (value._ok === false) {
    throw new Error(`Command failed: ${JSON.stringify(value._error ?? value._result ?? value)}`);
  }

  return Object.prototype.hasOwnProperty.call(value, "_result")
    ? value._result
    : value;
}

function normalize_full_view_id(
  view: Record<string, unknown>,
  requested_view_id?: string,
): string {
  const parsed_view_id = read_optional_string(view._id, "_view._id");
  const view_id = requested_view_id ?? parsed_view_id ?? DEFAULT_VIEW_ID;

  view._id = view_id;
  return view_id;
}

function ensure_view_type(view: Record<string, unknown>): void {
  if (view._type === undefined) {
    view._type = "view";
    return;
  }

  if (view._type !== "view") {
    throw new Error("Invalid AI output: '_view._type' must be 'view'");
  }
}

function ensure_artifact_id(artifact: Record<string, unknown>, field_name: string): string {
  return read_required_string(artifact._id, field_name);
}

function read_child_id(value: unknown): string | undefined {
  return is_plain_object(value) && typeof value._id === "string" && value._id.trim().length > 0
    ? value._id.trim()
    : undefined;
}

function merge_child_object(existing_child: unknown, next_child: unknown): unknown {
  if (!is_plain_object(existing_child) || !is_plain_object(next_child)) {
    return next_child;
  }

  const merged = {
    ...existing_child,
    ...next_child,
  };

  if (Array.isArray(next_child._children)) {
    merged._children = merge_children_by_id(existing_child._children, next_child._children);
  }

  return merged;
}

function merge_children_by_id(existing_children: unknown, next_children: unknown): unknown {
  if (!Array.isArray(next_children) || next_children.length === 0) {
    return existing_children;
  }

  if (!Array.isArray(existing_children) || existing_children.length === 0) {
    return next_children;
  }

  const merged = [...existing_children];
  const existing_index_by_id = new Map<string, number>();

  existing_children.forEach((child, index) => {
    const child_id = read_child_id(child);
    if (child_id) existing_index_by_id.set(child_id, index);
  });

  for (const next_child of next_children) {
    const next_child_id = read_child_id(next_child);

    if (next_child_id && existing_index_by_id.has(next_child_id)) {
      const index = existing_index_by_id.get(next_child_id);
      if (index !== undefined) {
        merged[index] = merge_child_object(merged[index], next_child);
      }
      continue;
    }

    merged.push(next_child);
  }

  return merged;
}

function merge_refined_view(
  current_view: Record<string, unknown>,
  next_view: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...current_view,
  };

  for (const [key, value] of Object.entries(next_view)) {
    if (value !== undefined && key !== "_children") {
      merged[key] = value;
    }
  }

  merged._id = next_view._id ?? current_view._id;
  merged._type = "view";

  merged._children = merge_children_by_id(current_view._children, next_view._children);

  return merged;
}

function server_xvm_has_op(op: "set_flow" | "set_entity"): boolean {
  const get_module = (_x as unknown as { getModule?: (name: string) => unknown }).getModule;
  if (typeof get_module !== "function") {
    return true;
  }

  const module = get_module.call(_x, "server-xvm");
  if (!module || typeof module !== "object") {
    return false;
  }

  const method_name = `_${op}`;
  return typeof (module as Record<string, unknown>)[method_name] === "function";
}

function explicit_error(code: string, message: string) {
  return {
    _ok: false,
    _error: {
      _code: code,
      _message: message,
    },
  };
}

export class VibeAIEngineModule extends XModule {
  static _name = "vibe-ai";

  private readonly selector: VibeKnowledgeSelector;
  private readonly prompt_builder: VibePromptBuilder;
  private readonly output_parser: VibeOutputParser;

  constructor() {
    super({ _name: VibeAIEngineModule._name });
    this.selector = new VibeKnowledgeSelector();
    this.prompt_builder = new VibePromptBuilder();
    this.output_parser = new VibeOutputParser();
  }

  private async generate_artifact(params: Record<string, unknown>, forced_artifact_type?: VibeArtifactType) {
    const prompt = read_prompt(params.prompt);
    const mode = read_mode(params._mode);
    const app_id = read_required_string(params._app_id, "_app_id");
    const env = read_optional_string(params._env, "_env") ?? DEFAULT_ENV;
    const requested_view_id = read_optional_string(params._view_id, "_view_id");
    const requested_artifact_type = read_artifact_type(params._artifact_type);
    const capabilities = read_optional_string_array(params._capabilities, "_capabilities");
    const artifact_type = forced_artifact_type ?? infer_artifact_type(prompt, requested_artifact_type);

    if (mode === "refine" && artifact_type !== "view") {
      throw new Error("Invalid '_mode': refine is only supported for view artifacts");
    }

    if (mode === "refine" && !requested_view_id) {
      throw new Error("Invalid '_view_id': expected non-empty string for refine mode");
    }

    _xlog.log("[vibe-ai] generate", {
      _mode: mode,
      _artifact_type: artifact_type,
      ...(capabilities.length > 0 ? { _capabilities: capabilities } : {}),
      _app_id: app_id,
      _env: env,
    });

    const selection = this.selector.select(prompt, artifact_type, capabilities);
    _xlog.log("[vibe-ai] selected skills", {
      _artifact_type: artifact_type,
      _skill_ids: selection.skill_ids,
    });

    const final_prompt = this.prompt_builder.build({
      prompt,
      _mode: mode,
      _artifact_type: artifact_type,
      selection,
    });

    const xai_result = unwrap_command_result(await _x.execute({
      _module: "xai",
      _op: "generate",
      _params: {
        prompt: final_prompt,
      },
    } as any));

    const raw_text = read_generated_text(xai_result);
    const parsed = this.output_parser.parse(raw_text, artifact_type, {
      _allow_raw_view: forced_artifact_type === "view",
    });

    if (parsed._artifact_type !== artifact_type) {
      throw new Error(
        `Invalid AI output: expected '${artifact_type}' artifact but received '${parsed._artifact_type}'`,
      );
    }

    if (artifact_type === "view") {
      return this.persist_view_artifact({
        app_id,
        env,
        mode,
        requested_view_id,
        parsed_view: parsed._artifact,
        include_artifact_type: forced_artifact_type !== "view",
      });
    }

    if (artifact_type === "flow") {
      return this.persist_flow_artifact(app_id, env, parsed._artifact);
    }

    if (artifact_type === "entity") {
      return this.persist_entity_artifact(app_id, env, parsed._artifact);
    }

    return this.return_command_artifact(app_id, env, parsed._artifact);
  }

  private async persist_view_artifact(input: {
    app_id: string;
    env: string;
    mode: VibeAIMode;
    requested_view_id?: string;
    parsed_view: Record<string, unknown>;
    include_artifact_type: boolean;
  }) {
    let view_to_persist = input.parsed_view;

    if (input.mode === "refine") {
      const current_result = unwrap_command_result(await _x.execute({
        _module: "server-xvm",
        _op: "get_view",
        _params: {
          _app_id: input.app_id,
          _env: input.env,
          _view_id: input.requested_view_id,
        },
      } as any));

      if (!is_plain_object(current_result) || !is_plain_object(current_result._view)) {
        throw new Error("Invalid server-xvm get_view response");
      }

      view_to_persist = merge_refined_view(current_result._view, {
        ...input.parsed_view,
        _id: input.requested_view_id,
      });
    } else {
      normalize_full_view_id(view_to_persist, input.requested_view_id);
    }

    ensure_view_type(view_to_persist);

    const view_id = read_required_string(view_to_persist._id, "_view._id");
    _xlog.log("[vibe-ai] persist artifact", {
      _artifact_type: "view",
      _artifact_id: view_id,
    });

    await _x.execute({
      _module: "server-xvm",
      _op: "push_update",
      _params: {
        _app_id: input.app_id,
        ...(input.env ? { _env: input.env } : {}),
        _view: view_to_persist,
      },
    } as any);

    _xem.fire("vibe:view-updated", {
      _app_id: input.app_id,
      _env: input.env,
      _view_id: view_id,
    });

    _xlog.log("[vibe-ai] result", {
      _artifact_type: "view",
      _artifact_id: view_id,
    });

    return {
      _ok: true,
      _result: input.include_artifact_type
        ? {
          _artifact_type: "view",
          _artifact_id: view_id,
          _view_id: view_id,
        }
        : {
          _view_id: view_id,
        },
    };
  }

  private async persist_flow_artifact(
    app_id: string,
    env: string,
    flow: Record<string, unknown>,
  ) {
    if (!server_xvm_has_op("set_flow")) {
      return explicit_error(
        "E_VIBE_AI_SERVER_XVM_OP_MISSING",
        "server-xvm op 'set_flow' is not available",
      );
    }

    const flow_id = ensure_artifact_id(flow, "_flow._id");

    _xlog.log("[vibe-ai] persist artifact", {
      _artifact_type: "flow",
      _artifact_id: flow_id,
    });

    await _x.execute({
      _module: "server-xvm",
      _op: "set_flow",
      _params: {
        _app_id: app_id,
        ...(env ? { _env: env } : {}),
        _flow: flow,
      },
    } as any);

    _xem.fire("vibe:flow-updated", {
      _app_id: app_id,
      _env: env,
      _flow_id: flow_id,
    });

    return {
      _ok: true,
      _result: {
        _artifact_type: "flow",
        _artifact_id: flow_id,
        _flow_id: flow_id,
      },
    };
  }

  private async persist_entity_artifact(
    app_id: string,
    env: string,
    entity: Record<string, unknown>,
  ) {
    if (!server_xvm_has_op("set_entity")) {
      return explicit_error(
        "E_VIBE_AI_SERVER_XVM_OP_MISSING",
        "server-xvm op 'set_entity' is not available",
      );
    }

    const entity_id = ensure_artifact_id(entity, "_entity._id");

    _xlog.log("[vibe-ai] persist artifact", {
      _artifact_type: "entity",
      _artifact_id: entity_id,
    });

    await _x.execute({
      _module: "server-xvm",
      _op: "set_entity",
      _params: {
        _app_id: app_id,
        ...(env ? { _env: env } : {}),
        _entity: entity,
      },
    } as any);

    _xem.fire("vibe:entity-updated", {
      _app_id: app_id,
      _env: env,
      _entity_id: entity_id,
    });

    return {
      _ok: true,
      _result: {
        _artifact_type: "entity",
        _artifact_id: entity_id,
        _entity_id: entity_id,
      },
    };
  }

  private return_command_artifact(
    app_id: string,
    env: string,
    command: Record<string, unknown>,
  ) {
    const module_name = read_required_string(command._module, "_command._module");
    const op_name = read_required_string(command._op, "_command._op");
    const command_id = `${module_name}.${op_name}`;

    _xlog.log("[vibe-ai] generated artifact", {
      _artifact_type: "command",
      _artifact_id: command_id,
    });

    _xem.fire("vibe:command-generated", {
      _app_id: app_id,
      _env: env,
      _module: module_name,
      _op: op_name,
    });

    return {
      _ok: true,
      _result: {
        _artifact_type: "command",
        _artifact_id: command_id,
        _command: command,
      },
    };
  }

  async _generate(xcmd: XCommand) {
    try {
      const params = is_plain_object(xcmd?._params) ? xcmd._params : {};
      return await this.generate_artifact(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      _xlog.error("[vibe-ai] generate failed", error);
      return {
        _ok: false,
        _error: {
          _code: "E_VIBE_AI_GENERATE",
          _message: message,
        },
      };
    }
  }

  async _generate_view(xcmd: XCommand) {
    try {
      const params = is_plain_object(xcmd?._params) ? xcmd._params : {};
      return await this.generate_artifact(params, "view");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      _xlog.error("[vibe-ai] generate_view failed", error);
      return {
        _ok: false,
        _error: {
          _code: "E_VIBE_AI_GENERATE_VIEW",
          _message: message,
        },
      };
    }
  }

  async _generate_app(cmd: XCommand) {

    const prompt =
      cmd?._params?._prompt;

    /*
      1. create app first
    */

    await _x.execute({
      _module: "server-xvm",
      _op: "create_app",
      _params: {
        _app_id: "generated-app",
        _env: "default",
        _entry_view_id: "main",
        _name: "Generated App"
      }
    });

    /*
      2. then push views
    */

    await _x.execute({
      _module: "server-xvm",
      _op: "push_update",
      _params: {
        _app_id: "generated-app",
        _env: "default",
        _view_id: "main",
        _view: {
          _id: "main",
          _type: "view",
          "_children": [
            {
              "_type": "label",
              "_text": "Hello from generated app 🔥"
            }
          ]
        }
      }
    });

    _xlog.log(
      "[vibe-ai] generate_app",
      { _prompt: prompt }
    );

    return {
      _ok: true,
      _result: {
        _app_id: "generated-app"
      }
    };
  }
}
