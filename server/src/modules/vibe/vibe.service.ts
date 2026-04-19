import type {
  VibeGenerateViewMeta,
  VibeGenerateViewSuccess,
  VibeViewData,
} from "./vibe.types.js";

export type GenerateViewPreviewInput = {
  _app_id: string;
  _env: string;
  _view_id: string;
  _prompt: string;
  _version: number;
  _current_view: VibeViewData;
};

function clone_view(_view: VibeViewData): VibeViewData {
  return JSON.parse(JSON.stringify(_view)) as VibeViewData;
}

function create_preview_meta(_prompt: string): VibeGenerateViewMeta {
  return {
    _mode: "deterministic_stub",
    _changed: false,
    _reason: "No LLM is configured. Preview mirrors the current view.",
    _prompt,
  };
}

export class VibeService {
  generate_view_preview(
    _input: GenerateViewPreviewInput,
  ): VibeGenerateViewSuccess {
    const _current_view = clone_view(_input._current_view);
    const _preview_view = clone_view(_input._current_view);

    return {
      _ok: true,
      _app_id: _input._app_id,
      _env: _input._env,
      _view_id: _input._view_id,
      _version: _input._version,
      _current_view,
      _preview_view,
      _meta: create_preview_meta(_input._prompt),
    };
  }
}
