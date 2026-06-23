import { _x, _xlog, XNode, _xai,_xs,_xem } from "@xpell/node";
import { AimeProvider } from "@xpell/xai-providers/aime";
import "dotenv/config";

import { XTestModule } from "./modules/Test/XTest.js";



const work_folder = process.env.WORK_FOLDER || "./work";

async function main() {
  try {
    _x._verbose = true;
    _xlog._debug = true;
    const node = new XNode();

    await node.start({
      _work_folder: work_folder,
      _system_xapps_path: "./system-xapps",
      // _web_settings: {
      //   domain: "localhost",
      //   "http-port": 3000,
      //   "enable-wormhole": true
      // },
      _xdb: {
        _type: "fs"
      },
    });

    const apiKey =
      _xs.getPath(
        "xai.providers.aime.api_key"
      ) ||
      process.env.AIME_API_KEY ||
      "";

    
    _xai.registerProvider(
      "aime",
      new AimeProvider({
        endpoint: process.env.AIME_ENDPOINT!,
        apiKey
      })
    );

    await _x.execute({
      _module: "xai",
      _op: "set_default",
      _params: { _provider: "aime" },
    });


    await _x.loadModuleAsync(new XTestModule());
    

    _xlog.log("[vibe-server] ready");

  } catch (err) {
    _xlog.error("[vibe-server] fatal", err);
    process.exit(1);
  }
}

main();
