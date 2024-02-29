import { convertIntoNodes } from "./altNodes/altConversion";
import { tailwindMain } from "./tailwind/tailwindMain";

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
  let result = tailwindMain(convertedSelection, settings);
  figma.ui.postMessage({
    type: "code",
    data: result,
    settings: settings,
    htmlPreview: null,
    preferences: settings,
  });
};