import { _x, _xem, _xlog, Wormholes, XModule, XUI, XVMClient } from "@xpell/ui";


import { VibeEditor } from "./editor/VibeEditor";

const editor = new VibeEditor();

class XAIProxyModule extends XModule {
  constructor() {
    super({ _name: "xai" });
  }

  async _generate(xcmd: any) {
    return Wormholes.sendXcmd({
      _module: "xai",
      _op: "generate",
      _params: xcmd?._params ?? {},
    });
  }
}

const main = async () => {
  try {
    _x._verbose = true;
    _x.start();

    _x.loadModule(XUI);
    _x.loadModule(new XAIProxyModule());

    // ❗ DO NOT manually createPlayer when using XVMClient
    // XVMClient / XVM.app() handles it

    const client = new XVMClient({
      app_id: "vibe-app",
      env: "default",
      wormhole_url: "ws://localhost:3000/wh/v2",

      // optional but useful
      onViewRendered: (view_id) => {
        _xlog.log("[vibe-client] view rendered:", view_id);
      },

      onConnectionChange: (state) => {
        _xlog.log("[vibe-client] connection:", state);
      },

      onError: (err) => {
        _xlog.error("[vibe-client] xvm error:", err);
      },
    });

    await client.bootstrap();

    _xem.on("vibe:prompt:value", async (payload: any) => {
      const source = payload?._source;
      if (!source) return;

      const input = XUI.getObject(source) as any;
      const value =
        input?.getValue?.() ??
        input?.dom?.value ??
        input?._value ??
        input?._text ??
        "";

      try {
        const res = await _x.execute({
          _module: "xai",
          _op: "generate",
          _params: {
            prompt: value,
          },
        });

        _xlog.log("[vibe-client] ai response:", res?._text);
      } catch (err) {
        _xlog.error("[vibe-client] xai error:", err);
      }
    });

    /* -------------------- EDITOR -------------------- */

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
