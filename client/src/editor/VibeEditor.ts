import { XUI } from "@xpell/ui";

const EDITOR_ID = "vibe-editor";
const SEND_ID = "vibe-send";

type EditorObject = {
  remove?: () => void;
};

export class VibeEditor {
  private _visible = false;

  get visible(): boolean {
    return this._visible;
  }

  toggle(): void {
    if (XUI.getObject(EDITOR_ID)) {
      this.unmount();
      return;
    }

    this.mount();
  }

  mount(): void {
    if (XUI.getObject(EDITOR_ID)) {
      this._visible = true;
      return;
    }

    XUI.add({
      _id: EDITOR_ID,
      _type: "view",
      _on: {
        "vibe:prompt:submit": {
          _op: "fire",
          _params: {
            event: "vibe:prompt:value",
            data: {
              _source: "vibe-prompt",
            },
          },
        } as any,
      },
      style:
        "position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;flex-direction:column;gap:12px;padding:16px;background:var(--x-surface, #161616);color:var(--x-text, #f5f5f5);border-top:1px solid var(--x-border, #333333);box-sizing:border-box;",
      _children: [
        {
          _id: "vibe-editor-title",
          _type: "label",
          _text: "Xpell Vibe",
          style: "font-size:16px;font-weight:600;",
        },
        {
          _id: "vibe-prompt",
          _type: "textarea",
          _text: "",
          placeholder: "Describe the change you want...",
          rows: "4",
          style:
            "width:100%;min-height:120px;padding:12px;box-sizing:border-box;background:var(--x-panel, #202020);color:var(--x-text, #f5f5f5);border:1px solid var(--x-border, #444444);",
        },
        {
          _id: "vibe-editor-actions",
          _type: "view",
          style: "display:flex;justify-content:flex-end;",
          _children: [
            {
              _id: SEND_ID,
              _type: "button",
              _text: "Send",
              _debug:true,
              _on_click: {
                _op: "fire",
                _params: {
                  event: "vibe:prompt:value",
                  data: {
                    _source: "vibe-prompt",
                  },
                },
              },
              style:
                "padding:8px 14px;background:var(--x-accent, #2f6fed);color:#ffffff;border:0;cursor:pointer;",
            },
          ],
        },
      ],
    });

    this._visible = !!XUI.getObject(EDITOR_ID);
  }

  unmount(): void {
    const editor = XUI.getObject(EDITOR_ID) as unknown as EditorObject | null;
    editor?.remove?.();
    this._visible = !!XUI.getObject(EDITOR_ID);
  }
}
