/**
 * XStudioModule
 * -----------------------------
 * Live visual editing/orchestration module for Xpell applications.
 *
 * Responsibilities:
 * - Coordinates build/edit studio sessions.
 * - Generates preview views from prompts.
 * - Applies validated view updates to server-xvm.
 * - Bridges live editing workflows with XVibe AI generation.
 * - Manages real-time preview/apply cycles for XUI views.
 * - Can initiate runtime skill synchronization during build mode.
 *
 * Architectural role:
 * - XStudioModule is NOT the AI intelligence layer.
 * - XVibeModule owns:
 *   - skill registry
 *   - knowledge selection
 *   - prompt building
 *   - LLM orchestration
 * - XStudioModule owns:
 *   - live editing workflows
 *   - preview/apply orchestration
 *   - editor/build-mode runtime coordination
 *   - studio session interactions
 *
 * Runtime flow:
 * client(build mode)
 *   -> studio.preview-view
 *   -> xvibe.generate-ui
 *   -> studio.apply-view
 *   -> server-xvm.push_update
 *
 * Notes:
 * - Generated/persisted views must remain data-only JSON.
 * - No JavaScript functions may be persisted in generated views.
 * - server-xvm remains the authoritative runtime view persistence layer.
 * - Studio operations are intended for build/editor contexts only.
 */

import { _x, _xlog, type XCommand, XModule, } from "@xpell/node";
import { type XpellSkill, type XpellSkillCommand } from "@xpell/node";

import { XStudioService } from "./XStudio.service.js";
import type {
  XStudioApplyViewParams,
  XStudioApplyViewResult,
  XStudioErrorResult,
  XStudioGenerateViewParams,
  XStudioGenerateViewResult,
  XStudioViewData,
} from "./XStudio.types.js";

const DEFAULT_ENV = "default";

type ServerXvmGetViewResult = {
  _app_id: string;
  _env: string;
  _version: number;
  _view: Record<string, unknown>;
};

type ServerXvmPushUpdateResult = {
  _ok: boolean;
  _app_id: string;
  _env: string;
  _view_id: string;
  _version: number;
  _notified_subscribers: string[];
};

function is_plain_object(_value: unknown): _value is Record<string, unknown> {
  return typeof _value === "object" && _value !== null && !Array.isArray(_value);
}

function read_required_string(
  _value: unknown,
  _field_name: string,
): string {
  if (typeof _value !== "string") {
    throw new Error(`Invalid '${_field_name}': expected non-empty string`);
  }

  const _trimmed = _value.trim();
  if (_trimmed.length === 0) {
    throw new Error(`Invalid '${_field_name}': expected non-empty string`);
  }

  return _trimmed;
}

function clone_view(_view: XStudioViewData): XStudioViewData {
  return JSON.parse(JSON.stringify(_view)) as XStudioViewData;
}

function create_error_result(
  _code: string,
  _message: string,
  _details?: Record<string, unknown>,
): XStudioErrorResult {
  return {
    _ok: false,
    _error: {
      _code,
      _message,
      ...(_details ? { _details } : {}),
    },
  };
}

function is_error_result(_value: unknown): _value is XStudioErrorResult {
  return (
    is_plain_object(_value) &&
    _value._ok === false &&
    is_plain_object(_value._error) &&
    typeof _value._error._code === "string" &&
    typeof _value._error._message === "string"
  );
}

function extract_command_error_result(_value: unknown): XStudioErrorResult | null {
  if (is_error_result(_value)) {
    return _value;
  }

  if (!is_plain_object(_value) || _value._ok !== false) {
    return null;
  }

  if (is_plain_object(_value._result)) {
    const _code =
      typeof _value._result._code === "string"
        ? _value._result._code
        : "E_STUDIO_COMMAND_FAILED";
    const _message =
      typeof _value._result._message === "string"
        ? _value._result._message
        : "Command failed";
    const _details = is_plain_object(_value._result._details)
      ? _value._result._details
      : undefined;

    return create_error_result(_code, _message, _details);
  }

  return create_error_result(
    "E_STUDIO_COMMAND_FAILED",
    "Command failed",
  );
}

function is_server_xvm_get_view_result(
  _value: unknown,
): _value is ServerXvmGetViewResult {
  return (
    is_plain_object(_value) &&
    typeof _value._app_id === "string" &&
    typeof _value._env === "string" &&
    typeof _value._version === "number" &&
    is_plain_object(_value._view)
  );
}

function is_server_xvm_push_update_result(
  _value: unknown,
): _value is ServerXvmPushUpdateResult {
  return (
    is_plain_object(_value) &&
    _value._ok === true &&
    typeof _value._app_id === "string" &&
    typeof _value._env === "string" &&
    typeof _value._view_id === "string" &&
    typeof _value._version === "number" &&
    Array.isArray(_value._notified_subscribers)
  );
}

export class XStudioModule extends XModule {
  static _name = "studio";
  static _skill: XpellSkill = {
    _id: "studio",
    _title: "XStudio Server Module",
    _version: "1.0.0",
    _active: true,
    _type: "server-module-api",
    _requires: ["xmodule", "server-xvm", "xvibe", "module-creator"],
    _description:
      "Server-side Studio module for live Xpell app editing workflows, preview generation, view apply/publish orchestration, and build-mode skill synchronization.",

    _core_rules: [
      "Use studio only for build/edit/system contexts.",
      "Runtime users should not call studio ops directly.",
      "server-xvm remains the authoritative persistence and subscriber notification layer.",
      "XVibe owns skill registry, knowledge selection, prompt building, and LLM generation.",
      "Studio coordinates preview/apply workflows and may trigger client skill synchronization during build mode.",
      "Generated and persisted views must remain data-only JSON.",
      "Do not persist JavaScript functions in views.",
      "Use snake_case params."
    ]
  };

  static _ops: Record<string, XpellSkillCommand> = {
    "generate-view": {
      _name: "generate-view",
      _scope: "module",
      _description:
        "Generate a preview view for an existing server-xvm view using a prompt.",
      _params: {
        _app_id: "Target XVM app id.",
        _env: "Optional environment. Defaults to default.",
        _view_id: "Target view id.",
        _prompt: "User prompt describing the requested view changes."
      }
    },

    "apply-view": {
      _name: "apply-view",
      _scope: "module",
      _description:
        "Apply a validated preview view through server-xvm push-update.",
      _params: {
        _app_id: "Target XVM app id.",
        _env: "Optional environment. Defaults to default.",
        _view_id: "Target view id.",
        _view: "Data-only XUI view JSON to persist/apply."
      }
    },

    "sync-client-skills": {
      _name: "sync-client-skills",
      _scope: "module",
      _description:
        "Accept a build-mode client runtime skill snapshot and forward/store it through XVibe.",
      _params: {
        _app_id: "Target app id.",
        _env: "Optional environment.",
        _client_id: "Client/session id.",
        _mode: "Must be build or system.",
        _skills_hash: "Optional hash of the client skill snapshot.",
        _skills: "Client _x.getSkills() runtime skill snapshot."
      }
    },

    "get-skills": {
      _name: "get-skills",
      _scope: "module",
      _description:
        "Return the current server runtime skill snapshot for Studio diagnostics.",
      _params: {
        _include_objects: "Optional flag to include object skill chains.",
        _include_modules: "Optional flag to include module skills."
      }
    },
    "create-module": {
      _name: "create-module",
      _scope: "module",
      _description:
        "Create a generated runtime module from a Studio prompt by asking XVibe for a manifest and module-creator to generate/load it.",
      _params: {
        _prompt: "User prompt describing the desired runtime module capability.",
        _module_id: "Optional requested module id.",
        _module_name: "Optional requested module name.",
        _load: "Optional. Load generated module after creation. Default true."
      }
    }
  };

  private readonly _service: XStudioService;

  constructor() {
    super({ _name: XStudioModule._name });
    this._service = new XStudioService();
  }

  async _sync_client_skills(xcmd: XCommand) {
    const params = is_plain_object(xcmd?._params) ? xcmd._params : {};

    const skills_count = Array.isArray((params._skills as any)?._modules)
      ? (params._skills as any)._modules.length
      : 0;

    _xlog.log("[studio] sync-client-skills received", {
      _app_id: params._app_id,
      _env: params._env,
      _mode: params._mode,
      _skills_count: skills_count
    });

    const xvibe_result = await _x.execute({
      _module: "xvibe",
      _op: "sync-skills",
      _params: params
    } as any);

    return {
      _ok: true,
      _result: {
        _synced: true,
        _forwarded_to_xvibe: true,
        _xvibe_result: xvibe_result,
        _mode: params._mode,
        _app_id: params._app_id,
        _env: params._env,
        _skills_count: skills_count
      }
    };
  }
  
  async onLoad() {
    _xlog.log("[studio] module loaded**********************");
  }

  async _op_create_module(xcmd: XCommand) {
    const params = is_plain_object(xcmd?._params) ? xcmd._params : {};
    const prompt = read_required_string(params._prompt, "_prompt");

    const spec_result: any = await _x.execute({
      _module: "xvibe",
      _op: "generate-module-spec",
      _params: {
        _prompt: prompt,
        _module_id: params._module_id,
        _module_name: params._module_name,
        _target: "server"
      }
    } as any);

    if (!spec_result?._ok || !is_plain_object(spec_result._spec)) {
      return create_error_result(
        "E_STUDIO_MODULE_SPEC_FAILED",
        "XVibe failed to generate module spec",
        { _result: spec_result }
      );
    }

    const create_result: any = await _x.execute({
      _module: "module-creator",
      _op: "create-module-spec",
      _params: {
        _spec: spec_result._spec
      }
    } as any);

    if (!create_result?._ok) {
      return create_error_result(
        "E_STUDIO_MODULE_CREATE_FAILED",
        "module-creator failed to create module artifact",
        { _result: create_result }
      );
    }

    if (params._load === false) {
      return {
        _ok: true,
        _loaded: false,
        _spec: spec_result._spec,
        _create_result: create_result
      };
    }

    const load_result: any = await _x.execute({
      _module: "module-creator",
      _op: "load-generated-module",
      _params: {
        _id: spec_result._spec._id
      }
    } as any);

    if (!load_result?._ok) {
      return create_error_result(
        "E_STUDIO_MODULE_LOAD_FAILED",
        "module-creator failed to load generated module",
        { _result: load_result }
      );
    }

    return {
      _ok: true,
      _loaded: true,
      _spec: spec_result._spec,
      _create_result: create_result,
      _load_result: load_result,
      _skills: typeof _x.getSkills === "function" ? _x.getSkills() : undefined
    };
  }

  async _op_generate_view(xcmd: XCommand): Promise<XStudioGenerateViewResult> {
    try {
      const _params = this.parse_generate_view_params(xcmd?._params);
      const _view_result = await _x.execute({
        _module: "server-xvm",
        _op: "get_view",
        _params: {
          _app_id: _params._app_id,
          _env: _params._env,
          _view_id: _params._view_id,
        },
      } as any);

      const _command_error = extract_command_error_result(_view_result);
      if (_command_error) {
        return _command_error;
      }

      if (!is_server_xvm_get_view_result(_view_result)) {
        return create_error_result(
          "E_STUDIO_INVALID_GET_VIEW_RESPONSE",
          "server-xvm returned an invalid get_view result",
          {
            _app_id: _params._app_id,
            _env: _params._env,
            _view_id: _params._view_id,
          },
        );
      }

      return this._service.generate_view_preview({
        _app_id: _view_result._app_id,
        _env: _view_result._env,
        _view_id: _params._view_id,
        _prompt: _params._prompt,
        _version: _view_result._version,
        _current_view: clone_view(_view_result._view),
      });
    } catch (_error) {
      _xlog.error("[studio] generate_view failed", _error);
      return this.normalize_error(
        _error,
        "E_STUDIO_GENERATE_VIEW",
        "Failed to generate a preview view",
      );
    }
  }

  async _op_apply_view(xcmd: XCommand): Promise<XStudioApplyViewResult> {
    try {
      const _params = this.parse_apply_view_params(xcmd?._params);
      const _normalized_view = this.normalize_view_for_apply(
        _params._view_id,
        _params._view,
      );

      const _apply_result = await _x.execute({
        _module: "server-xvm",
        _op: "push_update",
        _params: {
          _app_id: _params._app_id,
          _env: _params._env,
          _view_id: _params._view_id,
          _source: "studio:apply_view",
          _view: _normalized_view,
        },
      } as any);

      const _command_error = extract_command_error_result(_apply_result);
      if (_command_error) {
        return _command_error;
      }

      if (!is_server_xvm_push_update_result(_apply_result)) {
        return create_error_result(
          "E_STUDIO_INVALID_APPLY_RESPONSE",
          "server-xvm returned an invalid push_update result",
          {
            _app_id: _params._app_id,
            _env: _params._env,
            _view_id: _params._view_id,
          },
        );
      }

      return {
        _ok: true,
        _app_id: _apply_result._app_id,
        _env: _apply_result._env,
        _view_id: _apply_result._view_id,
        _version: _apply_result._version,
        _notified_subscribers: _apply_result._notified_subscribers,
      };
    } catch (_error) {
      _xlog.error("[studio] apply_view failed", _error);
      return this.normalize_error(
        _error,
        "E_STUDIO_APPLY_VIEW",
        "Failed to apply the view",
      );
    }
  }

  private parse_generate_view_params(_params: unknown): XStudioGenerateViewParams {
    if (!is_plain_object(_params)) {
      throw new Error("Invalid '_params': expected object");
    }

    return {
      _app_id: read_required_string(_params._app_id, "_app_id"),
      _env:
        typeof _params._env === "string" && _params._env.trim().length > 0
          ? _params._env.trim()
          : DEFAULT_ENV,
      _view_id: read_required_string(_params._view_id, "_view_id"),
      _prompt: read_required_string(_params._prompt, "_prompt"),
    };
  }

  private parse_apply_view_params(_params: unknown): XStudioApplyViewParams {
    if (!is_plain_object(_params)) {
      throw new Error("Invalid '_params': expected object");
    }

    if (!is_plain_object(_params._view)) {
      throw new Error("Invalid '_view': expected object");
    }

    return {
      _app_id: read_required_string(_params._app_id, "_app_id"),
      _env:
        typeof _params._env === "string" && _params._env.trim().length > 0
          ? _params._env.trim()
          : DEFAULT_ENV,
      _view_id: read_required_string(_params._view_id, "_view_id"),
      _view: clone_view(_params._view),
    };
  }

  private normalize_view_for_apply(
    _view_id: string,
    _view: XStudioViewData,
  ): Record<string, unknown> {
    const _normalized_view = clone_view(_view);
    const _existing_view_id =
      typeof _normalized_view._id === "string"
        ? _normalized_view._id.trim()
        : undefined;

    if (_existing_view_id && _existing_view_id !== _view_id) {
      throw new Error(
        `Invalid '_view._id': expected '${_view_id}' but received '${_existing_view_id}'`,
      );
    }

    return {
      ..._normalized_view,
      _id: _view_id,
    };
  }

  private normalize_error(
    _error: unknown,
    _fallback_code: string,
    _fallback_message: string,
  ): XStudioErrorResult {
    if (is_error_result(_error)) {
      return _error;
    }

    if (
      is_plain_object(_error) &&
      typeof _error._code === "string" &&
      typeof _error._message === "string"
    ) {
      return create_error_result(
        _error._code,
        _error._message,
        is_plain_object(_error._details) ? _error._details : undefined,
      );
    }

    const _message =
      _error instanceof Error && _error.message.trim().length > 0
        ? _error.message
        : _fallback_message;

    return create_error_result(_fallback_code, _message);
  }
}
