export type VibeViewData = Record<string, unknown>;

export type VibeErrorData = {
  _code: string;
  _message: string;
  _details?: Record<string, unknown>;
};

export type VibeErrorResult = {
  _ok: false;
  _error: VibeErrorData;
};

export type VibeGenerateViewParams = {
  _app_id: string;
  _env?: string;
  _view_id: string;
  _prompt: string;
};

export type VibeGenerateViewMeta = {
  _mode: "deterministic_stub";
  _changed: false;
  _reason: string;
  _prompt: string;
};

export type VibeGenerateViewSuccess = {
  _ok: true;
  _app_id: string;
  _env: string;
  _view_id: string;
  _version: number;
  _current_view: VibeViewData;
  _preview_view: VibeViewData;
  _meta: VibeGenerateViewMeta;
};

export type VibeGenerateViewResult =
  | VibeGenerateViewSuccess
  | VibeErrorResult;

export type VibeApplyViewParams = {
  _app_id: string;
  _env?: string;
  _view_id: string;
  _view: VibeViewData;
};

export type VibeApplyViewSuccess = {
  _ok: true;
  _app_id: string;
  _env: string;
  _view_id: string;
  _version: number;
  _notified_subscribers: string[];
};

export type VibeApplyViewResult = VibeApplyViewSuccess | VibeErrorResult;
