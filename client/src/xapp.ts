import { _x, _xem, _xlog, XUI, XVMClient } from "@xpell/ui";


import { VibeEditor } from "./editor/VibeEditor";

const editor = new VibeEditor();

const main = async () => {
  try {
    _x._verbose = true;
    _x.start();

    _x.loadModule(XUI);

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

    _xem.on("vibe:prompt:value", (payload: any) => {
      console.log("Received prompt value event:", payload);
      const source = payload?._source;
      if (!source) return;

      const input = XUI.getObject(source) as any;
      const value =
        input?.getValue?.() ??
        input?._value ??
        input?._text ??
        "";

      _xlog.log("[vibe-client] prompt:", value);
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
