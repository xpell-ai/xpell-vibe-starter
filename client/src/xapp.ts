import {
  _x,
  _xem,
  _xlog,
  XUI,
  XUIRuntime,
  _xvm,
  XDB
} from "@xpell/ui";

import { XStudioEditor } from "./studio/XStudioEditor";
import { XDashboardPack } from "@xpell/xdashboard";

import "@xpell/ui/xui.css";
import "@xpell/xdashboard/xdashboard.css";

type XRuntimeMode = "runtime" | "build" | "system";

let _studio_listener_registered = false;

let editor: XStudioEditor;

function getModeByURL(): XRuntimeMode {
  const params = new URLSearchParams(window.location.search);

  if (params.get("system") === "true") return "system";
  if (params.get("edit") === "true") return "build";

  return "runtime";
}

function resolveRuntimeMode(
  app_id: string
): XRuntimeMode {

  const url_mode = getModeByURL();

  // explicit URL override wins
  if (url_mode !== "runtime") {
    return url_mode;
  }
  _xlog.log("[vibe-client] resolved runtime mode from URL:", app_id, url_mode);
  // server fallback/system app
  if (app_id === "vibe-system") {
    return "system";
  }

  return "runtime";
}

async function syncClientSkills(client: any, mode: XRuntimeMode) {
  // if (mode !== "build" && mode !== "system") return;

  const skills = _x.getSkills();

  _xlog.log("[vibe-client] syncing client skills", skills)
  await client.sendXcmd({
    _module: "studio",
    _op: "sync-client-skills",
    _params: {
      _app_id: client._app_id,
      _env: client._env,
      _mode: mode,
      _skills: skills
    }
  } as any);

}

function readStudioPrompt(): string {
  const input = XUI.getObject("xstudio-prompt") as any;

  return String(
    input?.getValue?.() ??
    input?.dom?.value ??
    input?._value ??
    input?._text ??
    ""
  ).trim();
}

async function requestStudioPreview(client: any) {
  const prompt = readStudioPrompt();

  if (!prompt) {
    _xlog.log("[vibe-client] empty studio prompt");
    return;
  }

  const current_view_id = client.get_current_view_id?.();
  if (!current_view_id) {
    _xlog.warn("[vibe-client] no current view id");
    return;
  }

  const current_view_json = _xvm.getViewById(current_view_id);

  _xlog.log("[vibe-client] studio preview request", {
    _view_id: current_view_id
  });

  const result = await client.sendXcmd({
    _module: "studio",
    _op: "preview-view",
    _params: {
      _app_id: client._app_id,
      _env: client._env,
      _view_id: current_view_id,
      _prompt: prompt,
      _current_view: current_view_json
    }
  } as any);

  _xlog.log("[vibe-client] studio preview result", result);

  _xem.fire("studio:preview-received", result);
}

async function requestStudioApply(client: any) {
  const current_view_id = client.get_current_view_id?.();
  if (!current_view_id) {
    _xlog.warn("[vibe-client] no current view id");
    return;
  }

  const current_view_json = _xvm.getViewById(current_view_id);

  if (!current_view_json) {
    _xlog.warn("[vibe-client] no current view json");
    return;
  }

  _xlog.log("[vibe-client] studio apply request", {
    _view_id: current_view_id
  });

  const result = await client.sendXcmd({
    _module: "studio",
    _op: "apply-view",
    _params: {
      _app_id: client._app_id,
      _env: client._env,
      _view_id: current_view_id,
      _view: current_view_json
    }
  } as any);

  _xlog.log("[vibe-client] studio apply result", result);

  _xem.fire("studio:view-applied", result);
}

function registerStudioListeners(client: any) {
  editor = new XStudioEditor(client);
  _xem.removeOwner("studio-client");

  if (_studio_listener_registered) return;
  _studio_listener_registered = true;

  _xlog.log("[vibe-client] registering studio listeners");

  // _xem.on(
  //   "studio:preview-request",
  //   async () => {
  //     try {
  //       await requestStudioPreview(client);
  //     } catch (err) {
  //       _xlog.error("[vibe-client] studio preview failed:", err);
  //       _xem.fire("studio:error", err);
  //     }
  //   },
  //   { _owner: "studio-client" }
  // );

  // _xem.on(
  //   "studio:apply-request",
  //   async () => {
  //     try {
  //       await requestStudioApply(client);
  //     } catch (err) {
  //       _xlog.error("[vibe-client] studio apply failed:", err);
  //       _xem.fire("studio:error", err);
  //     }
  //   },
  //   { _owner: "studio-client" }
  // );

  _xem.on(
    "studio:close",
    () => {
      editor.unmount();
    },
    { _owner: "studio-client" }
  );

  _xem.on(
    "studio:open-app",
    async (payload: any) => {
      try {
        const app_id = payload?._app_id;
        const env = payload?._env ?? "default";

        if (!app_id) {
          _xlog.warn("[vibe-client] missing _app_id");
          return;
        }

        _xlog.log("[vibe-client] opening generated app", {
          _app_id: app_id,
          _env: env
        });

        XDB.setString?.("xvibe.active_app", app_id);
        XDB.set?.("xvibe.active_app", app_id);

        window.location.reload();
      } catch (err) {
        _xlog.error("[vibe-client] open generated app failed", err);
      }
    },
    { _owner: "studio-client" }
  );

  _xem.on(
    "vibe:generation-stage",
    (payload:any) => {
      _xlog.log(
        "[vibe-client] generation stage",
        payload
      );
    }
  );
}

const main = async () => {
  try {
    _x._verbose = true;
    _xlog._debug = true;


    const saved_app = XDB.getString("xvibe.active_app") as string | undefined;

    const app_id =
      typeof saved_app === "string" && saved_app.trim().length > 0
        ? saved_app
        : "vibe-system";

    const mode = resolveRuntimeMode(app_id);
    (_x as any)._runtime_mode = mode;
    _xlog.log("[vibe-client] loading app", {
      _app_id: app_id,
      _mode: mode,
      _saved_app: saved_app
    });

    const client = await XUIRuntime.loadApp({
      _app_id: app_id,
      _env: "default",
      _wormhole_url: "ws://localhost:3000/wh/v2",
      _theme: "dark",

      onViewRendered: (view_id) => {
        _xlog.log("[vibe-client] view rendered:", view_id);
      },

      onConnectionChange: (state) => {
        _xlog.log("[vibe-client] connection:", state);
      },

      onError: (err) => {
        _xlog.error("[vibe-client] xvm error:", err);
      },

      _runtime: {
        _auto_start: true,
        _load_flow: true,
        _load_xvm: true,
        _load_entity_client: true
      },

      _object_packs: [XDashboardPack],
      _modules: [],
      _debug: true
    });

    _xem.on("xvm:update", (payload: any) => {
      _xlog.log("[vibe-client] xvm:update", {
        _view_id: payload?._view_id,
        _version: payload?._version
      });
    });

    registerStudioListeners(client);

    if (mode === "build" || mode === "system") {
      try {
        await syncClientSkills(client, mode);
      } catch (err) {
        _xlog.error("[vibe-client] sync client skills failed", err);
      }

      editor.mount();
    }

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();

        editor.toggle();

        if (editor.mounted) {
          void syncClientSkills(client, "build").catch((err) => {
            _xlog.error("[vibe-client] sync client skills failed", err);
          });
        }
      }
    });

    _xlog.log("[vibe-client] ready");
  } catch (err) {
    _xlog.error("[vibe-client] fatal", err);
  }
};

void main();