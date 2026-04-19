import { _x, _xlog, type XCommand, XModule } from "@xpell/node";

import { VibeService } from "./vibe.service.js";
import type {
  VibeApplyViewParams,
  VibeApplyViewResult,
  VibeErrorResult,
  VibeGenerateViewParams,
  VibeGenerateViewResult,
  VibeViewData,
} from "./vibe.types.js";

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

function clone_view(_view: VibeViewData): VibeViewData {
  return JSON.parse(JSON.stringify(_view)) as VibeViewData;
}

function create_error_result(
  _code: string,
  _message: string,
  _details?: Record<string, unknown>,
): VibeErrorResult {
  return {
    _ok: false,
    _error: {
      _code,
      _message,
      ...(_details ? { _details } : {}),
    },
  };
}

function is_error_result(_value: unknown): _value is VibeErrorResult {
  return (
    is_plain_object(_value) &&
    _value._ok === false &&
    is_plain_object(_value._error) &&
    typeof _value._error._code === "string" &&
    typeof _value._error._message === "string"
  );
}

function extract_command_error_result(_value: unknown): VibeErrorResult | null {
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
        : "E_VIBE_COMMAND_FAILED";
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
    "E_VIBE_COMMAND_FAILED",
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

export class VibeModule extends XModule {
  static _name = "vibe";

  private readonly _service: VibeService;

  constructor() {
    super({ _name: VibeModule._name });
    this._service = new VibeService();
  }

  async _op_generate_view(xcmd: XCommand): Promise<VibeGenerateViewResult> {
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
          "E_VIBE_INVALID_GET_VIEW_RESPONSE",
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
      _xlog.error("[vibe] generate_view failed", _error);
      return this.normalize_error(
        _error,
        "E_VIBE_GENERATE_VIEW",
        "Failed to generate a preview view",
      );
    }
  }

  async _op_apply_view(xcmd: XCommand): Promise<VibeApplyViewResult> {
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
          _source: "vibe:apply_view",
          _view: _normalized_view,
        },
      } as any);

      const _command_error = extract_command_error_result(_apply_result);
      if (_command_error) {
        return _command_error;
      }

      if (!is_server_xvm_push_update_result(_apply_result)) {
        return create_error_result(
          "E_VIBE_INVALID_APPLY_RESPONSE",
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
      _xlog.error("[vibe] apply_view failed", _error);
      return this.normalize_error(
        _error,
        "E_VIBE_APPLY_VIEW",
        "Failed to apply the view",
      );
    }
  }

  private parse_generate_view_params(_params: unknown): VibeGenerateViewParams {
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

  private parse_apply_view_params(_params: unknown): VibeApplyViewParams {
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
    _view: VibeViewData,
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
  ): VibeErrorResult {
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
