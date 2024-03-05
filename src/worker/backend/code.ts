import { convertIntoNodes } from "./altNodes/altConversion";
import { tailwindMain } from "./tailwind/tailwindMain";
import { tailwindMain1 } from "./tailwind/tailwindMain1";
import { tailwindMain2 } from "./tailwind/tailwindMain2";

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
  // let result = tailwindMain(convertedSelection, settings);
  let array = tailwindMain1(convertedSelection, settings)
  let result1 = tailwindMain(array, settings)
  figma.ui.postMessage({
    type: "code",
    data: result1,
    settings: settings,
    htmlPreview: null,
    preferences: settings,
  });
};
export const codegenRun = (selection :any, settings: PluginSettings): string => { 
  const convertedSelection = convertIntoNodes(selection,null);
  let array = tailwindMain1(convertedSelection, settings)
  let result = tailwindMain(array, settings)
  return result
}