import type { VibeArtifactType } from "./VibePromptBuilder.js";

function is_plain_object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function is_view_object(value: unknown): value is Record<string, unknown> {
  return is_plain_object(value) && value._type === "view";
}

function validate_view(value: unknown): Record<string, unknown> {
  if (!is_view_object(value)) {
    throw new Error("Invalid AI output: view requires _type:'view'");
  }

  return value;
}

function validate_flow(value: unknown): Record<string, unknown> {
  if (!is_plain_object(value)) {
    throw new Error("Invalid AI output: '_flow' must be an object");
  }

  if (typeof value._id !== "string" || value._id.trim().length === 0) {
    throw new Error("Invalid AI output: flow requires '_id'");
  }

  if (!Array.isArray(value._steps)) {
    throw new Error("Invalid AI output: flow requires '_steps' array");
  }

  return value;
}

function validate_entity(value: unknown): Record<string, unknown> {
  if (!is_plain_object(value)) {
    throw new Error("Invalid AI output: '_entity' must be an object");
  }

  if (typeof value._id !== "string" || value._id.trim().length === 0) {
    throw new Error("Invalid AI output: entity requires '_id'");
  }

  if (!is_plain_object(value._schema)) {
    throw new Error("Invalid AI output: entity requires '_schema' object");
  }

  return value;
}

function validate_command(value: unknown): Record<string, unknown> {
  if (!is_plain_object(value)) {
    throw new Error("Invalid AI output: '_command' must be an object");
  }

  if (typeof value._module !== "string" || value._module.trim().length === 0) {
    throw new Error("Invalid AI output: command requires '_module'");
  }

  if (typeof value._op !== "string" || value._op.trim().length === 0) {
    throw new Error("Invalid AI output: command requires '_op'");
  }

  return value;
}

export type VibeParsedOutput = {
  _artifact_type: VibeArtifactType;
  _artifact: Record<string, unknown>;
  _view?: Record<string, unknown>;
  _flow?: Record<string, unknown>;
  _entity?: Record<string, unknown>;
  _command?: Record<string, unknown>;
};

export function extract_json(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in AI output");
  }

  return raw.slice(start, end + 1);
}

export class VibeOutputParser {
  parse(
    raw_output: string,
    expected_artifact_type?: VibeArtifactType,
    opts: { _allow_raw_view?: boolean } = {},
  ): VibeParsedOutput {
    const parsed = JSON.parse(extract_json(raw_output)) as unknown;

    if (!is_plain_object(parsed)) {
      throw new Error("Invalid AI output: expected object");
    }

    if (expected_artifact_type === "view") {
      if (is_plain_object(parsed._view)) {
        const view = validate_view(parsed._view);
        return {
          _artifact_type: "view",
          _artifact: view,
          _view: view,
        };
      }

      if (opts._allow_raw_view && is_view_object(parsed)) {
        return {
          _artifact_type: "view",
          _artifact: parsed,
          _view: parsed,
        };
      }

      throw new Error("Invalid AI output: expected '_view' root");
    }

    if (expected_artifact_type === "flow") {
      if (!is_plain_object(parsed._flow)) throw new Error("Invalid AI output: expected '_flow' root");
      const flow = validate_flow(parsed._flow);
      return {
        _artifact_type: "flow",
        _artifact: flow,
        _flow: flow,
      };
    }

    if (expected_artifact_type === "entity") {
      if (!is_plain_object(parsed._entity)) throw new Error("Invalid AI output: expected '_entity' root");
      const entity = validate_entity(parsed._entity);
      return {
        _artifact_type: "entity",
        _artifact: entity,
        _entity: entity,
      };
    }

    if (expected_artifact_type === "command") {
      if (!is_plain_object(parsed._command)) throw new Error("Invalid AI output: expected '_command' root");
      const command = validate_command(parsed._command);
      return {
        _artifact_type: "command",
        _artifact: command,
        _command: command,
      };
    }

    if (is_plain_object(parsed._view)) {
      const view = validate_view(parsed._view);
      return {
        _artifact_type: "view",
        _artifact: view,
        _view: view,
      };
    }

    if (is_plain_object(parsed._flow)) {
      const flow = validate_flow(parsed._flow);
      return {
        _artifact_type: "flow",
        _artifact: flow,
        _flow: flow,
      };
    }

    if (is_plain_object(parsed._entity)) {
      const entity = validate_entity(parsed._entity);
      return {
        _artifact_type: "entity",
        _artifact: entity,
        _entity: entity,
      };
    }

    if (is_plain_object(parsed._command)) {
      const command = validate_command(parsed._command);
      return {
        _artifact_type: "command",
        _artifact: command,
        _command: command,
      };
    }

    throw new Error("Invalid AI output: missing supported artifact root");
  }
}
