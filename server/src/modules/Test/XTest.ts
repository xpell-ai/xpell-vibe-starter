import {
  XModule,
  type XCommand,
  XResponseOK,
  _xu
} from "@xpell/node";

export class XTestModule extends XModule {
  static _name = "xtest";
  private xu:any = _xu;

  constructor() {
    super({ _name: XTestModule._name });
  }

  async _greet(xcmd: XCommand) {
    const params = this.xu.ensure_params(xcmd?._params);

    const name = this.xu.ensure_string(params.name ?? "", "name");

    return new XResponseOK({
      greeting: `Hello ${name}`
    }).toXData();
  }
}

export default XTestModule;