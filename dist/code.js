"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __pow = Math.pow;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/worker/backend/altNodes/convertNodesOnRectangle.ts
  var convertNodesOnRectangle = (node) => {
    if (node.children.length < 2) {
      return node;
    }
    if (!node.id) {
      throw new Error(
        "Node is missing an id! This error should only happen in tests."
      );
    }
    return node;
  };

  // src/worker/backend/altNodes/altConversion.ts
  var globalTextStyleSegments = {};
  var cloneNode = (node) => {
    const cloned = {};
    for (const prop in node) {
      if (prop !== "parent" && prop !== "children" && prop !== "horizontalPadding" && prop !== "verticalPadding" && prop !== "mainComponent" && prop !== "masterComponent" && prop !== "variantProperties" && prop !== "componentPropertyDefinitions" && prop !== "exposedInstances" && prop !== "componentProperties" && prop !== "componenPropertyReferences") {
        cloned[prop] = node[prop];
      }
    }
    return cloned;
  };
  var frameNodeTo = (node, parent) => {
    if (node.children.length === 0) {
      return frameToRectangleNode(node, parent);
    }
    const clone = standardClone(node, parent);
    overrideReadonlyProperty(
      clone,
      "children",
      convertIntoNodes(node.children, clone)
    );
    return convertNodesOnRectangle(clone);
  };
  var frameToRectangleNode = (node, parent) => {
    const clonedNode = cloneNode(node);
    if (parent) {
      assignParent(clonedNode, parent);
    }
    overrideReadonlyProperty(clonedNode, "type", "RECTANGLE");
    return clonedNode;
  };
  var overrideReadonlyProperty = (obj, prop, value) => {
    Object.defineProperty(obj, prop, {
      value,
      writable: true,
      configurable: true
    });
  };
  var assignParent = (node, parent) => {
    if (parent) {
      overrideReadonlyProperty(node, "parent", parent);
    }
  };
  var standardClone = (node, parent) => {
    const clonedNode = cloneNode(node);
    if (parent !== null) {
      assignParent(clonedNode, parent);
    }
    return clonedNode;
  };
  var convertIntoNodes = (sceneNode, parent = null) => {
    const mapped = sceneNode.map((node) => {
      switch (node.type) {
        case "RECTANGLE":
        case "ELLIPSE":
          return standardClone(node, parent);
        case "LINE":
          return standardClone(node, parent);
        case "FRAME":
        case "INSTANCE":
        case "COMPONENT":
        case "COMPONENT_SET":
          return frameNodeTo(node, parent);
        case "GROUP":
          if (node.children.length === 1 && node.visible) {
            return convertIntoNodes(node.children, parent)[0];
          }
          const iconToRect = iconToRectangle(node, parent);
          if (iconToRect != null) {
            return iconToRect;
          }
          const clone = standardClone(node, parent);
          overrideReadonlyProperty(
            clone,
            "children",
            convertIntoNodes(node.children, clone)
          );
          return convertNodesOnRectangle(clone);
        case "TEXT":
          globalTextStyleSegments[node.id] = node.getStyledTextSegments([
            "fontName",
            "fills",
            "fontSize",
            "fontWeight",
            "hyperlink",
            "indentation",
            "letterSpacing",
            "lineHeight",
            "listOptions",
            "textCase",
            "textDecoration",
            "textStyleId",
            "fillStyleId"
          ]);
          return standardClone(node, parent);
        case "STAR":
        case "POLYGON":
        case "VECTOR":
          return standardClone(node, parent);
        case "SECTION":
          const sectionClone = standardClone(node, parent);
          overrideReadonlyProperty(
            sectionClone,
            "children",
            convertIntoNodes(node.children, sectionClone)
          );
          return sectionClone;
        case "BOOLEAN_OPERATION":
          const clonedOperation = standardClone(node, parent);
          overrideReadonlyProperty(clonedOperation, "type", "RECTANGLE");
          clonedOperation.fills = [
            {
              type: "IMAGE",
              scaleMode: "FILL",
              imageHash: "0",
              opacity: 1,
              visible: true,
              blendMode: "NORMAL",
              imageTransform: [
                [1, 0, 0],
                [0, 1, 0]
              ]
            }
          ];
          return clonedOperation;
        default:
          return null;
      }
    });
    return mapped.filter(notEmpty);
  };
  var iconToRectangle = (node, parent) => {
    if (false) {
    }
    return null;
  };
  function notEmpty(value) {
    return value !== null && value !== void 0;
  }

  // src/worker/backend/common/retrieveFill.ts
  var retrieveTopFill = (fills) => {
    if (fills && fills !== figma.mixed && fills.length > 0) {
      return [...fills].reverse().find((d) => d.visible !== false);
    }
  };

  // src/worker/backend/common/indentString.ts
  var indentString = (str, indentLevel = 2) => {
    const regex = /^(?!\s*$)/gm;
    return str.replace(regex, " ".repeat(indentLevel));
  };

  // src/worker/backend/common/commonChildrenOrder.ts
  var commonSortChildrenWhenInferredAutoLayout = (node, optimize) => {
    if (!node.children)
      return [];
    if (node.children.length <= 1) {
      return node.children;
    }
    if (optimize && "inferredAutoLayout" in node && node.inferredAutoLayout !== null) {
      const children = [...node.children];
      switch (node.inferredAutoLayout.layoutMode) {
        case "HORIZONTAL":
          return children.sort((a, b) => a.x - b.x);
        case "NONE":
        case "VERTICAL":
          return children.sort((a, b) => a.y - b.y);
      }
    }
    return node.children;
  };

  // src/worker/backend/common/numToAutoFixed.ts
  var sliceNum = (num) => {
    return num.toFixed(2).replace(/\.00$/, "");
  };
  function className(name) {
    const words = name.split(/[^a-zA-Z0-9]+/);
    const camelCaseWords = words.map((word, index) => {
      if (index === 0) {
        const cleanedWord = word.replace(/^[^a-zA-Z]+/g, "");
        return cleanedWord.charAt(0).toUpperCase() + cleanedWord.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    return camelCaseWords.join("");
  }

  // src/worker/backend/tailwind/conversionTables.ts
  var nearestValue = (goal, array) => {
    return array.reduce((prev, curr) => {
      return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
    });
  };
  var exactValue = (goal, array) => {
    for (let i = 0; i < array.length; i++) {
      const diff = Math.abs(goal - array[i]);
      if (diff <= 0.05) {
        return array[i];
      }
    }
    return null;
  };
  var pxToRemToTailwind = (value, conversionMap) => {
    const keys = Object.keys(conversionMap).map((d) => +d);
    const convertedValue = exactValue(value / 16, keys);
    if (convertedValue) {
      return conversionMap[convertedValue];
    }
    return `[${sliceNum(value)}px]`;
  };
  var pxToTailwind = (value, conversionMap) => {
    const keys = Object.keys(conversionMap).map((d) => +d);
    const convertedValue = exactValue(value, keys);
    if (convertedValue) {
      return conversionMap[convertedValue];
    }
    return `[${sliceNum(value)}px]`;
  };
  var mapFontSize = {
    0.75: "xs",
    1: "base",
    1.125: "lg",
    1.25: "xl",
    1.5: "2xl",
    1.875: "3xl",
    2.25: "4xl",
    3: "5xl",
    3.75: "6xl",
    4.5: "7xl",
    6: "8xl",
    8: "9xl"
  };
  var mapBorderRadius = {
    // 0: "none",
    0.125: "sm",
    0.25: "",
    0.375: "md",
    0.5: "lg",
    0.75: "xl",
    1: "2xl",
    1.5: "3xl",
    10: "full"
  };
  var mapBlur = {
    0: "none",
    4: "sm",
    8: "",
    12: "md",
    16: "lg",
    24: "xl",
    40: "2xl",
    64: "3xl"
  };
  var mapWidthHeightSize = {
    // '0: 0',
    1: "px",
    2: "0.5",
    4: "1",
    6: "1.5",
    8: "2",
    10: "2.5",
    12: "3",
    14: "3.5",
    16: "4",
    20: "5",
    24: "6",
    28: "7",
    32: "8",
    36: "9",
    40: "10",
    44: "11",
    48: "12",
    56: "14",
    64: "16",
    80: "20",
    96: "24",
    112: "28",
    128: "32",
    144: "36",
    160: "40",
    176: "44",
    192: "48",
    208: "52",
    224: "56",
    240: "60",
    256: "64",
    288: "72",
    320: "80",
    384: "96"
  };
  var opacityValues = [
    0,
    5,
    10,
    20,
    25,
    30,
    40,
    50,
    60,
    70,
    75,
    80,
    90,
    95
  ];
  var nearestOpacity = (nodeOpacity) => nearestValue(nodeOpacity * 100, opacityValues);
  var mapLetterSpacing = {
    "-0.05": "tighter",
    "-0.025": "tight",
    // 0: "normal",
    0.025: "wide",
    0.05: "wider",
    0.1: "widest"
  };
  var pxToLetterSpacing = (value) => pxToRemToTailwind(value, mapLetterSpacing);
  var pxToFontSize = (value) => pxToRemToTailwind(value, mapFontSize);
  var pxToBorderRadius = (value) => pxToRemToTailwind(value, mapBorderRadius);
  var pxToBlur = (value) => pxToTailwind(value, mapBlur);
  var pxToLayoutSize = (value) => {
    const tailwindValue = pxToTailwind(value, mapWidthHeightSize);
    if (tailwindValue) {
      return tailwindValue;
    }
    return `[${sliceNum(value)}px]`;
  };

  // src/worker/backend/tailwind/builderImpl/tailwindAutoLayout.ts
  var getFlexDirection = (node) => node.layoutMode === "HORIZONTAL" ? "" : "flex-col";
  var getJustifyContent = (node) => {
    switch (node.primaryAxisAlignItems) {
      case "MIN":
        return "justify-start";
      case "CENTER":
        return "justify-center";
      case "MAX":
        return "justify-end";
      case "SPACE_BETWEEN":
        return "justify-between";
    }
  };
  var getAlignItems = (node) => {
    switch (node.counterAxisAlignItems) {
      case "MIN":
        return "items-start";
      case "CENTER":
        return "items-center";
      case "MAX":
        return "items-end";
      case "BASELINE":
        return "items-baseline";
    }
  };
  var getGap = (node) => node.itemSpacing > 0 && node.primaryAxisAlignItems !== "SPACE_BETWEEN" ? `gap-${pxToLayoutSize(node.itemSpacing)}` : "";
  var tailwindAutoLayoutProps = (node, autoLayout) => Object.values({
    flexDirection: getFlexDirection(autoLayout),
    justifyContent: getJustifyContent(autoLayout),
    alignItems: getAlignItems(autoLayout),
    gap: getGap(autoLayout),
    flex: "flex"
    // flex: getFlex(node, autoLayout),
  }).filter((value) => value !== "").join(" ");

  // src/worker/backend/tailwind/builderImpl/tailwindShadow.ts
  var tailwindShadow = (node) => {
    if (node.effects && node.effects.length > 0) {
      const dropShadow = node.effects.filter(
        (d) => d.type === "DROP_SHADOW" && d.visible
      );
      let boxShadow = "";
      if (dropShadow.length > 0) {
        boxShadow = "shadow";
      }
      const innerShadow = node.effects.filter((d) => d.type === "INNER_SHADOW").length > 0 ? "shadow-inner" : "";
      return [boxShadow, innerShadow];
    }
    return [];
  };

  // src/worker/backend/tailwind/builderImpl/tailwindBlend.ts
  var tailwindOpacity = (node) => {
    if (node.opacity !== void 0 && node.opacity !== 1) {
      return `opacity-${nearestOpacity(node.opacity)}`;
    }
    return "";
  };
  var tailwindBlendMode = (node) => {
    if (node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
      switch (node.blendMode) {
        case "MULTIPLY":
          return "mix-blend-multiply";
        case "SCREEN":
          return "mix-blend-screen";
        case "OVERLAY":
          return "mix-blend-overlay";
        case "DARKEN":
          return "mix-blend-darken";
        case "LIGHTEN":
          return "mix-blend-lighten";
        case "COLOR_DODGE":
          return "mix-blend-color-dodge";
        case "COLOR_BURN":
          return "mix-blend-color-burn";
        case "HARD_LIGHT":
          return "mix-blend-hard-light";
        case "SOFT_LIGHT":
          return "mix-blend-soft-light";
        case "DIFFERENCE":
          return "mix-blend-difference";
        case "EXCLUSION":
          return "mix-blend-exclusion";
        case "HUE":
          return "mix-blend-hue";
        case "SATURATION":
          return "mix-blend-saturation";
        case "COLOR":
          return "mix-blend-color";
        case "LUMINOSITY":
          return "mix-blend-luminosity";
      }
      return "";
    }
    return "";
  };
  var tailwindVisibility = (node) => {
    if (node.visible !== void 0 && !node.visible) {
      return "invisible";
    }
    return "";
  };
  var tailwindRotation = (node) => {
    if (node.rotation !== void 0 && Math.round(node.rotation) !== 0) {
      const allowedValues = [
        -180,
        -90,
        -45,
        -12,
        -6,
        -3,
        -2,
        -1,
        1,
        2,
        3,
        6,
        12,
        45,
        90,
        180
      ];
      let nearest = exactValue(-node.rotation, allowedValues);
      if (nearest) {
        let minusIfNegative = "";
        if (nearest < 0) {
          minusIfNegative = "-";
          nearest = -nearest;
        }
        return `origin-top-left ${minusIfNegative}rotate-${nearest}`;
      } else {
        return `origin-top-left rotate-[${sliceNum(-node.rotation)}deg]`;
      }
    }
    return "";
  };

  // src/worker/backend/common/commonRadius.ts
  var getCommonRadius = (node) => {
    if ("cornerRadius" in node && node.cornerRadius !== figma.mixed && node.cornerRadius) {
      return { all: node.cornerRadius };
    }
    if ("topLeftRadius" in node) {
      if (node.topLeftRadius === node.topRightRadius && node.topLeftRadius === node.bottomRightRadius && node.topLeftRadius === node.bottomLeftRadius) {
        return { all: node.topLeftRadius };
      }
      return {
        topLeft: node.topLeftRadius,
        topRight: node.topRightRadius,
        bottomRight: node.bottomRightRadius,
        bottomLeft: node.bottomLeftRadius
      };
    }
    return { all: 0 };
  };

  // src/worker/backend/common/commonStroke.ts
  var commonStroke = (node, divideBy = 1) => {
    if (!("strokes" in node) || !node.strokes || node.strokes.length === 0) {
      return null;
    }
    if ("strokeTopWeight" in node) {
      if (node.strokeTopWeight === node.strokeBottomWeight && node.strokeTopWeight === node.strokeLeftWeight && node.strokeTopWeight === node.strokeRightWeight) {
        return { all: node.strokeTopWeight / divideBy };
      }
      return {
        left: node.strokeLeftWeight / divideBy,
        top: node.strokeTopWeight / divideBy,
        right: node.strokeRightWeight / divideBy,
        bottom: node.strokeBottomWeight / divideBy
      };
    } else if (node.strokeWeight !== figma.mixed && node.strokeWeight !== 0) {
      return { all: node.strokeWeight / divideBy };
    }
    return null;
  };

  // src/worker/backend/tailwind/builderImpl/tailwindBorder.ts
  var tailwindBorderWidth = (node) => {
    const commonBorder = commonStroke(node);
    if (!commonBorder) {
      return "";
    }
    const getBorder = (weight, kind) => {
      const allowedValues = [1, 2, 4, 8];
      const nearest = nearestValue(weight, allowedValues);
      if (nearest === 1) {
        return `border${kind}`;
      } else {
        return `border${kind}-${nearest}`;
      }
    };
    if ("all" in commonBorder) {
      if (commonBorder.all === 0) {
        return "";
      }
      return getBorder(commonBorder.all, "");
    }
    const comp = [];
    if (commonBorder.left !== 0) {
      comp.push(getBorder(commonBorder.left, "-l"));
    }
    if (commonBorder.right !== 0) {
      comp.push(getBorder(commonBorder.right, "-r"));
    }
    if (commonBorder.top !== 0) {
      comp.push(getBorder(commonBorder.top, "-t"));
    }
    if (commonBorder.bottom !== 0) {
      comp.push(getBorder(commonBorder.bottom, "-b"));
    }
    return comp.join(" ");
  };
  var tailwindBorderRadius = (node) => {
    if (node.type === "ELLIPSE") {
      return "rounded-full";
    }
    const getRadius = (radius2) => {
      const r = pxToBorderRadius(radius2);
      if (r) {
        return `-${r}`;
      }
      return "";
    };
    const radius = getCommonRadius(node);
    if ("all" in radius) {
      if (radius.all === 0) {
        return "";
      } else if (radius.all > 999 && node.width < 1e3 && node.height < 1e3) {
        return "rounded-full";
      }
      return `rounded${getRadius(radius.all)}`;
    }
    let comp = [];
    if (radius.topLeft !== 0) {
      comp.push(`rounded-tl${getRadius(radius.topLeft)}`);
    }
    if (radius.topRight !== 0) {
      comp.push(`rounded-tr${getRadius(radius.topRight)}`);
    }
    if (radius.bottomLeft !== 0) {
      comp.push(`rounded-bl${getRadius(radius.bottomLeft)}`);
    }
    if (radius.bottomRight !== 0) {
      comp.push(`rounded-br${getRadius(radius.bottomRight)}`);
    }
    return comp.join(" ");
  };

  // src/worker/backend/nearest-color/nearestColor.ts
  function nearestColor(needle, colors) {
    needle = parseColor(needle);
    let distanceSq;
    let minDistanceSq = Infinity;
    let rgb;
    let value;
    for (let i = 0; i < colors.length; ++i) {
      rgb = colors[i].rgb;
      distanceSq = __pow(needle.r - rgb.r, 2) + __pow(needle.g - rgb.g, 2) + __pow(needle.b - rgb.b, 2);
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        value = colors[i];
      }
    }
    return value.source;
  }
  function mapColors(colors) {
    return colors.map((color) => createColorSpec(color));
  }
  var nearestColorFrom = (availableColors) => {
    const colors = mapColors(availableColors);
    return (hex) => nearestColor(hex, colors);
  };
  function parseColor(source) {
    let red, green, blue;
    if (typeof source === "object") {
      return source;
    }
    let hexMatchArr = source.match(/^#?((?:[0-9a-f]{3}){1,2})$/i);
    if (hexMatchArr) {
      const hexMatch = hexMatchArr[1];
      if (hexMatch.length === 3) {
        hexMatchArr = [
          hexMatch.charAt(0) + hexMatch.charAt(0),
          hexMatch.charAt(1) + hexMatch.charAt(1),
          hexMatch.charAt(2) + hexMatch.charAt(2)
        ];
      } else {
        hexMatchArr = [
          hexMatch.substring(0, 2),
          hexMatch.substring(2, 4),
          hexMatch.substring(4, 6)
        ];
      }
      red = parseInt(hexMatchArr[0], 16);
      green = parseInt(hexMatchArr[1], 16);
      blue = parseInt(hexMatchArr[2], 16);
      return { r: red, g: green, b: blue };
    }
    throw Error(`"${source}" is not a valid color`);
  }
  function createColorSpec(input) {
    return {
      source: input,
      rgb: parseColor(input)
    };
  }

  // src/worker/backend/common/color.ts
  var gradientAngle = (fill) => {
    const decomposed = decomposeRelativeTransform(
      fill.gradientTransform[0],
      fill.gradientTransform[1]
    );
    return decomposed.rotation * 180 / Math.PI;
  };
  var decomposeRelativeTransform = (t1, t2) => {
    const a = t1[0];
    const b = t1[1];
    const c = t1[2];
    const d = t2[0];
    const e = t2[1];
    const f = t2[2];
    const delta = a * d - b * c;
    const result = {
      translation: [e, f],
      rotation: 0,
      scale: [0, 0],
      skew: [0, 0]
    };
    if (a !== 0 || b !== 0) {
      const r = Math.sqrt(a * a + b * b);
      result.rotation = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
      result.scale = [r, delta / r];
      result.skew = [Math.atan((a * c + b * d) / (r * r)), 0];
    }
    return result;
  };

  // src/worker/backend/tailwind/builderImpl/tailwindColor.ts
  var tailwindColorFromFills = (fills, kind) => {
    const fill = retrieveTopFill(fills);
    if (fill && fill.type === "SOLID") {
      return tailwindSolidColor(fill.color, fill.opacity, kind);
    } else if (fill && (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_DIAMOND")) {
      if (fill.gradientStops.length > 0) {
        return tailwindSolidColor(
          fill.gradientStops[0].color,
          fill.opacity,
          kind
        );
      }
    }
    return "";
  };
  var tailwindSolidColor = (color, opacity, kind) => {
    const opacityProp = opacity !== 1 ? `${kind}-opacity-${nearestOpacity(opacity != null ? opacity : 1)}` : null;
    var opacity1 = opacity != null ? opacity : 1;
    var colorProp = `${kind}-${getTailwindFromFigmaRGB(color, opacity1)}`;
    if (["text-[var(--color-title--)]", "bg-[var(--el-color-white)]"].includes(colorProp)) {
      colorProp = "";
    }
    return [colorProp, opacityProp].filter((d) => d).join(" ");
  };
  var tailwindGradientFromFills = (fills) => {
    const fill = retrieveTopFill(fills);
    if ((fill == null ? void 0 : fill.type) === "GRADIENT_LINEAR") {
      return tailwindGradient(fill);
    }
    return "";
  };
  var tailwindGradient = (fill) => {
    const direction = gradientDirection(gradientAngle(fill));
    if (fill.gradientStops.length === 1) {
      const fromColor = getTailwindFromFigmaRGB(fill.gradientStops[0].color);
      return `${direction} from-${fromColor}`;
    } else if (fill.gradientStops.length === 2) {
      const fromColor = getTailwindFromFigmaRGB(fill.gradientStops[0].color);
      const toColor = getTailwindFromFigmaRGB(fill.gradientStops[1].color);
      return `${direction} from-${fromColor} to-${toColor}`;
    } else {
      const fromColor = getTailwindFromFigmaRGB(fill.gradientStops[0].color);
      const viaColor = getTailwindFromFigmaRGB(fill.gradientStops[1].color);
      const toColor = getTailwindFromFigmaRGB(
        fill.gradientStops[fill.gradientStops.length - 1].color
      );
      return `${direction} from-${fromColor} via-${viaColor} to-${toColor}`;
    }
  };
  var gradientDirection = (angle) => {
    switch (nearestValue(angle, [-180, -135, -90, -45, 0, 45, 90, 135, 180])) {
      case 0:
        return "bg-gradient-to-r";
      case 45:
        return "bg-gradient-to-br";
      case 90:
        return "bg-gradient-to-b";
      case 135:
        return "bg-gradient-to-bl";
      case -45:
        return "bg-gradient-to-tr";
      case -90:
        return "bg-gradient-to-t";
      case -135:
        return "bg-gradient-to-tl";
      default:
        return "bg-gradient-to-l";
    }
  };
  var tailwindColors = {
    "#000": "black",
    "#fff": "white",
    "#f8fafc": "slate-50",
    "#f1f5f9": "slate-100",
    "#e2e8f0": "slate-200",
    "#cbd5e1": "slate-300",
    "#94a3b8": "slate-400",
    "#64748b": "slate-500",
    "#475569": "slate-600",
    "#334155": "slate-700",
    "#1e293b": "slate-800",
    "#0f172a": "slate-900",
    "#020617": "slate-950",
    "#f9fafb": "gray-50",
    "#f3f4f6": "gray-100",
    "#e5e7eb": "gray-200",
    "#d1d5db": "gray-300",
    "#9ca3af": "gray-400",
    "#6b7280": "gray-500",
    "#4b5563": "gray-600",
    "#374151": "gray-700",
    "#1f2937": "gray-800",
    "#111827": "gray-900",
    "#030712": "gray-950",
    "#fafafa": "neutral-50",
    "#f4f4f5": "zinc-100",
    "#e4e4e7": "zinc-200",
    "#d4d4d8": "zinc-300",
    "#a1a1aa": "zinc-400",
    "#71717a": "zinc-500",
    "#52525b": "zinc-600",
    "#3f3f46": "zinc-700",
    "#27272a": "zinc-800",
    "#18181b": "zinc-900",
    "#09090b": "zinc-950",
    "#f5f5f5": "neutral-100",
    "#e5e5e5": "neutral-200",
    "#d4d4d4": "neutral-300",
    "#a3a3a3": "neutral-400",
    "#737373": "neutral-500",
    "#525252": "neutral-600",
    "#404040": "neutral-700",
    "#262626": "neutral-800",
    "#171717": "neutral-900",
    "#0a0a0a": "neutral-950",
    "#fafaf9": "stone-50",
    "#f5f5f4": "stone-100",
    "#e7e5e4": "stone-200",
    "#d6d3d1": "stone-300",
    "#a8a29e": "stone-400",
    "#78716c": "stone-500",
    "#57534e": "stone-600",
    "#44403c": "stone-700",
    "#292524": "stone-800",
    "#1c1917": "stone-900",
    "#0c0a09": "stone-950",
    "#fef2f2": "red-50",
    "#fee2e2": "red-100",
    "#fecaca": "red-200",
    "#fca5a5": "red-300",
    "#f87171": "red-400",
    "#ef4444": "red-500",
    "#dc2626": "red-600",
    "#b91c1c": "red-700",
    "#991b1b": "red-800",
    "#7f1d1d": "red-900",
    "#450a0a": "red-950",
    "#fff7ed": "orange-50",
    "#ffedd5": "orange-100",
    "#fed7aa": "orange-200",
    "#fdba74": "orange-300",
    "#fb923c": "orange-400",
    "#f97316": "orange-500",
    "#ea580c": "orange-600",
    "#c2410c": "orange-700",
    "#9a3412": "orange-800",
    "#7c2d12": "orange-900",
    "#431407": "orange-950",
    "#fffbeb": "amber-50",
    "#fef3c7": "amber-100",
    "#fde68a": "amber-200",
    "#fcd34d": "amber-300",
    "#fbbf24": "amber-400",
    "#f59e0b": "amber-500",
    "#d97706": "amber-600",
    "#b45309": "amber-700",
    "#92400e": "amber-800",
    "#78350f": "amber-900",
    "#451a03": "amber-950",
    "#fefce8": "yellow-50",
    "#fef9c3": "yellow-100",
    "#fef08a": "yellow-200",
    "#fde047": "yellow-300",
    "#facc15": "yellow-400",
    "#eab308": "yellow-500",
    "#ca8a04": "yellow-600",
    "#a16207": "yellow-700",
    "#854d0e": "yellow-800",
    "#713f12": "yellow-900",
    "#422006": "yellow-950",
    "#f7fee7": "lime-50",
    "#ecfccb": "lime-100",
    "#d9f99d": "lime-200",
    "#bef264": "lime-300",
    "#a3e635": "lime-400",
    "#84cc16": "lime-500",
    "#65a30d": "lime-600",
    "#4d7c0f": "lime-700",
    "#3f6212": "lime-800",
    "#365314": "lime-900",
    "#1a2e05": "lime-950",
    "#f0fdf4": "green-50",
    "#dcfce7": "green-100",
    "#bbf7d0": "green-200",
    "#86efac": "green-300",
    "#4ade80": "green-400",
    "#22c55e": "green-500",
    "#16a34a": "green-600",
    "#15803d": "green-700",
    "#166534": "green-800",
    "#14532d": "green-900",
    "#052e16": "green-950",
    "#ecfdf5": "emerald-50",
    "#d1fae5": "emerald-100",
    "#a7f3d0": "emerald-200",
    "#6ee7b7": "emerald-300",
    "#34d399": "emerald-400",
    "#10b981": "emerald-500",
    "#059669": "emerald-600",
    "#047857": "emerald-700",
    "#065f46": "emerald-800",
    "#064e3b": "emerald-900",
    "#022c22": "emerald-950",
    "#f0fdfa": "teal-50",
    "#ccfbf1": "teal-100",
    "#99f6e4": "teal-200",
    "#5eead4": "teal-300",
    "#2dd4bf": "teal-400",
    "#14b8a6": "teal-500",
    "#0d9488": "teal-600",
    "#0f766e": "teal-700",
    "#115e59": "teal-800",
    "#134e4a": "teal-900",
    "#042f2e": "teal-950",
    "#ecfeff": "cyan-50",
    "#cffafe": "cyan-100",
    "#a5f3fc": "cyan-200",
    "#67e8f9": "cyan-300",
    "#22d3ee": "cyan-400",
    "#06b6d4": "cyan-500",
    "#0891b2": "cyan-600",
    "#0e7490": "cyan-700",
    "#155e75": "cyan-800",
    "#164e63": "cyan-900",
    "#083344": "cyan-950",
    "#f0f9ff": "sky-50",
    "#e0f2fe": "sky-100",
    "#bae6fd": "sky-200",
    "#7dd3fc": "sky-300",
    "#38bdf8": "sky-400",
    "#0ea5e9": "sky-500",
    "#0284c7": "sky-600",
    "#0369a1": "sky-700",
    "#075985": "sky-800",
    "#0c4a6e": "sky-900",
    "#082f49": "sky-950",
    "#eff6ff": "blue-50",
    "#dbeafe": "blue-100",
    "#bfdbfe": "blue-200",
    "#93c5fd": "blue-300",
    "#60a5fa": "blue-400",
    "#3b82f6": "blue-500",
    "#2563eb": "blue-600",
    "#1d4ed8": "blue-700",
    "#1e40af": "blue-800",
    "#1e3a8a": "blue-900",
    "#172554": "blue-950",
    "#eef2ff": "indigo-50",
    "#e0e7ff": "indigo-100",
    "#c7d2fe": "indigo-200",
    "#a5b4fc": "indigo-300",
    "#818cf8": "indigo-400",
    "#6366f1": "indigo-500",
    "#4f46e5": "indigo-600",
    "#4338ca": "indigo-700",
    "#3730a3": "indigo-800",
    "#312e81": "indigo-900",
    "#1e1b4b": "indigo-950",
    "#f5f3ff": "violet-50",
    "#ede9fe": "violet-100",
    "#ddd6fe": "violet-200",
    "#c4b5fd": "violet-300",
    "#a78bfa": "violet-400",
    "#8b5cf6": "violet-500",
    "#7c3aed": "violet-600",
    "#6d28d9": "violet-700",
    "#5b21b6": "violet-800",
    "#4c1d95": "violet-900",
    "#2e1065": "violet-950",
    "#faf5ff": "purple-50",
    "#f3e8ff": "purple-100",
    "#e9d5ff": "purple-200",
    "#d8b4fe": "purple-300",
    "#c084fc": "purple-400",
    "#a855f7": "purple-500",
    "#9333ea": "purple-600",
    "#7e22ce": "purple-700",
    "#6b21a8": "purple-800",
    "#581c87": "purple-900",
    "#3b0764": "purple-950",
    "#fdf4ff": "fuchsia-50",
    "#fae8ff": "fuchsia-100",
    "#f5d0fe": "fuchsia-200",
    "#f0abfc": "fuchsia-300",
    "#e879f9": "fuchsia-400",
    "#d946ef": "fuchsia-500",
    "#c026d3": "fuchsia-600",
    "#a21caf": "fuchsia-700",
    "#86198f": "fuchsia-800",
    "#701a75": "fuchsia-900",
    "#4a044e": "fuchsia-950",
    "#fdf2f8": "pink-50",
    "#fce7f3": "pink-100",
    "#fbcfe8": "pink-200",
    "#f9a8d4": "pink-300",
    "#f472b6": "pink-400",
    "#ec4899": "pink-500",
    "#db2777": "pink-600",
    "#be185d": "pink-700",
    "#9d174d": "pink-800",
    "#831843": "pink-900",
    "#500724": "pink-950",
    "#fff1f2": "rose-50",
    "#ffe4e6": "rose-100",
    "#fecdd3": "rose-200",
    "#fda4af": "rose-300",
    "#fb7185": "rose-400",
    "#f43f5e": "rose-500",
    "#e11d48": "rose-600",
    "#be123c": "rose-700",
    "#9f1239": "rose-800",
    "#881337": "rose-900",
    "#4c0519": "rose-950"
  };
  var pacvueColors = {
    "#ffffff": "--el-color-white",
    "#000000": "--el-color-black",
    "#ff9f43": "--el-color-primary",
    "#ffbc7b": "--el-color-primary-light-3",
    "#ffcfa1": "--el-color-primary-light-5",
    "#ffe2c7": "--el-color-primary-light-7",
    "#ffecd9": "--el-color-primary-light-8",
    "#fff5ec": "--el-color-primary-light-9",
    "#cc7f36": "--el-color-primary-dark-2",
    "#28c76f": "--el-color-success",
    "#69d89a": "--el-color-success-light-3",
    "#94e3b7": "--el-color-success-light-5",
    "#bfeed4": "--el-color-success-light-7",
    "#d4f4e2": "--el-color-success-light-8",
    "#eaf9f1": "--el-color-success-light-9",
    "#209f59": "--el-color-success-dark-2",
    "#ea5455": "--el-color-danger",
    "#f08788": "--el-color-danger-light-3",
    "#f5aaaa": "--el-color-danger-light-5",
    "#f9cccc": "--el-color-danger-light-7",
    "#fbdddd": "--el-color-danger-light-8",
    "#fdeeee": "--el-color-danger-light-9",
    "#bb4344": "--el-color-danger-dark-2",
    "#82858b": "--el-color-info",
    "#a8aaae": "--el-color-info-light-3",
    "#c1c2c5": "--el-color-info-light-5",
    "#dadadc": "--el-color-info-light-7",
    "#e6e7e8": "--el-color-info-light-8",
    "#f3f3f3": "--el-color-info-light-9",
    "#686a6f": "--el-color-info-dark-2",
    "#f2f3f5": "--el-bg-color-page",
    "#5e5873": "--el-text-color-primary",
    "#45464f": "--color-title--",
    "#66666c": "--color-text--",
    "#b2b2b8": "--color-info--",
    "#dedfe3": "--icon-disabled--",
    "#fff1e3": "--hover-color--",
    "#f4f5f6": "--el-input-disable-bg--",
    "#b2b2b2": "--pac-disabled-text-color--",
    "#d9d9d9": "--pac-upload-border-color",
    "#1890ff": "--pac-href-color1",
    "#0D6EFD": "--pac-href-color"
  };
  var tailwindNearestColor = nearestColorFrom(
    Object.keys(tailwindColors)
  );
  var getTailwindFromFigmaRGB = (color, opacity1) => {
    const colorMultiplied = {
      r: color.r * 255,
      g: color.g * 255,
      b: color.b * 255
    };
    const hexColor = rgbToHex(Number(colorMultiplied.r.toFixed(0)), Number(colorMultiplied.g.toFixed(0)), Number(colorMultiplied.b.toFixed(0)));
    let opacityHex = "";
    if (opacity1 && opacity1 != 1) {
      let opacity2 = Math.round(Number(Number(opacity1.toFixed(2)) * 255));
      let opacity3 = Math.max(0, Math.min(255, opacity2));
      opacityHex = opacity3.toString(16).padStart(2, "0");
      return `[${hexColor}${opacityHex}]`;
    } else if (pacvueColors[hexColor]) {
      return `[var(${pacvueColors[hexColor]})]`;
    } else {
      return `[${hexColor}]`;
    }
    return tailwindColors[tailwindNearestColor(colorMultiplied)];
  };
  var rgbToHex = (r, g, b) => {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // src/worker/backend/common/nodeWidthHeight.ts
  var nodeSize = (node, optimizeLayout) => {
    var _a, _b;
    const hasLayout = "layoutAlign" in node && node.parent && "layoutMode" in node.parent;
    if (!hasLayout) {
      return { width: node.width, height: node.height };
    }
    const nodeAuto = (_a = optimizeLayout && "inferredAutoLayout" in node ? node.inferredAutoLayout : null) != null ? _a : node;
    if ("layoutMode" in nodeAuto && nodeAuto.layoutMode === "NONE") {
      return { width: node.width, height: node.height };
    }
    const parentLayoutMode = optimizeLayout ? (_b = node.parent.inferredAutoLayout) == null ? void 0 : _b.layoutMode : node.parent.layoutMode;
    const isWidthFill = parentLayoutMode === "HORIZONTAL" && nodeAuto.layoutGrow === 1 || parentLayoutMode === "VERTICAL" && nodeAuto.layoutAlign === "STRETCH";
    const isHeightFill = parentLayoutMode === "HORIZONTAL" && nodeAuto.layoutAlign === "STRETCH" || parentLayoutMode === "VERTICAL" && nodeAuto.layoutGrow === 1;
    const modesSwapped = parentLayoutMode === "HORIZONTAL";
    const primaryAxisMode = modesSwapped ? "counterAxisSizingMode" : "primaryAxisSizingMode";
    const counterAxisMode = modesSwapped ? "primaryAxisSizingMode" : "counterAxisSizingMode";
    return {
      width: isWidthFill ? "fill" : "layoutMode" in nodeAuto && nodeAuto[primaryAxisMode] === "AUTO" ? null : node.width,
      height: isHeightFill ? "fill" : "layoutMode" in nodeAuto && nodeAuto[counterAxisMode] === "AUTO" ? null : node.height
    };
  };

  // src/worker/backend/tailwind/builderImpl/tailwindSize.ts
  var tailwindSizePartial = (node, optimizeLayout) => {
    var _a;
    const size = nodeSize(node, optimizeLayout);
    const nodeParent = (_a = node.parent && optimizeLayout && "inferredAutoLayout" in node.parent ? node.parent.inferredAutoLayout : null) != null ? _a : node.parent;
    let w = "";
    if (typeof size.width === "number") {
      w = `w-${pxToLayoutSize(size.width)}`;
    } else if (size.width === "fill") {
      if (nodeParent && "layoutMode" in nodeParent && nodeParent.layoutMode === "HORIZONTAL") {
        w = `grow shrink basis-0`;
      } else {
        w = `w-full`;
      }
    }
    let h = "";
    if (typeof size.height === "number") {
      h = `h-${pxToLayoutSize(size.height)}`;
    } else if (size.height === "fill") {
      if (size.height === "fill" && nodeParent && "layoutMode" in nodeParent && nodeParent.layoutMode === "VERTICAL") {
        h = `grow shrink basis-0`;
      } else {
        h = `self-stretch`;
      }
    }
    return { width: w, height: h };
  };

  // src/worker/backend/common/commonPadding.ts
  var commonPadding = (node) => {
    var _a, _b, _c, _d;
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      const paddingLeft = parseFloat(((_a = node.paddingLeft) != null ? _a : 0).toFixed(2));
      const paddingRight = parseFloat(((_b = node.paddingRight) != null ? _b : 0).toFixed(2));
      const paddingTop = parseFloat(((_c = node.paddingTop) != null ? _c : 0).toFixed(2));
      const paddingBottom = parseFloat(((_d = node.paddingBottom) != null ? _d : 0).toFixed(2));
      if (paddingLeft === paddingRight && paddingLeft === paddingBottom && paddingTop === paddingBottom) {
        return { all: paddingLeft };
      } else if (paddingLeft === paddingRight && paddingTop === paddingBottom) {
        return {
          horizontal: paddingLeft,
          vertical: paddingTop
        };
      } else {
        return {
          left: paddingLeft,
          right: paddingRight,
          top: paddingTop,
          bottom: paddingBottom
        };
      }
    }
    return null;
  };

  // src/worker/backend/tailwind/builderImpl/tailwindPadding.ts
  var tailwindPadding = (node) => {
    const padding = commonPadding(node);
    if (!padding) {
      return [];
    }
    if ("all" in padding) {
      if (padding.all === 0) {
        return [];
      }
      return [`p-${pxToLayoutSize(padding.all)}`];
    }
    let comp = [];
    if ("horizontal" in padding) {
      if (padding.horizontal && padding.horizontal !== 0) {
        comp.push(`px-${pxToLayoutSize(padding.horizontal)}`);
      }
      if (padding.vertical && padding.vertical !== 0) {
        comp.push(`py-${pxToLayoutSize(padding.vertical)}`);
      }
      return comp;
    }
    const { left, right, top, bottom } = padding;
    if (left || right) {
      const pl = left ? `pl-${pxToLayoutSize(left)}` : "";
      const pr = right ? `pr-${pxToLayoutSize(right)}` : "";
      comp.push(
        ...left && right && pxToLayoutSize(left) === pxToLayoutSize(right) ? [`px-${pxToLayoutSize(left)}`] : [pl, pr]
      );
    }
    if (top || bottom) {
      const pt = top ? `pt-${pxToLayoutSize(top)}` : "";
      const pb = bottom ? `pb-${pxToLayoutSize(bottom)}` : "";
      comp.push(
        ...top && bottom && pxToLayoutSize(top) === pxToLayoutSize(bottom) ? [`py-${pxToLayoutSize(top)}`] : [pt, pb]
      );
    }
    return comp;
  };

  // src/worker/backend/common/commonPosition.ts
  var getCommonPositionValue = (node) => {
    if (node.parent && node.parent.type === "GROUP") {
      return {
        x: node.x - node.parent.x,
        y: node.y - node.parent.y
      };
    }
    return {
      x: node.x,
      y: node.y
    };
  };
  var commonIsAbsolutePosition = (node, optimizeLayout) => {
    if (optimizeLayout && node.parent && "layoutMode" in node.parent && node.parent.inferredAutoLayout !== null) {
      return false;
    }
    if ("layoutAlign" in node) {
      if (!node.parent || node.parent === void 0) {
        return false;
      }
      const parentLayoutIsNone = "layoutMode" in node.parent && node.parent.layoutMode === "NONE";
      const hasNoLayoutMode = !("layoutMode" in node.parent);
      if (node.layoutPositioning === "ABSOLUTE" || parentLayoutIsNone || hasNoLayoutMode) {
        return true;
      }
    }
    return false;
  };

  // src/worker/backend/tailwind/tailwindDefaultBuilder.ts
  var TailwindDefaultBuilder = class {
    constructor(node, showLayerName, optIsJSX) {
      __publicField(this, "attributes", []);
      __publicField(this, "style");
      __publicField(this, "styleSeparator", "");
      __publicField(this, "isJSX");
      __publicField(this, "visible");
      __publicField(this, "name", "");
      __publicField(this, "addAttributes", (...newStyles) => {
        this.attributes.push(...newStyles.filter((style) => style !== ""));
      });
      this.isJSX = optIsJSX;
      this.styleSeparator = this.isJSX ? "," : ";";
      this.style = "";
      this.visible = node.visible;
      if (showLayerName) {
        this.attributes.push(className(node.name));
      }
    }
    blend(node) {
      this.addAttributes(
        tailwindVisibility(node),
        tailwindRotation(node),
        tailwindOpacity(node),
        tailwindBlendMode(node)
      );
      return this;
    }
    commonPositionStyles(node, optimizeLayout) {
      this.size(node, optimizeLayout);
      this.autoLayoutPadding(node, optimizeLayout);
      this.position(node, optimizeLayout);
      this.blend(node);
      return this;
    }
    commonShapeStyles(node) {
      this.customColor(node.fills, "bg");
      this.radius(node);
      this.shadow(node);
      this.border(node);
      this.blur(node);
      return this;
    }
    radius(node) {
      if (node.type === "ELLIPSE") {
        this.addAttributes("rounded-full");
      } else {
        this.addAttributes(tailwindBorderRadius(node));
      }
      return this;
    }
    border(node) {
      if ("strokes" in node) {
        this.addAttributes(tailwindBorderWidth(node));
        this.customColor(node.strokes, "border");
      }
      return this;
    }
    position(node, optimizeLayout) {
      var _a, _b;
      if (commonIsAbsolutePosition(node, optimizeLayout)) {
        const { x, y } = getCommonPositionValue(node);
        const parsedX = sliceNum(x);
        const parsedY = sliceNum(y);
        if (parsedX === "0") {
          this.addAttributes(`left-0`);
        } else {
          this.addAttributes(`left-[${parsedX}px]`);
        }
        if (parsedY === "0") {
          this.addAttributes(`top-0`);
        } else {
          this.addAttributes(`top-[${parsedY}px]`);
        }
        this.addAttributes(`absolute`);
      } else if (node.type === "GROUP" || "layoutMode" in node && ((_b = (_a = optimizeLayout ? node.inferredAutoLayout : null) != null ? _a : node) == null ? void 0 : _b.layoutMode) === "NONE") {
        this.addAttributes("relative");
      }
      return this;
    }
    /**
     * https://tailwindcss.com/docs/text-color/
     * example: text-blue-500
     * example: text-opacity-25
     * example: bg-blue-500
     */
    customColor(paint, kind) {
      if (this.visible) {
        let gradient = "";
        if (kind === "bg") {
          gradient = tailwindGradientFromFills(paint);
        }
        if (gradient) {
          this.addAttributes(gradient);
        } else {
          this.addAttributes(tailwindColorFromFills(paint, kind));
        }
      }
      return this;
    }
    /**
     * https://tailwindcss.com/docs/box-shadow/
     * example: shadow
     */
    shadow(node) {
      this.addAttributes(...tailwindShadow(node));
      return this;
    }
    // must be called before Position, because of the hasFixedSize attribute.
    size(node, optimizeLayout) {
      const { width, height } = tailwindSizePartial(node, optimizeLayout);
      if (node.type === "TEXT") {
        switch (node.textAutoResize) {
          case "WIDTH_AND_HEIGHT":
            break;
          case "HEIGHT":
            this.addAttributes(width);
            break;
          case "NONE":
          case "TRUNCATE":
            this.addAttributes(width, height);
            break;
        }
      } else {
        this.addAttributes(width, height);
      }
      return this;
    }
    size1(obj) {
      const width = `w-${pxToLayoutSize(obj.width)}`;
      const height = `h-${pxToLayoutSize(obj.height)}`;
      if (obj.node.type === "TEXT") {
        switch (obj.node.textAutoResize) {
          case "WIDTH_AND_HEIGHT":
            break;
          case "HEIGHT":
            this.addAttributes(width);
            break;
          case "NONE":
          case "TRUNCATE":
            this.addAttributes(width, height);
            break;
        }
      } else {
        this.addAttributes(width, height);
      }
      return this;
    }
    autoLayoutPadding(node, optimizeLayout) {
      var _a;
      if ("paddingLeft" in node) {
        this.addAttributes(
          ...tailwindPadding(
            (_a = optimizeLayout ? node.inferredAutoLayout : null) != null ? _a : node
          )
        );
      }
      return this;
    }
    blur(node) {
      if ("effects" in node && node.effects.length > 0) {
        const blur = node.effects.find((e) => e.type === "LAYER_BLUR");
        if (blur) {
          const blurValue = pxToBlur(blur.radius);
          if (blurValue) {
            this.addAttributes(`blur${blurValue ? `-${blurValue}` : ""}`);
          }
        }
        const backgroundBlur = node.effects.find(
          (e) => e.type === "BACKGROUND_BLUR"
        );
        if (backgroundBlur) {
          const backgroundBlurValue = pxToBlur(backgroundBlur.radius);
          if (backgroundBlurValue) {
            this.addAttributes(
              `backdrop-blur${backgroundBlurValue ? `-${backgroundBlurValue}` : ""}`
            );
          }
        }
      }
    }
    build(additionalAttr = "") {
      this.addAttributes(additionalAttr);
      if (this.style.length > 0) {
        this.style = ` style="${this.style}"`;
      }
      if (!this.attributes.length && !this.style) {
        return "";
      }
      const classOrClassName = this.isJSX ? "className" : "class";
      if (this.attributes.length === 0) {
        return "";
      }
      return ` ${classOrClassName}="${this.attributes.join(" ")}"${this.style}`;
    }
    reset() {
      this.attributes = [];
      this.style = "";
    }
  };

  // src/worker/backend/common/commonTextHeightSpacing.ts
  var commonLineHeight = (lineHeight, fontSize) => {
    switch (lineHeight.unit) {
      case "AUTO":
        return 0;
      case "PIXELS":
        return lineHeight.value;
      case "PERCENT":
        return fontSize * lineHeight.value / 100;
    }
  };
  var commonLetterSpacing = (letterSpacing, fontSize) => {
    switch (letterSpacing.unit) {
      case "PIXELS":
        return letterSpacing.value;
      case "PERCENT":
        return fontSize * letterSpacing.value / 100;
    }
  };

  // src/worker/backend/tailwind/tailwindTextBuilder.ts
  var TailwindTextBuilder = class extends TailwindDefaultBuilder {
    constructor() {
      super(...arguments);
      __publicField(this, "getTailwindColorFromFills", (fills) => {
        return tailwindColorFromFills(fills, "text");
      });
      __publicField(this, "fontSize", (fontSize) => {
        if (fontSize == 14) {
          return "";
        }
        return `text-${pxToFontSize(fontSize)}`;
      });
      __publicField(this, "fontWeight", (fontWeight) => {
        switch (fontWeight) {
          case 100:
            return "font-thin";
          case 200:
            return "font-extralight";
          case 300:
            return "font-light";
          case 500:
            return "font-medium";
          case 600:
            return "font-semibold";
          case 700:
            return "font-bold";
          case 800:
            return "font-extrabold";
          case 900:
            return "font-black";
          default:
            return "";
        }
      });
      __publicField(this, "indentStyle", (indentation) => {
        return `pl-${Math.round(indentation)}`;
      });
      __publicField(this, "fontFamily", (fontName) => {
        if (["Inter", "Helvetica", "Arial", "sans-serif"].includes(fontName.family)) {
          return "";
        }
        return "font-['" + fontName.family + "']";
      });
    }
    getTextSegments(id) {
      const segments = globalTextStyleSegments[id];
      if (!segments) {
        return [];
      }
      return segments.map((segment) => {
        const color = this.getTailwindColorFromFills(segment.fills);
        const textDecoration = this.textDecoration(segment.textDecoration);
        const textTransform = this.textTransform(segment.textCase);
        const lineHeightStyle = this.lineHeight(
          segment.lineHeight,
          segment.fontSize
        );
        const letterSpacingStyle = this.letterSpacing(
          segment.letterSpacing,
          segment.fontSize
        );
        const styleClasses = [
          color,
          this.fontSize(segment.fontSize),
          this.fontWeight(segment.fontWeight),
          this.fontFamily(segment.fontName),
          textDecoration,
          textTransform,
          lineHeightStyle,
          letterSpacingStyle
          // textIndentStyle,
        ].filter((d) => d !== "").join(" ");
        const charsWithLineBreak = segment.characters.split("\n").join("<br/>");
        return { style: styleClasses, text: charsWithLineBreak };
      });
    }
    /**
     * https://tailwindcss.com/docs/font-size/
     * example: text-md
     */
    // fontSize(fontSize: number): this {
    //   // example: text-md
    //   const value = pxToFontSize(fontSize);
    //   this.addAttributes(`text-${value}`);
    //   return this;
    // }
    /**
     * https://tailwindcss.com/docs/font-style/
     * example: font-extrabold
     * example: italic
     */
    fontStyle(node) {
      if (node.fontName !== figma.mixed) {
        const lowercaseStyle = node.fontName.style.toLowerCase();
        if (lowercaseStyle.match("italic")) {
          this.addAttributes("italic");
        }
        if (lowercaseStyle.match("regular")) {
          return this;
        }
        const value = node.fontName.style.replace("italic", "").replace(" ", "").toLowerCase();
        this.addAttributes(`font-${value}`);
      }
      return this;
    }
    /**
     * https://tailwindcss.com/docs/letter-spacing/
     * example: tracking-widest
     */
    letterSpacing(letterSpacing, fontSize) {
      const letterSpacingProp = commonLetterSpacing(letterSpacing, fontSize);
      if (letterSpacingProp > 0) {
        const value = pxToLetterSpacing(letterSpacingProp);
        return `tracking-${value}`;
      }
      return "";
    }
    /**
     * https://tailwindcss.com/docs/line-height/
     * example: leading-3
     */
    lineHeight(lineHeight, fontSize) {
      let lineHeightProp = commonLineHeight(lineHeight, fontSize);
      if (lineHeightProp < fontSize) {
        lineHeightProp = fontSize;
      }
      if (lineHeightProp > 0 && lineHeightProp != 22) {
        let value;
        if (lineHeightProp % 4 === 0) {
          value = lineHeightProp / 4;
        } else {
          value = `[${lineHeightProp}px]`;
        }
        return `leading-${value}`;
      }
      return "";
    }
    /**
     * https://tailwindcss.com/docs/text-align/
     * example: text-justify
     */
    textAlign(node) {
      if (node.textAlignHorizontal && node.textAlignHorizontal !== "LEFT") {
        switch (node.textAlignHorizontal) {
          case "CENTER":
            this.addAttributes(`text-center`);
            break;
          case "RIGHT":
            this.addAttributes(`text-right`);
            break;
          case "JUSTIFIED":
            this.addAttributes(`text-justify`);
            break;
          default:
            break;
        }
      }
      return this;
    }
    /**
     * https://tailwindcss.com/docs/text-transform/
     * example: uppercase
     */
    textTransform(textCase) {
      switch (textCase) {
        case "UPPER":
          return "uppercase";
        case "LOWER":
          return "lowercase";
        case "TITLE":
          return "capitalize";
        case "ORIGINAL":
        case "SMALL_CAPS":
        case "SMALL_CAPS_FORCED":
        default:
          return "";
      }
    }
    /**
     * https://tailwindcss.com/docs/text-decoration/
     * example: underline
     */
    textDecoration(textDecoration) {
      switch (textDecoration) {
        case "STRIKETHROUGH":
          return "line-through";
        case "UNDERLINE":
          return "underline";
        case "NONE":
          return "";
      }
    }
    reset() {
      this.attributes = [];
    }
  };

  // src/worker/backend/tailwind/tailwindMain.ts
  var localTailwindSettings;
  var previousExecutionCache;
  var selfClosingTags = ["img"];
  var tailwindMain = (sceneNode, settings) => {
    localTailwindSettings = settings;
    previousExecutionCache = [];
    let result = tailwindWidgetGenerator(sceneNode, localTailwindSettings.jsx);
    if (result.length > 0 && result.startsWith("\n")) {
      result = result.slice(1, result.length);
    }
    return result;
  };
  var tailwindWidgetGenerator = (sceneNode, isJsx) => {
    let comp = "";
    sceneNode.forEach((e) => {
      switch (e.type) {
        case "PACVUE":
          comp += pacvueContainer(e);
          break;
        case "RECTANGLE":
        case "ELLIPSE":
          comp += tailwindContainer(e.node, "", "", isJsx);
          break;
        case "GROUP":
          comp += tailwindGroup(e, isJsx);
          break;
        case "INSTANCE":
        case "FRAME":
        case "COMPONENT":
        case "COMPONENT_SET":
          comp += tailwindFrame(e.node, e, isJsx);
          break;
        case "TEXT":
          comp += tailwindText(e.node, isJsx);
          break;
        case "LINE":
          comp += tailwindLine(e.node, isJsx);
          break;
        case "SECTION":
          comp += tailwindSection(e.node, isJsx);
          break;
        case "VECTOR":
          break;
      }
    });
    return comp;
  };
  var tailwindFrame = (node, obj, isJsx) => {
    const width = node.width ? `width='${node.width}px'` : "";
    if (node.name.includes("\u7279\u6B8A\u8F93\u5165\u6846")) {
      return pacvueInput(node);
    }
    if (node.name.includes("widget-arrow")) {
      return pacvueIcon(node);
    }
    if (node.name.includes("tab")) {
      return pacvueTab(node, isJsx);
    }
    if (node.name == "\u641C\u7D22\u6846") {
      return `
<pacvue-input ${width}>
  <template #prefix>
    <el-icon><PacvueIconSearch /></el-icon>
  </template>
</pacvue-input>`;
    }
    if (node.name.includes("\u4E3B\u8981\u6309\u94AE") || node.name.includes("\u7070\u8272\u6309\u94AE") || node.name.includes("\u6B21\u7EA7\u6309\u94AE") || node.name.toLocaleLowerCase().includes("button")) {
      return pacvueButton(node, isJsx);
    }
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    if (node.name == "\u5355\u9009\u6846+\u6587\u5B57") {
      return tailwindWidgetGenerator(obj.children, isJsx);
    }
    const visibleChildNode = childrNode.filter((e) => e.visible);
    const visibleChildNode0 = visibleChildNode[0];
    if (visibleChildNode.length == 1 && visibleChildNode[0].name == "Input") {
      return pacvueInput(visibleChildNode0);
    }
    if (visibleChildNode.length == 2) {
      if (visibleChildNode[1].name == "top bar-arrow-down") {
        const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode0, localTailwindSettings.optimizeLayout);
        const visibleGrandChildNode = grandChildrNode.filter((e) => e.visible);
        if (visibleGrandChildNode.length > 1 && visibleGrandChildNode[0].name == "Vendor" && visibleGrandChildNode[1].name == "Rectangle 539") {
          const grandChildrNodeText = grandChildrNode[0];
          let text = grandChildrNodeText.characters;
          return `
<pacvue-select ${width} :labelInner="'${text}'" />`;
        }
      }
    }
    if (visibleChildNode.length >= 2) {
      const visibleChildNodelast = visibleChildNode[visibleChildNode.length - 1];
      if (isIcon(visibleChildNodelast)) {
        if (getIconName(visibleChildNodelast) == "Rectangle 1138") {
          return '\n<PacvueDatePicker type="daterange" />';
        }
      }
    }
    if (isIcon(node)) {
      return pacvueIcon(node);
    }
    const childrenStr = tailwindWidgetGenerator(obj.children, isJsx);
    if (node.layoutMode !== "NONE") {
      const rowColumn = tailwindAutoLayoutProps(node, node);
      return tailwindContainer(node, childrenStr, rowColumn, isJsx);
    } else {
      if (localTailwindSettings.optimizeLayout && node.inferredAutoLayout !== null) {
        const rowColumn = tailwindAutoLayoutProps(node, node.inferredAutoLayout);
        return tailwindContainer(node, childrenStr, rowColumn, isJsx);
      }
      return tailwindContainer(node, childrenStr, "", isJsx);
    }
  };
  var tailwindGroup = (obj, isJsx = false) => {
    const node = obj.node;
    if (obj.width < 0 || node.height <= 0 || node.children.length === 0) {
      return "";
    }
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).blend(node);
    builder.size1(obj);
    builder.position(node, localTailwindSettings.optimizeLayout);
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible && ["RECTANGLE", "VECTOR"].includes(e.type));
    if (visibleChildNode.length > 1) {
      visibleChildNode.forEach((e) => {
        builder.border(e);
      });
    }
    if (builder.attributes || builder.style) {
      const attr = builder.build("");
      const generator = tailwindWidgetGenerator(obj.children, isJsx);
      return `
<div${attr}>${indentString(generator)}
</div>`;
    }
    return tailwindWidgetGenerator(obj.children, isJsx);
  };
  var tailwindText = (node, isJsx) => {
    let layoutBuilder = new TailwindTextBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).textAlign(node);
    const styledHtml = layoutBuilder.getTextSegments(node.id);
    previousExecutionCache.push(...styledHtml);
    let content = "";
    if (styledHtml.length === 1) {
      layoutBuilder.addAttributes(styledHtml[0].style);
      content = styledHtml[0].text;
    } else {
      content = styledHtml.map((style) => `<span class="${style.style}">${style.text}</span>`).join("");
    }
    return `
<div${layoutBuilder.build()}>${content}</div>`;
  };
  var tailwindContainer = (node, children, additionalAttr, isJsx) => {
    var _a;
    if (node.width < 0 || node.height < 0) {
      return children;
    }
    let builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).commonShapeStyles(node);
    const asnode = node;
    const childrNode = commonSortChildrenWhenInferredAutoLayout(asnode, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible && ["RECTANGLE", "VECTOR"].includes(e.type));
    if (visibleChildNode.length == 1) {
      builder.border(visibleChildNode[0]);
    }
    if (builder.attributes || additionalAttr) {
      const build = builder.build(additionalAttr);
      let tag = "div";
      let src = "";
      if (((_a = retrieveTopFill(node.fills)) == null ? void 0 : _a.type) === "IMAGE") {
        if (!("children" in node) || node.children.length === 0) {
          tag = "img";
          src = ` src="https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)}"`;
        } else {
          builder.addAttributes(`bg-[url(https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)})]`);
        }
      }
      if (children) {
        return `
<${tag}${build}${src}>${indentString(children)}
</${tag}>`;
      } else if (selfClosingTags.includes(tag) || isJsx) {
        return `
<${tag}${build}${src} />`;
      } else {
        return `
<${tag}${build}${src}></${tag}>`;
      }
    }
    return children;
  };
  var tailwindLine = (node, isJsx) => {
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).commonShapeStyles(node);
    return `
<div${builder.build()}></div>`;
  };
  var tailwindSection = (obj, isJsx) => {
    const node = obj.node;
    const childrenStr = tailwindWidgetGenerator(obj.children, isJsx);
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout).customColor(node.fills, "bg");
    if (childrenStr) {
      return `
<div${builder.build()}>${indentString(childrenStr)}
</div>`;
    } else {
      return `
<div${builder.build()}></div>`;
    }
  };
  var pacvueButton = (obj, isJsx) => {
    const node = obj.node;
    let type = ' type="primary"';
    if (node.name.includes("\u7070\u8272\u6309\u94AE")) {
      type = "";
    }
    if (node.name.includes("\u6B21\u7EA7\u6309\u94AE")) {
      type = ' type="primary" plain';
    }
    let index = 0;
    let text = "";
    let icon = "";
    let width = node.width ? `width='${node.width}px'` : "";
    if (obj.children.length == 1 && obj.children[0].type != "TEXT") {
      return tailwindWidgetGenerator(obj.children, isJsx);
    }
    for (let e of obj.children) {
      index++;
      if (e.type == "TEXT") {
        text = e.node.characters;
        break;
      }
    }
    if (obj.children.length > 1) {
      if (index > 1) {
        icon = `
<el-icon :size="20" style="margin-right: 8px">
  <PacvueIconAdd></PacvueIconAdd>
</el-icon>`;
      }
      if (index < obj.children.length) {
        return `
<pacvue-dropdown>
  <template #reference>
    <pacvue-button type="primary" plain>
      ${icon}${text}
      <el-icon :size="20" style="margin-left: 8px">
        <PacvueIconTopBarArrowDown></PacvueIconTopBarArrowDown>
      </el-icon>
    </pacvue-button>
  </template>
</pacvue-dropdown>`;
      }
    }
    return `
<pacvue-button${type} ${width}>${icon}${text}</pacvue-button>`;
  };
  var pacvueInput = (node) => {
    let width = node.width ? `width='${node.width}px'` : "";
    let textarea = "";
    if (node.name == "\u6587\u672C\u57DF") {
      let rows = node.height ? ` :rows="${((node.height - 10) / 21).toFixed(0)}"` : "";
      textarea = 'type="textarea"' + rows;
    }
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible);
    let endTag = "/>";
    if (visibleChildNode.length == 2) {
      let symbol = "";
      visibleChildNode.forEach((n) => {
        const childN = n;
        const a = commonSortChildrenWhenInferredAutoLayout(childN, localTailwindSettings.optimizeLayout);
        const b = a.filter((e) => e.visible);
        b.forEach((e) => {
          if (e.type == "TEXT") {
            const c = e;
            if (["$", "%"].includes(c.characters)) {
              symbol = c.characters;
            }
          }
        });
      });
      if (symbol == "%") {
        endTag = `>
  <template #suffix>
    <span>${symbol}</span>
  </template>
</pacvue-input>`;
      } else {
        endTag = `>
  <template #prefix>
    <span>${symbol}</span>
  </template>
</pacvue-input>`;
      }
    }
    return `
<pacvue-input ${width} ${textarea}${endTag}`;
  };
  var pacvueIcon = (node) => {
    let iconName = "PacvueIconAmazon";
    if (node.name == "widget-arrow-down") {
      iconName = "PacvueIconWidgetArrowDown1";
    }
    if (node.name == "widget-arrow-up") {
      iconName = "PacvueIconWidgetArrowUp1";
    }
    if (node.name == "tips-exclamation") {
      iconName = "PacvueIconTipsExclamation";
      return `
<pacvue-tooltip placement="top" effect="dark">
  <template #content>
    <div><!-- Tooltip\u6587\u6848 --></div>
  </template>
  <el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>
</pacvue-tooltip>`;
    }
    return `
<el-icon :size="${node.width}">
  <${iconName} />
</el-icon>`;
  };
  var pacvueTab = (node, isJsx) => {
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible);
    let comp = "";
    visibleChildNode.forEach((n) => {
      const textNode = n;
      let text = findSpecifiedChiuldren(commonSortChildrenWhenInferredAutoLayout(textNode, localTailwindSettings.optimizeLayout), isJsx);
      if (node.name.includes("\u6C34\u5E73\u65B9\u5411")) {
        comp += `
  <el-tab-pane label="${text}"></el-tab-pane>`;
      } else {
        comp += `
  <pacvue-radio-button >${text}</pacvue-radio-button>`;
      }
    });
    if (node.name.includes("\u6C34\u5E73\u65B9\u5411")) {
      return `
<PacvueTab tab-position="top">${comp}
</PacvueTab>`;
    } else {
      return `
<pacvue-radio-group>${comp}
</pacvue-radio-group>`;
    }
  };
  var findSpecifiedChiuldren = (sceneNode, isJsx) => {
    let comp = "";
    const visibleSceneNode = sceneNode.filter((d) => d.visible);
    visibleSceneNode.forEach((node) => {
      if (node.type == "TEXT") {
        comp += node.characters;
      } else {
        const asnode = node;
        comp += findSpecifiedChiuldren(commonSortChildrenWhenInferredAutoLayout(asnode, localTailwindSettings.optimizeLayout), isJsx);
      }
    });
    return comp;
  };
  var isIcon = (node) => {
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible);
    if (node.type == "INSTANCE" && visibleChildNode.length == 1 && visibleChildNode[0].type == "GROUP") {
      const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode[0], localTailwindSettings.optimizeLayout);
      let index = 0;
      grandChildrNode.forEach((e) => {
        if (e.name == "Union") {
          index++;
        }
      });
      return index == 1;
    }
    return false;
  };
  var getIconName = (node) => {
    let iconName = "";
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible);
    const visibleChildNode0 = visibleChildNode[0];
    const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode0, localTailwindSettings.optimizeLayout);
    grandChildrNode.forEach((e) => {
      if (e.type == "RECTANGLE" && e.name != "Union") {
        iconName = e.name;
      }
    });
    return iconName;
  };
  var pacvueContainer = (node) => {
    var ary = node.name.split("-");
    var comp = "";
    const width = node.width ? ` width="${node.width}px"` : "";
    const classHtml = node.style.length > 0 ? ` class="${node.style.join(" ")}"` : "";
    switch (ary[0]) {
      case "PacvueSelect":
        const labelInner = ary[1] ? ` :labelInner="'${ary[1]}'"` : "";
        comp = `
<${ary[0]}${width}${classHtml} ${labelInner} />`;
        break;
      case "PacvueInput":
        let endTag = " />";
        if (ary[1]) {
          if (ary[1] == "Textarea") {
            let rows = node.height ? ` :rows="${((node.height - 10) / 21).toFixed(0)}"` : "";
            endTag = ' type="textarea"' + rows + "/>";
          } else if (ary[1] == "Search") {
            endTag = ` >
  <template #prefix>
    <el-icon><PacvueIconSearch /></el-icon>
  </template>
</${ary[0]}>`;
          } else if (ary[1] == "%") {
            endTag = ` >
  <template #suffix>
    <span>${ary[1]}</span>
  </template>
</${ary[0]}>`;
          } else {
            endTag = ` >
  <template #prefix>
    <span>${ary[1]}</span>
  </template>
</${ary[0]}>`;
          }
        }
        comp = `
<${ary[0]}${width}${classHtml}${endTag}`;
        break;
      case "PacvueDatePicker":
        const datePickerWidth = node.width ? ` style="width: ${node.width} !important"` : "";
        comp = `
<${ary[0]}${datePickerWidth} type="${ary[1]}" />`;
        break;
      case "PacvueCheckbox":
      case "PacvueRadio":
        let tootip = "";
        let text = node.html;
        if (ary[1]) {
          if (ary[1] == "Tips") {
            tootip = `
<pacvue-tooltip placement="top" effect="dark">
  <template #content>
    <div><!-- Tooltip\u6587\u6848 --></div>
  </template>
  <el-icon :size="20" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>
</pacvue-tooltip>
`;
            text = `
  <div class="flex items-center">${text}${tootip}
  </div>
`;
          }
        }
        comp = `
<${ary[0]} style="margin-right: 0">${text}</${ary[0]}>`;
        break;
      case "PacvueButton":
        let type = "";
        let icon = "";
        let size = "";
        if (ary[1]) {
          if (ary[1].includes("primary")) {
            type = ` type="primary"`;
          }
          if (ary[1].includes("plain")) {
            type += " plain";
          }
        }
        if (ary[2]) {
          icon = `
<el-icon :size="20">
  <${ary[2]}></${ary[2]}>
</el-icon>
`;
        }
        if (node.height == 32) {
          size = ' size="small"';
        }
        comp = `
<${ary[0]}${type}${size}>${icon}${node.html}</${ary[0]}>`;
        break;
      case "PacvueSwitch":
        comp = `
<${ary[0]} />`;
        break;
      case "PacvueRadioGroup":
        break;
      case "PacvueRadioTab":
        break;
      case "PacvueIcon":
        if (ary[1] == "PacvueIconTipsExclamation") {
          return `
<pacvue-tooltip placement="top" effect="dark">
  <template #content>
    <div><!-- Tooltip\u6587\u6848 --></div>
  </template>
  <el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>
</pacvue-tooltip>`;
        }
        comp = `
<el-icon :size="20">
  <${ary[1]}></${ary[1]}>
</el-icon>
`;
        break;
      default:
        return "";
    }
    return comp;
  };

  // src/worker/backend/tailwind/tailwindMain1.ts
  var svgIcon = {
    search: "PacvueIconSearch",
    remove: "PacvueIconRemove",
    add: "PacvueIconAdd",
    "tips-exclamation": "PacvueIconTipsExclamation",
    "widget-setting": "PacvueIconWidgetSetting"
  };
  var localTailwindSettings2;
  var tailwindMain1 = (sceneNode, settings) => {
    localTailwindSettings2 = settings;
    let result = tailwindWidgetGenerator2(sceneNode);
    return result;
  };
  var tailwindWidgetGenerator2 = (sceneNode) => {
    let array = [];
    const visibleSceneNode = sceneNode.filter((d) => d.visible);
    visibleSceneNode.forEach((node) => {
      array.push(tailwindContainer2(node));
    });
    return array;
  };
  var tailwindContainer2 = (node) => {
    const nodeStyle = node;
    const nodeStyle1 = node;
    const nodeStyle2 = node;
    var builder = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, false).blend(nodeStyle).position(node, localTailwindSettings2.optimizeLayout).customColor(nodeStyle.fills, "bg").commonPositionStyles(nodeStyle1, localTailwindSettings2.optimizeLayout).commonShapeStyles(nodeStyle2);
    if (node.type == "TEXT") {
      builder = new TailwindTextBuilder(node, localTailwindSettings2.layerName, false).commonPositionStyles(node, localTailwindSettings2.optimizeLayout).textAlign(node);
    }
    var styleClass = uniqueArray(builder.attributes);
    let ParentObj = {
      type: node.type,
      name: node.name,
      node,
      width: node.width,
      height: node.height,
      style: styleClass,
      html: "",
      children: []
    };
    let ChildObj = {
      type: node.type,
      name: node.name,
      node,
      width: node.width,
      height: node.height,
      style: styleClass,
      html: ""
    };
    const n = node;
    if (n.children) {
      const visibleChildNode = n.children.filter((d) => d.visible);
      var childrenList = [];
      visibleChildNode.forEach((e) => {
        childrenList.push(tailwindContainer2(e));
      });
      let height = node.height;
      childrenList.forEach((e) => {
        if (e.height > height) {
          height = e.height;
        }
      });
      ParentObj.height = height;
      if ((node.height == 36 || node.height == 32) && (styleClass.includes("rounded-md") || styleClass.includes("rounded")) && styleClass.includes("border") && styleClass.includes("border-[var(--icon-disabled--)]")) {
        if (node.height != node.width) {
          const newClass = styleClass.filter((e) => e != "rounded-md" && e != "rounded" && e != "border" && e != "border-[var(--icon-disabled--)]" && e != "h-9" && e != "h-8" && !e.includes("px") && !e.includes("py"));
          const arrowNum = searchByName(visibleChildNode, 0, "top bar-arrow-down");
          const dateNum = searchByName(visibleChildNode, 0, "Rectangle 1138");
          var textLength = searchByType(visibleChildNode, 0, "TEXT");
          var textArr = [];
          if (textLength > 0) {
            textArr = getChildrenAllText(visibleChildNode, textArr);
          }
          let name;
          if (dateNum > 0) {
            name = "PacvueDatePicker";
            textArr.forEach((e) => {
              if (e == "~" || e.includes("~")) {
                name += "-daterange";
              }
            });
          } else if (arrowNum == 0) {
            name = "PacvueInput";
            textArr.forEach((e) => {
              if (e.length == 1) {
                name += "-" + e;
              }
            });
          } else {
            name = "PacvueSelect";
            const num = searchByName(visibleChildNode, 0, "Rectangle 539");
            if (num == 1) {
              name += "-" + textArr[0];
            }
          }
          ParentObj.type = "PACVUE";
          ParentObj.name = name;
          ParentObj.style = newClass;
        } else {
          ParentObj.type = "PACVUE";
          let icon = "-";
          const iconList = visibleChildNode.filter((e) => {
            return e.width == e.height && e.type != "TEXT";
          });
          if (iconList.length == 1) {
            const a = iconList[0].name;
            icon += svgIcon[a.trim()];
          }
          ParentObj.name = `PacvueButton-${icon}`;
          return ParentObj;
        }
      } else if (node.height == node.width && node.height == 18 || node.name == "\u591A\u9009\u6846") {
        ParentObj.type = "PACVUE";
        ParentObj.name = "Checkbox";
        return ParentObj;
      } else if (node.height == node.width && node.height == 20 && styleClass.includes("border") || node.name == "\u5355\u9009\u6846") {
        ParentObj.type = "PACVUE";
        ParentObj.name = "Radio";
        return ParentObj;
      } else if (node.name == "\u5F00\u5173") {
        ParentObj.type = "PACVUE";
        ParentObj.name = "PacvueSwitch";
        return ParentObj;
      } else if (node.name == "\u6587\u672C\u57DF") {
        if (childrenList.filter((e) => {
          return e.name == "\u6587\u672C\u57DF" || e.name == "PacvueInput-Textarea";
        }).length == 0) {
          ParentObj.type = "PACVUE";
          ParentObj.name = "PacvueInput-Textarea";
          return ParentObj;
        } else {
          ParentObj.children = childrenList;
        }
      } else if (node.name.includes("\u4E3B\u8981\u6309\u94AE") || node.name.includes("\u6B21\u7EA7\u6309\u94AE") || (node.height == 36 || node.height == 32) && styleClass.includes("border") && styleClass.includes("border-[var(--el-color-primary)]")) {
        ParentObj.type = "PACVUE";
        let icon = "-";
        const iconList = visibleChildNode.filter((e) => {
          return e.width == e.height && e.type != "TEXT";
        });
        if (iconList.length == 1) {
          const a = iconList[0].name;
          icon += svgIcon[a.trim()];
        }
        var textLength = searchByType(visibleChildNode, 0, "TEXT");
        var textArr = [];
        if (textLength > 0) {
          textArr = getChildrenAllText(visibleChildNode, textArr);
        }
        if (textArr.length > 0) {
          ParentObj.html = textArr.join(" ");
        }
        var type = "primaryplain";
        if (styleClass.includes("bg-[var(--el-color-primary)]") || node.name.includes("\u4E3B\u8981\u6309\u94AE")) {
          type = "primary";
        }
        ParentObj.name = `PacvueButton-${type}${icon}`;
        return ParentObj;
      } else if (node.name.includes("\u7070\u8272\u6309\u94AE") || node.name.toLocaleLowerCase().includes("button")) {
        ParentObj.type = "PACVUE";
        let name = "PacvueButton";
        let type2 = "primary";
        if (node.name.includes("\u7070\u8272\u6309\u94AE")) {
          type2 = "";
        }
        if (node.name.includes("\u6B21\u7EA7\u6309\u94AE")) {
          type2 = "plain";
        }
        ParentObj.name = `${name}-${type2}`;
        return ParentObj;
      } else if (node.width == node.height && node.width < 26 && node.type == "INSTANCE") {
        ParentObj.type = "PACVUE";
        const a = node.name;
        let icon = svgIcon[a.trim()];
        ParentObj.name = `PacvueIcon-${icon}`;
        return ParentObj;
      } else {
        const pacvueChildren = childrenList.filter((e) => e.type == "PACVUE");
        if (childrenList.length == 1 && pacvueChildren.length == 1) {
          return childrenList[0];
        }
        if (pacvueChildren.length > 0 && ["Checkbox", "Radio"].includes(pacvueChildren[0].name)) {
          const tipNum = searchByName(visibleChildNode, 0, "tips-exclamation");
          var textLength = searchByType(visibleChildNode, 0, "TEXT");
          var textArr = [];
          if (textLength > 0) {
            const tipNode = getNodeByType(visibleChildNode, [], "TEXT");
            tipNode.forEach((e) => {
              const n2 = e;
              textArr.push(tailwindText2(n2, false));
            });
          }
          ParentObj.html = textArr.join(" ");
          ParentObj.type = "PACVUE";
          ParentObj.name = "Pacvue" + pacvueChildren[0].name + (tipNum > 0 ? "-Tips" : "");
          return ParentObj;
        }
        if (childrenList.length == 1 && styleClass.filter((e) => {
          return e.includes("bg-") || e.includes("border-");
        }).length == 0) {
          return childrenList[0];
        } else {
          ParentObj.children = childrenList;
        }
      }
      return ParentObj;
    } else {
      return ChildObj;
    }
  };
  var uniqueArray = (array) => {
    let arr1 = [];
    array.forEach((value) => {
      if (!arr1.includes(value)) {
        arr1.push(value);
      }
    });
    return arr1;
  };
  var searchByName = (nodeList, num, searchName) => {
    nodeList.forEach((e) => {
      const n = e;
      if (n.children) {
        const visibleChildNode = n.children.filter((d) => d.visible);
        num = searchByName(visibleChildNode, num, searchName);
      }
      if (e.name == searchName) {
        num++;
      }
    });
    return num;
  };
  var getNodeByType = (nodeList, ary, searchName) => {
    nodeList.forEach((e) => {
      const n = e;
      if (n.children) {
        const visibleChildNode = n.children.filter((d) => d.visible);
        ary = getNodeByType(visibleChildNode, ary, searchName);
      }
      if (e.type == searchName) {
        ary.push(e);
      }
    });
    return ary;
  };
  var searchByType = (nodeList, num, searchName) => {
    nodeList.forEach((e) => {
      const n = e;
      if (n.children) {
        const visibleChildNode = n.children.filter((d) => d.visible);
        num = searchByType(visibleChildNode, num, searchName);
      }
      if (e.type == searchName) {
        num++;
      }
    });
    return num;
  };
  var getChildrenAllText = (nodeList, arr) => {
    nodeList.forEach((e) => {
      const n = e;
      if (n.children) {
        const visibleChildNode = n.children.filter((d) => d.visible);
        arr = getChildrenAllText(visibleChildNode, arr);
      }
      if (e.type == "TEXT") {
        const node = e;
        arr.push(node.characters);
      }
    });
    return arr;
  };
  var tailwindText2 = (node, isJsx) => {
    let layoutBuilder = new TailwindTextBuilder(node, localTailwindSettings2.layerName, isJsx).commonPositionStyles(node, localTailwindSettings2.optimizeLayout).textAlign(node);
    const styledHtml = layoutBuilder.getTextSegments(node.id);
    let content = "";
    if (styledHtml.length === 1) {
      layoutBuilder.addAttributes(styledHtml[0].style);
      content = styledHtml[0].text;
    } else {
      content = styledHtml.map((style) => `<span class="${style.style}">${style.text}</span>`).join("");
    }
    return `
<div${layoutBuilder.build()}>${content}</div>`;
  };

  // src/worker/backend/code.ts
  var run = (settings) => {
    if (figma.currentPage.selection.length === 0) {
      figma.ui.postMessage({
        type: "empty"
      });
      return;
    }
    const convertedSelection = convertIntoNodes(
      figma.currentPage.selection,
      null
    );
    let array = tailwindMain1(convertedSelection, settings);
    let result1 = tailwindMain(array, settings);
    figma.ui.postMessage({
      type: "code",
      data: result1,
      settings,
      htmlPreview: null,
      preferences: settings
    });
  };
  var codegenRun = (selection, settings) => {
    const convertedSelection = convertIntoNodes(selection, null);
    let array = tailwindMain1(convertedSelection, settings);
    let result = tailwindMain(array, settings);
    return result;
  };

  // src/worker/code.ts
  var userPluginSettings;
  var defaultPluginSettings = {
    framework: "Tailwind",
    jsx: false,
    optimizeLayout: true,
    layerName: false,
    inlineStyle: true,
    responsiveRoot: false,
    flutterGenerationMode: "snippet",
    swiftUIGenerationMode: "snippet",
    roundTailwind: false
  };
  function isKeyOfPluginSettings(key) {
    return key in defaultPluginSettings;
  }
  var getUserSettings = () => __async(void 0, null, function* () {
    var _a;
    const possiblePluginSrcSettings = (_a = yield figma.clientStorage.getAsync("userPluginSettings")) != null ? _a : {};
    const updatedPluginSrcSettings = __spreadValues(__spreadValues({}, defaultPluginSettings), Object.keys(defaultPluginSettings).reduce((validSettings, key) => {
      if (isKeyOfPluginSettings(key) && key in possiblePluginSrcSettings && typeof possiblePluginSrcSettings[key] === typeof defaultPluginSettings[key]) {
        validSettings[key] = possiblePluginSrcSettings[key];
      }
      return validSettings;
    }, {}));
    userPluginSettings = updatedPluginSrcSettings;
  });
  var initSettings = () => __async(void 0, null, function* () {
    yield getUserSettings();
    figma.ui.postMessage({
      type: "pluginSettingChanged",
      data: userPluginSettings
    });
    safeRun(userPluginSettings);
  });
  var safeRun = (settings) => {
    try {
      run(settings);
    } catch (e) {
      console.error(e);
      if (e && typeof e === "object" && "message" in e) {
        console.log("error1: ", e.stack);
        figma.ui.postMessage({
          type: "error",
          data: e.message
        });
      }
    }
  };
  var standardMode = () => __async(void 0, null, function* () {
    figma.showUI(__html__, { width: 450, height: 550, themeColors: true });
    yield initSettings();
    figma.on("selectionchange", () => {
      safeRun(userPluginSettings);
    });
    figma.ui.onmessage = (msg) => {
      console.log("[node] figma.ui.onmessage", msg);
      if (msg.type === "pluginSettingChanged") {
        userPluginSettings[msg.key] = msg.value;
        figma.clientStorage.setAsync("userPluginSettings", userPluginSettings);
        safeRun(userPluginSettings);
      }
    };
  });
  var codegenMode = () => __async(void 0, null, function* () {
    yield getUserSettings();
    const settings = __spreadProps(__spreadValues({}, userPluginSettings), {
      jsx: false
    });
    figma.codegen.on("generate", ({ language, node }) => {
      const code = codegenRun([node], settings);
      switch (language) {
        case "tailwind":
          return [
            {
              title: `Code`,
              code,
              language: "HTML"
            }
            // {
            //   title: `Colors`,
            //   code: retrieveGenericSolidUIColors("Tailwind")
            //     .map((d) => `#${d.hex} <- ${d.colorName}`)
            //     .join("\n"),
            //   language: "HTML",
            // },
            // {
            //   title: `Text Styles`,
            //   code: tailwindCodeGenTextStyles(),
            //   language: "HTML",
            // },
          ];
        default:
          break;
      }
      const blocks = [];
      return blocks;
    });
  });
  switch (figma.mode) {
    case "default":
    case "inspect":
      standardMode();
      break;
    case "codegen":
      codegenMode();
      break;
    default:
      break;
  }
})();
