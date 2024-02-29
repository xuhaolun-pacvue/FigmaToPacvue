import {
  run,
  PluginSettings,
} from "./backend";

let userPluginSettings: PluginSettings;

const defaultPluginSettings: PluginSettings = {
  framework: "Tailwind",
  jsx: false,
  optimizeLayout: true,
  layerName: false,
  inlineStyle: true,
  responsiveRoot: false,
  flutterGenerationMode: "snippet",
  swiftUIGenerationMode: "snippet",
  roundTailwind: false,
};

// A helper type guard to ensure the key belongs to the PluginSettings type
function isKeyOfPluginSettings(key: string): key is keyof PluginSettings {
  return key in defaultPluginSettings;
}

const getUserSettings = async () => {
  const possiblePluginSrcSettings =
    (await figma.clientStorage.getAsync("userPluginSettings")) ?? {};

  const updatedPluginSrcSettings = {
    ...defaultPluginSettings,
    ...Object.keys(defaultPluginSettings).reduce((validSettings, key) => {
      if (
        isKeyOfPluginSettings(key) &&
        key in possiblePluginSrcSettings &&
        typeof possiblePluginSrcSettings[key] ===
          typeof defaultPluginSettings[key]
      ) {
        validSettings[key] = possiblePluginSrcSettings[key] as any;
      }
      return validSettings;
    }, {} as Partial<PluginSettings>),
  };

  userPluginSettings = updatedPluginSrcSettings as PluginSettings;
};


const initSettings = async () => {
  await getUserSettings();
  figma.ui.postMessage({
    type: "pluginSettingChanged",
    data: userPluginSettings,
  });

  safeRun(userPluginSettings);
};
const safeRun = (settings: PluginSettings) => {
  try {
    run(settings);
  } catch (e) {
    console.error(e)
    if (e && typeof e === "object" && "message" in e) {
      console.log("error1: ", (e as any).stack);
      figma.ui.postMessage({
        type: "error",
        data: e.message,
      });
    }
  }
};

const standardMode = async () => {
  figma.showUI(__html__, { width: 450, height: 550, themeColors: true });
  await initSettings();
  figma.on("selectionchange", () => {
    safeRun(userPluginSettings);
  });
  figma.ui.onmessage = (msg) => {
    console.log("[node] figma.ui.onmessage", msg);
    if (msg.type === "pluginSettingChanged") {
      (userPluginSettings as any)[msg.key] = msg.value;
      figma.clientStorage.setAsync("userPluginSettings", userPluginSettings);
      safeRun(userPluginSettings);
    }
  };
};

switch (figma.mode) {
  case "default":
  case "inspect":
    standardMode();
    break;
  case "codegen":
    // codegenMode();
    break;
  default:
    break;
}
