import path from "node:path";

import { _x, _xlog, XNode, XDB, XDBStorageFS, _xai } from "@xpell/node";
import { MockProvider } from "@xpell/xai-providers/mock";
import { AzureProvider } from "@xpell/xai-providers/azure";

import { VibeModule } from "./modules/vibe/VibeModule.js";

function create_xdb_storage() {
  const xdb_root = path.resolve("./work/xdb") + path.sep;

  return new XDBStorageFS({
    xdbFolder: xdb_root,
    dataFolder: path.join(xdb_root, "data") + path.sep,
    cacheFolder: path.join(xdb_root, "cache") + path.sep,
    backupFolder: path.join(xdb_root, "backup") + path.sep,
    objectsFolder: path.join(xdb_root, "objects") + path.sep,
  });
}

function is_plain_object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function bootstrap_default_app() {
  const create_result = await _x.execute({
    _module: "server-xvm",
    _op: "create_app",
    _params: {
      _app_id: "vibe-app",
      _env: "default",
      _name: "Vibe App",
      _entry_view_id: "main",
    },
  } as any);

  const created =
    is_plain_object(create_result) && create_result._created === true;

  if (!created) {
    return;
  }

  await _x.execute({
    _module: "server-xvm",
    _op: "push_update",
    _params: {
      _app_id: "vibe-app",
      _env: "default",
      _view_id: "main",
      _view: {
        _id: "main",
        _type: "view",
        _children: [
          {
            _id: "main_label",
            _type: "label",
            _text: "Hello Vibe 🚀",
          },
        ],
      },
    },
  } as any);

  _xlog.log("[bootstrap] created default server-xvm app");
}

async function main() {
  try {
    _x._verbose = true;
    _x.start();

    XDB.init({ storage: create_xdb_storage() });
    _x.loadModule(XDB);

    _x.loadModule(new VibeModule());


    const node = new XNode();

    await node.start({
      work_folder: "./work",
      web_settings: {
        domain: "localhost",
        "http-port": 3000,
        "enable-wormhole": true
      }
    });

    await bootstrap_default_app();
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
