import { _xlog, XUI ,XVM} from "@xpell/ui";

const STUDIO_ID = "xstudio-editor";
const PROMPT_ID = "xstudio-prompt";

type StudioObject = {
  remove?: () => void;
};

export class XStudioEditor {
  private _mounted = false;

  constructor(private client?: any) { }


  toggle(): void {
    if (this._mounted) {
      this.unmount();
      return;
    }

    this.mount();
  }



  mount(): void {
    const shell = XUI.getObject("xvibe-shell") as any;
    shell?.addClass?.("xstudio-open");

    void XVM.show("xstudio-editor", {
      region: "studio"
    });

    this._mounted = true;
  }

  unmount(): void {
    void XVM.close({
      region: "studio"
    });

    const shell = XUI.getObject("xvibe-shell") as any;
    shell?.removeClass?.("xstudio-open");

    this._mounted = false;
  }
}