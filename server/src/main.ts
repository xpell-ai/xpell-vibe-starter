import { _x, _xlog, XNode, _xai } from "@xpell/node";
import { MockProvider } from "@xpell/xai-providers/mock";
import { AzureProvider } from "@xpell/xai-providers/azure";
import "dotenv/config";
// import { VibeAIEngineModule } from "./modules/vibe-ai/VibeAIEngineModule.js";
import { VibeModule } from "./modules/vibe/VibeModule.js";
import { XTestModule } from "./modules/Test/XTest.js";



function is_plain_object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// async function bootstrap_default_app() {
//   const create_result = await _x.execute({
//     _module: "server-xvm",
//     _op: "create_app",
//     _params: {
//       _app_id: "vibe-app",
//       _env: "default",
//       _name: "Vibe App",
//       _entry_view_id: "main",
//     },
//   } as any);

//   const created =
//     is_plain_object(create_result) && create_result._created === true;

//   if (!created) {
//     return;
//   }

//   await _x.execute({
//     _module: "server-xvm",
//     _op: "push_update",
//     _params: {
//       _app_id: "vibe-app",
//       _env: "default",
//       _view_id: "main",
//       _view: {
//         _id: "main",
//         _type: "view",
//         _children: [
//           {
//             _id: "main_label",
//             _type: "label",
//             _text: "Hello Vibe 🚀",
//           },
//         ],
//       },
//     },
//   } as any);

//   _xlog.log("[bootstrap] created default server-xvm app");
// }

async function main() {
  try {
    _x._verbose = true;
    _xlog._debug = true;
    const node = new XNode();
    
    await node.start({
      _work_folder: "./work",
      _system_xapps_path: "./system-xapps",
      _web_settings: {
        domain: "localhost",
        "http-port": 3000,
        "enable-wormhole": true
      },
      _xdb: {
        _type: "fs"
      },
    });
    
    await _x.loadModuleAsync(new VibeModule());
    await _x.loadModuleAsync(new XTestModule());
    // await bootstrap_default_app();
    _xai.registerProvider(
      "azure",
      new AzureProvider({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        apiKey: process.env.AZURE_OPENAI_API_KEY!,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
      })
    );

    await _x.execute({
      _module: "xai",
      _op: "set_default",
      _params: { _provider: "azure" },
    });

    _xlog.log("[vibe-server] ready");

  } catch (err) {
    _xlog.error("[vibe-server] fatal", err);
    process.exit(1);
  }
}

main();
