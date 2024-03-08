import { convertIntoNodes } from "./altNodes/altConversion";
import { tailwindMain } from "./tailwind/tailwindMain";
import { pacvueMain } from "./tailwind/pacvueMain";
import { styleMain } from "./style/styleMain";

export type FrameworkTypes = "Tailwind";

export type PluginSettings = {
  framework: FrameworkTypes;
  jsx: boolean;
  inlineStyle: boolean;
  optimizeLayout: boolean;
  layerName: boolean;
  responsiveRoot: boolean;
  flutterGenerationMode: string;
  swiftUIGenerationMode: string;
  roundTailwind: boolean;
  mode: string;
};
export const run = (settings: PluginSettings) => {
  // ignore when nothing was selected
  if (figma.currentPage.selection.length === 0) {
    figma.ui.postMessage({
      type: "empty",
    });
    return;
  }

  const convertedSelection = convertIntoNodes(
    figma.currentPage.selection,
    null
  );
  let result = ''
  switch (settings.mode) {
    case "tailwind":
      let array = pacvueMain(convertedSelection, settings)
      result = tailwindMain(array, settings)
      break
    case "style":
      result = styleMain(convertedSelection)
      break
    default:
      break
  }
  figma.ui.postMessage({
    type: "code",
    data: result,
    settings: settings,
    htmlPreview: null,
    preferences: settings,
  });
};
export const codegenRun = (selection :any, settings: PluginSettings): string => { 
  const convertedSelection = convertIntoNodes(selection,null);
  // let array = pacvueMain(convertedSelection, settings)
  // let result = tailwindMain(array, settings)
  let result = styleMain(convertedSelection)
  return result
}