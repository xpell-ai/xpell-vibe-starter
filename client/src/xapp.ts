import { _x, _xem, _xlog, Wormholes, XModule, XUI, XUIRuntime, _xvm } from "@xpell/ui";
import { VibeEditor } from "./editor/VibeEditor";
let _vibe_listener_registered = false;

const editor = new VibeEditor();

class VibeAIProxyModule extends XModule {
  constructor() {
    super({ _name: "vibe-ai" });
  }

  async _generate_view(xcmd: any) {
    return Wormholes.sendXcmd({
      _module: "vibe-ai",
      _op: "generate_view",
      _params: xcmd?._params ?? {},
    });
  }
}

const main = async () => {
  try {
    _x._verbose = true;
    _xlog._debug = true;
    /* -------------------------------------------------------------- */
    /* Load runtime + app                                             */
    /* -------------------------------------------------------------- */

    _x.loadModule(new VibeAIProxyModule());

    const client = await XUIRuntime.loadApp({
      app_id: "vibe-system",
      env: "default",
      wormhole_url: "ws://localhost:3000/wh/v2",

      onViewRendered: (view_id) => {
        _xlog.log("[vibe-client] view rendered:", view_id);
      },

      onConnectionChange: (state) => {
        _xlog.log("[vibe-client] connection:", state);
      },

      onError: (err) => {
        _xlog.error("[vibe-client] xvm error:", err);
      },

      runtime: {
        auto_start: true,
        load_flow: true,
        load_xvm: true,
        load_entity_client: true
      }
    });

    /* -------------------------------------------------------------- */
    /* Debug: log incoming updates                                    */
    /* -------------------------------------------------------------- */

    _xem.on("xvm:update", (payload: any) => {
      console.log("🔥 xvm:update", {
        view_id: payload?._view_id,
        version: payload?._version,
        view: payload?._view
      });
    });

    /* -------------------------------------------------------------- */
    /* ✅ Prompt handler (FIXED)                                      */
    /* -------------------------------------------------------------- */

    _xem.removeOwner("vibe-client");

    if (!_vibe_listener_registered) {
      _vibe_listener_registered = true;
      _xlog.log("[vibe-client] registering prompt listener");
      _xem.on(
        "vibe:prompt:send",
        async () => {
          try {
            const input = XUI.getObject("vibe-prompt") as any;

            const value =
              input?.getValue?.() ??
              input?.dom?.value ??
              input?._value ??
              input?._text ??
              "";

            if (!value || !String(value).trim()) {
              _xlog.log("[vibe-client] empty prompt");
              return;
            }

            const current_view_id = client.get_current_view_id();
            const mode = current_view_id ? "refine" : "full";

            _xlog.log("[vibe-client] generating...", {
              _mode: mode,
              _view_id: current_view_id
            });

            const current_view_json =
              current_view_id
                ? _xvm.getViewById(current_view_id)
                : null;
            _xlog.log("current view", current_view_json);
            await _x.execute({
              _module: "vibe-ai",
              _op: "generate_view",
              _params: {
                prompt: value,
                _app_id: client._app_id,
                _env: client._env,
                _mode: mode,
                ...(current_view_id ? { _view_id: current_view_id } : {}),
                _current_view: current_view_json, // 🔥 THIS is the key
              },
            });

            _xlog.log("[vibe-client] vibe request sent");
          } catch (err) {
            _xlog.error("[vibe-client] vibe request failed:", err);
          }
        },
        { _owner: "vibe-client" }
      );

      _xem.on("vibe:prompt:send", () => {
        console.log("🔥 EVENT RECEIVED");
      });
    }
    /* -------------------------------------------------------------- */
    /* Editor                                                         */
    /* -------------------------------------------------------------- */

    if (new URLSearchParams(window.location.search).get("edit") === "true") {
      editor.toggle();
    }

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        editor.toggle();
      }
    });

    _xlog.log("[vibe-client] ready");
  } catch (err) {
    _xlog.error("[vibe-client] fatal", err);
  }
};

void main();