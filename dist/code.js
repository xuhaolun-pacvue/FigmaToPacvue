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
      } else if (radius.all >= 999 && node.width < 1e3 && node.height < 1e3) {
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

  // src/worker/backend/common/parseJSX.ts
  var formatWithJSX = (property, isJsx, value) => {
    const jsx_property = property.split("-").map((d, i) => i > 0 ? d.charAt(0).toUpperCase() + d.slice(1) : d).join("");
    if (typeof value === "number") {
      if (isJsx) {
        return `${jsx_property}: ${sliceNum(value)}`;
      } else {
        return `${property}: ${sliceNum(value)}px`;
      }
    } else if (isJsx) {
      return `${jsx_property}: '${value}'`;
    } else {
      return `${property}: ${value}`;
    }
  };
  var formatMultipleJSX = (styles, isJsx) => Object.entries(styles).filter(([key, value]) => value).map(([key, value]) => formatWithJSX(key, isJsx, value)).join(isJsx ? ", " : "; ");

  // src/worker/backend/tailwind/builderImpl/tailwindSize.ts
  var tailwindSizePartial = (node, optimizeLayout) => {
    var _a, _b, _c;
    const size = nodeSize(node, optimizeLayout);
    const node1 = node;
    const nodeParent = (_a = node.parent && optimizeLayout && "inferredAutoLayout" in node.parent ? node.parent.inferredAutoLayout : null) != null ? _a : node.parent;
    let w = "";
    const isReactive = node.type === "GROUP" || "layoutMode" in node && ((_c = (_b = optimizeLayout ? node.inferredAutoLayout : null) != null ? _b : node) == null ? void 0 : _c.layoutMode) === "NONE";
    if (typeof size.width === "number") {
      if (!node1.children && node.type != "TEXT" || isReactive) {
        w = `w-${pxToLayoutSize(size.width)}`;
      }
    } else if (size.width === "fill") {
      if (nodeParent && "layoutMode" in nodeParent && nodeParent.layoutMode === "HORIZONTAL") {
        w = `grow shrink basis-0`;
      } else {
        w = `w-full`;
      }
    }
    let h = "";
    if (typeof size.height === "number") {
      if (!node1.children && node.type != "TEXT" || isReactive) {
        h = `h-${pxToLayoutSize(size.height)}`;
      }
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
      const value1 = pxToFontSize(fontSize);
      if (value1.includes("px]")) {
        if (lineHeightProp > 24) {
          let value;
          if (lineHeightProp % 4 === 0) {
            value = lineHeightProp / 4;
          } else {
            value = `[${lineHeightProp}px]`;
          }
          return `leading-${value}`;
        }
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

  // src/worker/backend/tailwind/PacvueIcon.ts
  var svgIcon = {
    "search": "PacvueIconSearch",
    "remove": "PacvueIconRemove",
    "add": "PacvueIconAdd",
    "tips-exclamation": "PacvueIconTipsExclamation",
    "widget-setting": "PacvueIconWidgetSetting",
    "36) icon/star": "PacvueIconStarfill",
    "add to subtag": "PacvueIconAddToSubtag",
    "save": "PacvueIconSave",
    "eye": "PacvueIconEye",
    "download": "PacvueIconDownload",
    "upload": "PacvueIconUpload",
    "active explorer": "PacvueIconActiveExplorer",
    "all explorer": "PacvueIconAllExplorer",
    "manual": "PacvueIconManual",
    "all-auto&manual": "PacvueIconAllAutoManual",
    "day parting": "PacvueIconDayParting",
    "replay": "PacvueIconReplay",
    "Filter scenes": "PacvueIconFilterScenes",
    "Filter combinations": "PacvueIconFilterCombinations",
    "edit": "PacvueIconEdit",
    "email": "PacvueIconEmail",
    "arrow-drop-down": "PacvueIconArrowDropDown",
    "arrow-drop-up": "PacvueIconArrowDropUp",
    "arrow-left": "PacvueIconArrowLeft",
    "arrow-right": "PacvueIconArrowRight",
    "import-export": "PacvueIconImportExport",
    "Budget schedule": "PacvueIconBudgetSchedule",
    "more": "PacvueIconMore",
    "Active default tag": "PacvueIconActiveDefaultTag",
    "Document": "PacvueIconDocument",
    "refresh": "PacvueIconRefresh",
    "markread": "PacvueIconMarkread",
    "Notification": "PacvueIconNotification",
    "unbind": "PacvueIconUnbind",
    "Edit Profile": "PacvueIconEditProfile",
    "Ignore": "PacvueIconIgnore",
    "explor": "PacvueIconExplor",
    "change live": "PacvueIconChangeLive",
    "switch": "PacvueIconSwitch",
    "close": "PacvueIconClose",
    "view log": "PacvueIconViewLog",
    "delete": "PacvueIconDelete",
    "Component 2": "PacvueIconComponent2",
    "Negative targeting": "PacvueIconNegativeTargeting",
    "from negative keyword": "PacvueIconFromNegativeKeyword",
    "detail": "PacvueIconDetail",
    "Manage": "PacvueIconManage",
    "Accessible account": "PacvueIconAccessibleAccount",
    "Component 1": "PacvueIconComponent1",
    "Log": "PacvueIconLog",
    "menu-fold": "PacvueIconMenuFold",
    "menu-unfold": "PacvueIconMenuUnfold",
    "add to campaign": "PacvueIconAddToCampaign",
    "copy": "PacvueIconCopy",
    "edit-details": "PacvueIconEditdetails",
    "view sov": "PacvueIconViewSov",
    "keyword detail": "PacvueIconKeywordDetail",
    "add to keyword tag": "PacvueIconAddToKeywordTag",
    "tag keywords": "PacvueIconTagKeywords",
    "audit again": "PacvueIconAuditAgain",
    "detail-chart": "PacvueIconDetailChart",
    "reset": "PacvueIconReset",
    "list": "PacvueIconList",
    "User Management": "PacvueIconUserManagement",
    "keyword expansion": "PacvueIconKeywordExpansion",
    "asin expansion": "PacvueIconAsinExpansion",
    "exclude": "PacvueIconExclude",
    "Product Insight": "PacvueIconProductInsight",
    "Add creative": "PacvueIconAddCreative",
    "Balance": "PacvueIconBalance",
    "exclamation": "PacvueIconExclamation",
    "Analysis": "PacvueIconAnalysis",
    "Performance chart": "PacvueIconPerformanceChart",
    "landscape": "PacvueIconLandscape",
    "last period data": "PacvueIconLastPeriodData",
    " drag": "PacvueIconDrag",
    "visibility-off": "PacvueIconVisibilityOff",
    "Monthly Rollover": "PacvueIconMonthlyRollover",
    "Switch to plan": "PacvueIconSwitchToPlan",
    "Switch to metrics": "PacvueIconSwitchToMetrics",
    "rule": "PacvueIconRule",
    "AI": "PacvueIconAi",
    "calendar setting": "PacvueIconCalendarSetting",
    "Bulk Creation Price Tracker": "PacvueIconBulkCreationPriceTracker",
    "convert to": "PacvueIconConvertTo",
    "select Brand": "PacvueIconSelectBrand",
    "show full number": "PacvueIconShowFullNumber",
    "bulk operation": "PacvueIconBulkOperation",
    "run again": "PacvueIconRunAgain",
    "overview": "PacvueIconOverview",
    "audit history": "PacvueIconAuditHistory",
    "Username": "PacvueIconUsername",
    "User Roles": "PacvueIconUserRoles",
    "Date Format": "PacvueIconDateFormat",
    "Time Zone": "PacvueIconTimeZone",
    "Wasted ad spend Reduce bids": "PacvueIconWastedAdSpendReduceBids",
    "Reduce bids": "PacvueIconReduceBids",
    "Increase bids": "PacvueIconIncreaseBids",
    "Increase reach": "PacvueIconIncreaseReach",
    "manage tag": "PacvueIconManageTag",
    "Platform": "PacvueIconPlatform",
    "Apply": "PacvueIconApply",
    "Heat Map": "PacvueIconHeatMap",
    "recommdation": "PacvueIconRecommdation",
    "tag": "PacvueIconTag",
    "notes": "PacvueIconNotes",
    "Chart Control": "PacvueIconChartControl",
    "Add ASIN as PAT to": "PacvueIconAddAsinAsPatTo",
    "Vector": "PacvueIconVector",
    "redo": "PacvueIconRedo",
    "Custom Columns": "PacvueIconCustomColumns",
    "Add to asin tag": "PacvueIconAddToAsinTag",
    "add keyword": "PacvueIconAddKeyword",
    "autorenew": "PacvueIconAutorenew",
    "Designate Brand Tag": "PacvueIconDesignateBrandTag",
    "chevrons-right": "PacvueIconChevronsRight",
    "export": "PacvueIconExport",
    "send again": "PacvueIconSendAgain",
    "refresh data and send again": "PacvueIconRefreshDataAndSendAgain",
    "show abbreviate number": "PacvueIconShowAbbreviateNumber",
    "view history": "PacvueIconViewHistory",
    "Set bid": "PacvueIconSetBid",
    "real time data": "PacvueIconRealTimeData",
    "Column Chart": "PacvueIconColumnChart",
    "Line Chart": "PacvueIconLineChart",
    "Vendor": "PacvueIconVendor",
    "Seller": "PacvueIconSeller",
    "Retail Dashboard": "PacvueIconRetailerDashboard",
    "Share Center": "PacvueIconShareCenter",
    "Keyword Opporyunity": "PacvueIconKeywordOpporyunity",
    "Not Override ASIN": "PacvueIconOverrideAsin",
    "Override ASIN": "PacvueIconNotOverrideAsin",
    "Leader": "PacvueIconLeader",
    "Super admin": "PacvueIconSuperAdmin",
    "  admin": "PacvueIconAdminGrey",
    "Assign to Campaigns": "PacvueIconAssignToCampaigns",
    "Merge to Deal Term": "PacvueIconMergeToDealTerm",
    "Merge Other Deal Terms": "PacvueIconMergeOtherDealTerms",
    "close-circle-fill": "PacvueIconCloseCircleFill",
    "wiget-drag": "PacvueIconWigetDrag",
    "ASIN warning Orange": "PacvueIconAsinWarningOrange",
    "ASIN warning red": "PacvueIconAsinWarningred",
    "star-fill": "PacvueIconStarfill",
    "star gray": "PacvueIconStar",
    "weixuan": "PacvueIconWeixuan",
    "Add to Targeting": "PacvueIconAddtotargeting",
    "filter-check": "PacvueIconFilterCheck",
    "loading": "PacvueIconLoading",
    "crown": "PacvueIconCrown",
    "\u4E91\u4E0B\u8F7D 1": "PacvueIconCommerceDownloadCenter",
    "binding": "PacvueIconBinding",
    "rank": "PacvueIconRank",
    "zhiding": "PacvueIconZhiding",
    "pat detail": "PacvueIconPatDetail",
    "Arrow left": "PacvueIconLeftArrow",
    "Arrow Right": "PacvueIconRightArrow",
    "mobile": "PacvueIconMobile",
    "pc": "PacvueIconPc",
    "import": "PacvueIconImportExport",
    "Audience Expansion": "PacvueIconAudienceExpansion",
    "Row height": "PacvueIconRowHeight",
    "sparkles": "PacvueIconSparkles",
    "Authorize": "PacvueIconAuthorize",
    "Shopping, buybox": "PacvueIconShoppingCart",
    "Ticket \u3001coupon": "PacvueIconDiscountCoupon",
    "Skip": "PacvueIconSkip1",
    "top bar-arrow-down": "PacvueIconTopBarArrowDown",
    "IconCursorMouse/size4": ""
  };

  // src/worker/backend/tailwind/pacvueMain.ts
  var localTailwindSettings;
  var pacvueMain = (sceneNode, settings) => {
    localTailwindSettings = settings;
    let result = tailwindWidgetGenerator(sceneNode);
    return result;
  };
  var tailwindWidgetGenerator = (sceneNode) => {
    let array = [];
    const visibleSceneNode = sceneNode.filter((d) => d.visible);
    visibleSceneNode.forEach((node) => {
      array.push(tailwindContainer(node));
    });
    return array;
  };
  var tailwindContainer = (node) => {
    const nodeStyle = node;
    var styleClass = getStyle(nodeStyle);
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
    const n = node;
    let visibleChildNode = [];
    if (n.children) {
      visibleChildNode = n.children.filter((d) => d.visible);
    }
    var childrenList = [];
    visibleChildNode.forEach((e) => {
      childrenList.push(tailwindContainer(e));
    });
    let height = node.height;
    childrenList.forEach((e) => {
      if (e.height > height) {
        height = e.height;
      }
    });
    const arrowNum = searchByName(visibleChildNode, 0, "top bar-arrow-down");
    ParentObj.height = height;
    if (childrenList.some((e) => ["\u591A\u9009\u6846", "Checkbox"].includes(e.name))) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueCheckbox";
    } else if (childrenList.some((e) => ["\u5355\u9009\u6846", "Radio"].includes(e.name))) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueRadio";
    }
    if (isAllPacvueRadio(childrenList)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueRadioGroup";
      ParentObj.children = childrenList;
    } else if (isSmallSizedElement(node, childrenList)) {
      ParentObj.type = "PACVUE";
      const a = node.name;
      let icon = svgIcon[a.trim()];
      ParentObj.name = `PacvueIcon-${icon}`;
    } else if (isCustomButton(node, styleClass)) {
      ParentObj.type = "PACVUE";
      if (node.height !== node.width) {
        const excludedClasses = ["rounded-md", "rounded", "border", "border-[var(--icon-disabled--)]", "h-9", "h-8"];
        const newClass = styleClass.filter((e) => !excludedClasses.includes(e) && !e.includes("px") && !e.includes("py"));
        const dateNum = searchByName(visibleChildNode, 0, "Rectangle 1138");
        const textLength2 = searchByType(visibleChildNode, 0, "TEXT");
        const textArr2 = textLength2 > 0 ? getChildrenAllText(visibleChildNode, []) : [];
        let name;
        if (dateNum > 0) {
          name = "PacvueDatePicker";
          if (textArr2.some((e) => e === "~" || e.includes("~"))) {
            name += "-daterange";
          }
        } else if (arrowNum === 0) {
          name = "PacvueInput";
          textArr2.forEach((e) => {
            if (e.length === 1) {
              name += `-${e}`;
            }
          });
        } else {
          name = "PacvueSelect";
          const num = searchByName(visibleChildNode, 0, "Rectangle 539");
          if (num === 1) {
            name += `-${textArr2[0]}`;
          }
        }
        ParentObj.name = name;
        ParentObj.style = newClass;
      } else {
        ParentObj.name = `PacvueButton-${getIconName(visibleChildNode)}`;
      }
    } else if (isArrowBlock(childrenList, arrowNum)) {
      ParentObj.type = "PACVUE";
      var textLength = searchByType(visibleChildNode, 0, "TEXT");
      var textArr = [];
      if (textLength > 0) {
        textArr = getChildrenAllText(visibleChildNode, textArr);
      }
      let name = "PacvueInput-Selection";
      textArr.forEach((e) => {
        if (e.length == 1) {
          name += "-" + e;
        }
      });
      ParentObj.name = name;
    } else if (isCheckbox(node)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "Checkbox";
    } else if (isRadioButton(node, styleClass)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "Radio";
    } else if (hasArrowDownElement(childrenList)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueDropdown";
      ParentObj.children = childrenList;
    } else if (isSwitch(node)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueSwitch";
    } else if (isTextArea(node)) {
      if (childrenList.some((e) => ["\u6587\u672C\u57DF", "PacvueInput-Textarea"].includes(e.name))) {
        ParentObj.type = "PACVUE";
        ParentObj.name = "PacvueInput-Textarea";
      } else {
        ParentObj.children = childrenList;
      }
    } else if (isSearchBox(node)) {
      let slot = childrenList.length == 1 && childrenList[0].name == "Search\u5728\u540E" ? "-append" : "-prefix";
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueInput-Search" + slot;
    } else if (isInputWithHeight(node, childrenList)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueInput-Textarea";
    } else if (isTab(node, childrenList)) {
      ParentObj.type = "PACVUE";
      ParentObj.name = "PacvueTab";
    } else if (isPrimaryOrSecondaryButton(node, styleClass)) {
      ParentObj.type = "PACVUE";
      let icon = "";
      const iconList = visibleChildNode.filter((e) => e.width === e.height && e.type !== "TEXT");
      if (iconList.length === 1) {
        const iconName = iconList[0].name.trim();
        icon += "-" + svgIcon[iconName];
      }
      const type = styleClass.includes("bg-[var(--el-color-primary)]") || node.name.includes("\u4E3B\u8981\u6309\u94AE") ? "primary" : "primaryplain";
      ParentObj.name = `PacvueButton-${type}${icon}`;
    } else if (isGrayButton(node)) {
      ParentObj.type = "PACVUE";
      let type = node.name.includes("\u7070\u8272\u6309\u94AE") ? "" : node.name.includes("\u6B21\u7EA7\u6309\u94AE") ? "plain" : "primary";
      ParentObj.name = `PacvueButton-${type}`;
    }
    const pacvueChildren = childrenList.filter((e) => e.type == "PACVUE");
    const conditions = ["bg-", "border-", "grow", "px-", "py-", "pt-", "pr-", "pb-", "pl-", "p-"];
    if (ParentObj.type != "PACVUE" && childrenList.length == 1 && (pacvueChildren.length == 1 || !styleClass.some((e) => {
      return conditions.some((cond) => e.includes(cond));
    }))) {
      return childrenList[0];
    } else {
      ParentObj.children = childrenList;
    }
    return ParentObj;
  };
  var isAllPacvueRadio = (childrenList) => {
    return childrenList.length > 1 && childrenList.filter((e) => e.name == "PacvueRadio").length == childrenList.length;
  };
  var isCustomButton = (node, styleClass) => {
    const isHeightInRange = node.height < 40 && node.height > 30;
    const hasRoundedClass = styleClass.includes("rounded-md") || styleClass.includes("rounded");
    const hasBorderClass = styleClass.includes("border");
    const hasIconDisabledBorder = styleClass.includes("border-[var(--icon-disabled--)]");
    return isHeightInRange && hasRoundedClass && hasBorderClass && hasIconDisabledBorder;
  };
  var isArrowBlock = (childrenList, arrowNum) => {
    var _a, _b;
    const hasTwoChildren = childrenList.length === 2;
    const isFirstChildRounded = (_a = childrenList[0]) == null ? void 0 : _a.style.includes("rounded-tl rounded-bl");
    const isSecondChildRounded = (_b = childrenList[1]) == null ? void 0 : _b.style.includes("rounded-tr rounded-br");
    const isArrowNumOne = arrowNum === 1;
    return hasTwoChildren && isFirstChildRounded && isSecondChildRounded && isArrowNumOne;
  };
  var isCheckbox = (node) => {
    return node.height == node.width && node.height == 18 && node.name != "Union" || node.name == "\u591A\u9009\u6846";
  };
  var isRadioButton = (node, styleClass) => {
    return node.height == node.width && node.height == 20 && styleClass.includes("rounded-full") || node.name == "\u5355\u9009\u6846";
  };
  var hasArrowDownElement = (childrenList) => {
    return childrenList.some((e) => ["top bar-arrow-down", "PacvueIcon-PacvueIconTopBarArrowDown"].includes(e.name));
  };
  var isSwitch = (node) => {
    return node.name == "\u5F00\u5173";
  };
  var isTextArea = (node) => {
    return node.name == "\u6587\u672C\u57DF";
  };
  var isSearchBox = (node) => {
    return node.name == "\u641C\u7D22\u6846";
  };
  var isInputWithHeight = (node, childrenList) => {
    return childrenList.length == 1 && childrenList[0].name == "Input" && node.height >= 40;
  };
  var isTab = (node, childrenList) => {
    return node.name.includes("tab") || childrenList.length > 1 && childrenList[0].style.includes("rounded-tl rounded-bl") && childrenList[childrenList.length - 1].style.includes("rounded-tr rounded-br");
  };
  var isPrimaryOrSecondaryButton = (node, styleClass) => {
    const isMainButton = node.name.includes("\u4E3B\u8981\u6309\u94AE");
    const isSecondaryButton = node.name.includes("\u6B21\u7EA7\u6309\u94AE");
    const isBorderHeight = node.height === 36 || node.height === 32;
    const hasBorderClass = styleClass.includes("border");
    const hasPrimaryBorderColor = styleClass.includes("border-[var(--el-color-primary)]");
    const isNotRounded = !styleClass.includes("rounded-tr rounded-br") && !styleClass.includes("rounded-tl rounded-bl");
    return isMainButton || isSecondaryButton || isBorderHeight && hasBorderClass && hasPrimaryBorderColor && isNotRounded;
  };
  var isGrayButton = (node) => {
    return node.name.includes("\u7070\u8272\u6309\u94AE") || node.name.toLocaleLowerCase().includes("button");
  };
  var isSmallSizedElement = (node, childrenList) => {
    const isSquareWithUnion = node.width == node.height && node.width < 26 && childrenList.some((e) => e.name == "Union");
    const isSingleIconUndefined = childrenList.length == 1 && childrenList[0].name == "PacvueIcon-undefined";
    return isSquareWithUnion || isSingleIconUndefined;
  };
  var getIconName = (visibleChildNode) => {
    let icon = "-";
    const iconList = visibleChildNode.filter((e) => e.width === e.height && e.type !== "TEXT");
    if (iconList.length === 1) {
      const iconName = iconList[0].name.trim();
      icon += svgIcon[iconName];
    }
    return icon;
  };
  var uniqueArray = (array) => {
    let arr1 = [];
    array.forEach((value) => {
      if (!arr1.includes(value) && value && value != " ") {
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
  var getStyle = (node) => {
    var builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false).commonPositionStyles(node, localTailwindSettings.optimizeLayout).commonShapeStyles(node);
    switch (node.type) {
      case "RECTANGLE":
      case "ELLIPSE":
      case "LINE":
      case "FRAME":
      case "COMPONENT":
      case "INSTANCE":
      case "COMPONENT_SET":
        break;
      case "GROUP":
        builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false).blend(node).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout);
        break;
      case "TEXT":
        let layoutBuilder2 = new TailwindTextBuilder(node, localTailwindSettings.layerName, false).commonPositionStyles(node, localTailwindSettings.optimizeLayout).textAlign(node);
        const styledHtml = layoutBuilder2.getTextSegments(node.id);
        break;
      case "SECTION":
        builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout).customColor(node.fills, "bg");
        break;
    }
    const node1 = node;
    var layoutBuilder = tailwindAutoLayoutProps(node, node1);
    var build = [...builder.attributes, ...layoutBuilder.split(" ")];
    var styleClass = uniqueArray(build);
    return styleClass;
  };

  // src/worker/backend/tailwind/tailwindMain.ts
  var localTailwindSettings2;
  var previousExecutionCache;
  var selfClosingTags = ["img"];
  var tailwindMain = (sceneNode, settings) => {
    localTailwindSettings2 = settings;
    previousExecutionCache = [];
    let result = tailwindWidgetGenerator2(sceneNode, localTailwindSettings2.jsx);
    if (result.length > 0 && result.startsWith("\n")) {
      result = result.slice(1, result.length);
    }
    return result;
  };
  var tailwindWidgetGenerator2 = (sceneNode, isJsx) => {
    let comp = "";
    sceneNode.forEach((e) => {
      switch (e.type) {
        case "PACVUE":
          comp += pacvueContainer(e);
          break;
        case "RECTANGLE":
        case "ELLIPSE":
          comp += tailwindContainer2(e.node, "", "", isJsx);
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
    const childrenStr = tailwindWidgetGenerator2(obj.children, isJsx);
    var rowColumn = "";
    if (obj.children.length > 1) {
      if (node.layoutMode !== "NONE") {
        rowColumn = tailwindAutoLayoutProps(node, node);
      } else if (localTailwindSettings2.optimizeLayout && node.inferredAutoLayout !== null) {
        rowColumn = tailwindAutoLayoutProps(node, node.inferredAutoLayout);
      }
    }
    return tailwindContainer2(node, childrenStr, rowColumn, isJsx);
  };
  var tailwindGroup = (obj, isJsx = false) => {
    const node = obj.node;
    if (obj.width < 0 || node.height <= 0 || node.children.length === 0) {
      return "";
    }
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, isJsx).blend(node);
    builder.size1(obj);
    builder.position(node, localTailwindSettings2.optimizeLayout);
    const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings2.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible && ["RECTANGLE", "VECTOR"].includes(e.type) || e.name.includes("\u77E9\u5F62"));
    if (visibleChildNode.length > 1) {
      visibleChildNode.forEach((e) => {
        var _a;
        const cnode = node;
        if (((_a = retrieveTopFill(cnode.fills)) == null ? void 0 : _a.type) !== "IMAGE") {
          builder.border(e);
        }
      });
    }
    if (builder.attributes || builder.style) {
      const attr = builder.build("");
      const generator = tailwindWidgetGenerator2(obj.children, isJsx);
      return `
<div${attr}>${indentString(generator)}
</div>`;
    }
    return tailwindWidgetGenerator2(obj.children, isJsx);
  };
  var tailwindText = (node, isJsx) => {
    let layoutBuilder = new TailwindTextBuilder(node, localTailwindSettings2.layerName, isJsx).commonPositionStyles(node, localTailwindSettings2.optimizeLayout).textAlign(node);
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
  var tailwindContainer2 = (node, children, additionalAttr, isJsx) => {
    var _a;
    if (node.width < 0 || node.height < 0) {
      return children;
    }
    let builder = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, isJsx).commonPositionStyles(node, localTailwindSettings2.optimizeLayout).commonShapeStyles(node);
    let builder2 = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, isJsx).commonShapeStyles(node);
    const asnode = node;
    const childrNode = commonSortChildrenWhenInferredAutoLayout(asnode, localTailwindSettings2.optimizeLayout);
    const visibleChildNode = childrNode.filter((e) => e.visible && ["RECTANGLE", "VECTOR"].includes(e.type) && e.name.includes("\u77E9\u5F62"));
    if (visibleChildNode.length > 1) {
      visibleChildNode.forEach((e) => {
        var _a2;
        const cnode = node;
        if (((_a2 = retrieveTopFill(cnode.fills)) == null ? void 0 : _a2.type) !== "IMAGE") {
          builder.border(e);
        }
      });
    }
    if (builder.attributes || additionalAttr) {
      var build = builder.build(additionalAttr);
      let tag = "div";
      let src = "";
      if (((_a = retrieveTopFill(node.fills)) == null ? void 0 : _a.type) === "IMAGE") {
        if (!("children" in node) || node.children.length === 0) {
          build = builder2.build(additionalAttr);
          tag = "img";
          src = ` src="https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)}"`;
        } else {
          builder.addAttributes(`bg-[url(https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)})]`);
        }
      }
      if (build.includes(" px-6 pt-6 pb-8")) {
        build = build.replace(" px-6 pt-6 pb-8", "");
        let a = build.split(" ");
        let b = a.filter((e) => !e.includes("w-") && e != "");
        build = ' class="' + b.join(" ");
      }
      if (children) {
        const n = node;
        if ((!build || build == ' class="w-full"') && !src && n.children.length === 1) {
          return children;
        } else {
          return `
<${tag}${build}${src}>${indentString(children)}
</${tag}>`;
        }
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
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, isJsx).commonPositionStyles(node, localTailwindSettings2.optimizeLayout).commonShapeStyles(node);
    return `
<div${builder.build()}></div>`;
  };
  var tailwindSection = (obj, isJsx) => {
    const node = obj.node;
    const childrenStr = tailwindWidgetGenerator2(obj.children, isJsx);
    const builder = new TailwindDefaultBuilder(node, localTailwindSettings2.layerName, isJsx).size(node, localTailwindSettings2.optimizeLayout).position(node, localTailwindSettings2.optimizeLayout).customColor(node.fills, "bg");
    if (childrenStr) {
      return `
<div${builder.build()}>${indentString(childrenStr)}
</div>`;
    } else {
      return `
<div${builder.build()}></div>`;
    }
  };
  var pacvueContainer = (node) => {
    var ary = node.name.split("-");
    var comp = "";
    const width = node.width ? ` width="${node.width}px"` : "";
    switch (ary[0]) {
      case "PacvueSelect":
        const labelInner = ary[1] ? ` labelInner="${ary[1]}"` : "";
        comp = indentString(`
<${ary[0]}${width}${labelInner} />`);
        break;
      case "PacvueInput":
        let endTag = " />";
        let slotCont = "";
        let slot = "";
        if (ary[1]) {
          switch (ary[1]) {
            case "Textarea":
              const rows = node.height ? ` :rows="${((node.height - 10) / 21).toFixed(0)}"` : "";
              endTag = ` type="textarea"${rows}/>`;
              break;
            case "Search":
              slotCont = indentString(`
<el-icon><PacvueIconSearch /></el-icon>`);
              slot = indentString(`
<template #${ary[2]}>${slotCont}
</template>`);
              endTag = ` >
${slot}</${ary[0]}>`;
              break;
            case "Selection":
              if (ary[2]) {
                const slotType = ary[2] == "%" ? "suffix" : "prefix";
                slotCont = indentString(`
<span>${ary[2]}</span>`);
                slot = indentString(`
<template #${slotType}>${slotCont}
</template>`);
              }
              endTag = ` :inputWithSelection="true" :removeDuplication="true">${slot}
</${ary[0]}>`;
              break;
            case "%":
              slotCont = indentString(`
<span>${ary[1]}</span>`);
              slot = indentString(`
<template #suffix>${slotCont}
</template>`);
              endTag = ` >${slot}
</${ary[0]}>`;
              break;
            default:
              slotCont = indentString(`
<span>${ary[1]}</span>`);
              slot = indentString(`
<template #prefix>${slotCont}
</template>`);
              endTag = ` >${slot}
</${ary[0]}>`;
              break;
          }
        }
        comp = `
<${ary[0]}${width}${endTag}`;
        break;
      case "PacvueDatePicker":
        const datetype = ary[1] ? ` type="${ary[1]}"` : "";
        comp = `
<${ary[0]}${datetype} />`;
        break;
      case "PacvueCheckbox":
      case "PacvueRadio":
        const list = node.children.filter((e) => e.type != "PACVUE");
        const text = tailwindWidgetGenerator2(list, false);
        const line = text.split("\n");
        if (line.length > 6) {
          comp = `
<${ary[0]} style="margin-right: 0"></${ary[0]}>${indentString(text)}`;
        } else {
          comp = `
<${ary[0]} style="margin-right: 0">${indentString(text)}
</${ary[0]}>`;
        }
        break;
      case "PacvueButton":
        let nodeClone = node.node;
        let html = getChildrenAllText(node.node.children, []).join(" ");
        if (node.children.length > 1) {
          const child = tailwindWidgetGenerator2(node.children, false);
          const flexStyle = tailwindAutoLayoutProps(nodeClone, nodeClone);
          html = `
<div class="${flexStyle}">${indentString(child)}
</div>
`;
        }
        let type = "";
        let size = node.height == 32 ? ' size="small"' : "";
        if (ary[1]) {
          if (ary[1].includes("primary")) {
            type = ` type="primary"`;
          }
          if (ary[1].includes("plain")) {
            type += " plain";
          }
        }
        comp = `
<${ary[0]}${type}${size}>${indentString(html)}</${ary[0]}>`;
        break;
      case "PacvueSwitch":
        comp = `
<${ary[0]} />`;
        break;
      case "PacvueRadioGroup":
        let builder = new TailwindDefaultBuilder(node.node, localTailwindSettings2.layerName, false).commonPositionStyles(node.node, localTailwindSettings2.optimizeLayout).commonShapeStyles(node.node);
        const rowColumn = tailwindAutoLayoutProps(node.node, node.node.inferredAutoLayout);
        var build = "";
        if (builder.attributes || rowColumn) {
          build = builder.build(rowColumn);
        }
        comp = `
<pacvue-radio-group ${build}>${indentString(tailwindWidgetGenerator2(node.children, false))}
</pacvue-radio-group>`;
        break;
      case "PacvueTab":
        let tabhtml = "";
        node.children.forEach((e) => {
          const text2 = getChildrenAllText([e.node], []).join(" ");
          if (node.children.some((a) => {
            return a.style.includes("border");
          })) {
            tabhtml += `
<pacvue-radio-button >${text2}</pacvue-radio-button>`;
            comp = `
<pacvue-radio-group>${indentString(tabhtml)}
</pacvue-radio-group>`;
          } else {
            tabhtml += `
<el-tab-pane label="${text2}"></el-tab-pane>`;
            comp = `
<PacvueTab tab-position="top">${indentString(tabhtml)}
</PacvueTab>`;
          }
        });
        break;
      case "PacvueIcon":
        if (ary[1] == "PacvueIconTipsExclamation") {
          const tooltipContent = indentString(`
<template #content>${indentString(`
<div><!-- Tooltip\u6587\u6848 --></div>`)}
</template>
<el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>`);
          const tooltipComponent = `
<pacvue-tooltip placement="top" effect="dark">${tooltipContent}
</pacvue-tooltip>`;
          comp = tooltipComponent;
        } else {
          comp = `
<el-icon :size="20"><${ary[1]}></${ary[1]}></el-icon>`;
        }
        break;
      case "PacvueDropdown":
        const buildClass = node.style.join(" ");
        const dropdownReferenceTemplate = indentString(`
<template #reference>${indentString(`
<div class="${buildClass}">${indentString(tailwindWidgetGenerator2(node.children, false))}
</div>`)}
</template>`);
        const dropdownComponent = `
<pacvue-dropdown>${dropdownReferenceTemplate}
</pacvue-dropdown>`;
        comp = dropdownComponent;
        break;
      default:
        return "";
    }
    return comp;
  };

  // src/worker/backend/style/builderImpl/htmlColor.ts
  var pacvueColors2 = {
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
  var htmlColorFromFills = (fills) => {
    const fill = retrieveTopFill(fills);
    if (fill && fill.type === "SOLID") {
      return htmlColor(fill.color, fill.opacity);
    }
    if (fill && (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_DIAMOND")) {
      if (fill.gradientStops.length > 0) {
        return htmlColor(
          fill.gradientStops[0].color,
          fill.opacity
        );
      }
    }
    return "";
  };
  var htmlColor = (color, alpha = 1) => {
    if (color.r === 1 && color.g === 1 && color.b === 1 && alpha === 1) {
      return "var(--el-color-white)";
    }
    if (color.r === 0 && color.g === 0 && color.b === 0 && alpha === 1) {
      return "var(--el-color-black)";
    }
    if (alpha === 1) {
      const r2 = Math.round(color.r * 255);
      const g2 = Math.round(color.g * 255);
      const b2 = Math.round(color.b * 255);
      const toHex = (num) => num.toString(16).padStart(2, "0");
      const hexColor = `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`.toLowerCase();
      if (pacvueColors2[hexColor]) {
        return `var(${pacvueColors2[hexColor]})`;
      }
      return hexColor.toUpperCase();
    }
    const r = sliceNum(color.r * 255);
    const g = sliceNum(color.g * 255);
    const b = sliceNum(color.b * 255);
    const a = sliceNum(alpha);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };
  var htmlGradientFromFills = (fills) => {
    const fill = retrieveTopFill(fills);
    if ((fill == null ? void 0 : fill.type) === "GRADIENT_LINEAR") {
      return htmlLinearGradient(fill);
    } else if ((fill == null ? void 0 : fill.type) === "GRADIENT_ANGULAR") {
      return htmlAngularGradient(fill);
    } else if ((fill == null ? void 0 : fill.type) === "GRADIENT_RADIAL") {
      return htmlRadialGradient(fill);
    }
    return "";
  };
  var gradientAngle2 = (fill) => {
    const x1 = fill.gradientTransform[0][2];
    const y1 = fill.gradientTransform[1][2];
    const x2 = fill.gradientTransform[0][0] + x1;
    const y2 = fill.gradientTransform[1][0] + y1;
    const dx = x2 - x1;
    const dy = y1 - y2;
    const radians = Math.atan2(dy, dx);
    const unadjustedAngle = radians * 180 / Math.PI;
    const adjustedAngle = unadjustedAngle + 90;
    return adjustedAngle;
  };
  var cssGradientAngle = (angle) => {
    const cssAngle = angle;
    return cssAngle < 0 ? cssAngle + 360 : cssAngle;
  };
  var htmlLinearGradient = (fill) => {
    const figmaAngle = gradientAngle2(fill);
    const angle = cssGradientAngle(figmaAngle).toFixed(0);
    const mappedFill = fill.gradientStops.map((stop) => {
      var _a;
      const color = htmlColor(stop.color, stop.color.a * ((_a = fill.opacity) != null ? _a : 1));
      const position = `${(stop.position * 100).toFixed(0)}%`;
      return `${color} ${position}`;
    }).join(", ");
    return `linear-gradient(${angle}deg, ${mappedFill})`;
  };
  var getGradientTransformCoordinates = (gradientTransform) => {
    const a = gradientTransform[0][0];
    const b = gradientTransform[0][1];
    const c = gradientTransform[1][0];
    const d = gradientTransform[1][1];
    const e = gradientTransform[0][2];
    const f = gradientTransform[1][2];
    const scaleX = Math.sqrt(__pow(a, 2) + __pow(b, 2));
    const scaleY = Math.sqrt(__pow(c, 2) + __pow(d, 2));
    const rotationAngle = Math.atan2(b, a);
    const centerX = (e * scaleX * 100 / (1 - scaleX)).toFixed(2);
    const centerY = ((1 - f) * scaleY * 100 / (1 - scaleY)).toFixed(2);
    const radiusX = (scaleX * 100).toFixed(2);
    const radiusY = (scaleY * 100).toFixed(2);
    return { centerX, centerY, radiusX, radiusY };
  };
  var htmlRadialGradient = (fill) => {
    const mappedFill = fill.gradientStops.map((stop) => {
      var _a;
      const color = htmlColor(stop.color, stop.color.a * ((_a = fill.opacity) != null ? _a : 1));
      const position = `${(stop.position * 100).toFixed(0)}%`;
      return `${color} ${position}`;
    }).join(", ");
    const { centerX, centerY, radiusX, radiusY } = getGradientTransformCoordinates(fill.gradientTransform);
    return `radial-gradient(${radiusX}% ${radiusY}% at ${centerX}% ${centerY}%, ${mappedFill})`;
  };
  var htmlAngularGradient = (fill) => {
    const angle = gradientAngle2(fill).toFixed(0);
    const centerX = (fill.gradientTransform[0][2] * 100).toFixed(2);
    const centerY = (fill.gradientTransform[1][2] * 100).toFixed(2);
    const mappedFill = fill.gradientStops.map((stop) => {
      var _a;
      const color = htmlColor(stop.color, stop.color.a * ((_a = fill.opacity) != null ? _a : 1));
      const position = `${(stop.position * 360).toFixed(0)}deg`;
      return `${color} ${position}`;
    }).join(", ");
    return `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${mappedFill})`;
  };

  // src/worker/backend/style/builderImpl/htmlShadow.ts
  var htmlShadow = (node) => {
    if (node.effects && node.effects.length > 0) {
      const shadowEffects = node.effects.filter(
        (d) => (d.type === "DROP_SHADOW" || d.type === "INNER_SHADOW" || d.type === "LAYER_BLUR") && d.visible
      );
      if (shadowEffects.length > 0) {
        const shadow = shadowEffects[0];
        let x = 0;
        let y = 0;
        let blur = 0;
        let spread = "";
        let inner = "";
        let color = "";
        if (shadow.type === "DROP_SHADOW" || shadow.type === "INNER_SHADOW") {
          x = shadow.offset.x;
          y = shadow.offset.y;
          blur = shadow.radius;
          spread = shadow.spread ? `${shadow.spread}px ` : "";
          inner = shadow.type === "INNER_SHADOW" ? " inset" : "";
          color = htmlColor(shadow.color, shadow.color.a);
        } else if (shadow.type === "LAYER_BLUR") {
          x = shadow.radius;
          y = shadow.radius;
          blur = shadow.radius;
        }
        return `${x}px ${y}px ${blur}px ${spread}${color}${inner}`;
      }
    }
    return "";
  };

  // src/worker/backend/style/builderImpl/htmlBlend.ts
  var htmlOpacity = (node, isJsx) => {
    if (node.opacity !== void 0 && node.opacity !== 1) {
      if (isJsx) {
        return `opacity: ${sliceNum(node.opacity)}`;
      } else {
        return `opacity: ${sliceNum(node.opacity)}`;
      }
    }
    return "";
  };
  var htmlBlendMode = (node, isJsx) => {
    if (node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
      let blendMode = "";
      switch (node.blendMode) {
        case "MULTIPLY":
          blendMode = "multiply";
          break;
        case "SCREEN":
          blendMode = "screen";
          break;
        case "OVERLAY":
          blendMode = "overlay";
          break;
        case "DARKEN":
          blendMode = "darken";
          break;
        case "LIGHTEN":
          blendMode = "lighten";
          break;
        case "COLOR_DODGE":
          blendMode = "color-dodge";
          break;
        case "COLOR_BURN":
          blendMode = "color-burn";
          break;
        case "HARD_LIGHT":
          blendMode = "hard-light";
          break;
        case "SOFT_LIGHT":
          blendMode = "soft-light";
          break;
        case "DIFFERENCE":
          blendMode = "difference";
          break;
        case "EXCLUSION":
          blendMode = "exclusion";
          break;
        case "HUE":
          blendMode = "hue";
          break;
        case "SATURATION":
          blendMode = "saturation";
          break;
        case "COLOR":
          blendMode = "color";
          break;
        case "LUMINOSITY":
          blendMode = "luminosity";
          break;
      }
      if (blendMode) {
        return formatWithJSX("mix-blend-mode", isJsx, blendMode);
      }
    }
    return "";
  };
  var htmlVisibility = (node, isJsx) => {
    if (node.visible !== void 0 && !node.visible) {
      return formatWithJSX("visibility", isJsx, "hidden");
    }
    return "";
  };
  var htmlRotation = (node, isJsx) => {
    if (node.rotation !== void 0 && Math.round(node.rotation) !== 0) {
      return [
        formatWithJSX(
          "transform",
          isJsx,
          `rotate(${sliceNum(-node.rotation)}deg)`
        ),
        formatWithJSX("transform-origin", isJsx, "0 0")
      ];
    }
    return [];
  };

  // src/worker/backend/style/builderImpl/htmlPadding.ts
  var htmlPadding = (node, isJsx) => {
    const padding = commonPadding(node);
    if (padding === null) {
      return [];
    }
    if ("all" in padding) {
      if (padding.all !== 0) {
        return [formatWithJSX("padding", isJsx, padding.all)];
      } else {
        return [];
      }
    }
    let comp = [];
    if ("horizontal" in padding) {
      if (padding.horizontal !== 0 || padding.vertical !== 0) {
        let y = padding.vertical !== 0 ? padding.vertical + "px" : 0;
        let x = padding.horizontal !== 0 ? padding.horizontal + "px" : 0;
        let paddingxy = `${y} ${x}`;
        comp.push(formatWithJSX("padding", isJsx, paddingxy));
      }
      return comp;
    }
    let index = 0;
    const directions = ["top", "bottom", "left", "right"];
    directions.forEach((direction) => {
      if (padding[direction] !== 0) {
        index++;
      }
    });
    if (index <= 2) {
      if (padding.top !== 0) {
        comp.push(formatWithJSX("padding-top", isJsx, padding.top));
      }
      if (padding.bottom !== 0) {
        comp.push(formatWithJSX("padding-bottom", isJsx, padding.bottom));
      }
      if (padding.left !== 0) {
        comp.push(formatWithJSX("padding-left", isJsx, padding.left));
      }
      if (padding.right !== 0) {
        comp.push(formatWithJSX("padding-right", isJsx, padding.right));
      }
    } else {
      const top = padding.top !== 0 ? padding.top + "px" : 0;
      const bottom = padding.top !== 0 ? padding.top + "px" : 0;
      const left = padding.top !== 0 ? padding.top + "px" : 0;
      const right = padding.top !== 0 ? padding.top + "px" : 0;
      let p = `${top} ${right} ${bottom} ${left}`;
      comp.push(formatWithJSX("padding", isJsx, p));
    }
    return comp;
  };

  // src/worker/backend/style/builderImpl/htmlSize.ts
  var isPreviewGlobal = false;
  var htmlSizePartial = (node, isJsx, optimizeLayout) => {
    var _a;
    if (isPreviewGlobal && node.parent === void 0) {
      return {
        width: formatWithJSX("width", isJsx, "100%"),
        height: formatWithJSX("height", isJsx, "100%")
      };
    }
    const size = nodeSize(node, optimizeLayout);
    const nodeParent = (_a = node.parent && optimizeLayout && "inferredAutoLayout" in node.parent ? node.parent.inferredAutoLayout : null) != null ? _a : node.parent;
    let w = "";
    if (typeof size.width === "number") {
      w = formatWithJSX("width", isJsx, size.width);
    } else if (size.width === "fill") {
      if (nodeParent && "layoutMode" in nodeParent && nodeParent.layoutMode === "HORIZONTAL") {
        w = formatWithJSX("flex", isJsx, "1 1 0");
      } else {
        w = formatWithJSX("align-self", isJsx, "stretch");
      }
    }
    let h = "";
    if (typeof size.height === "number") {
      h = formatWithJSX("height", isJsx, size.height);
    } else if (typeof size.height === "string") {
      if (nodeParent && "layoutMode" in nodeParent && nodeParent.layoutMode === "VERTICAL") {
        h = formatWithJSX("flex", isJsx, "1 1 0");
      } else {
        h = formatWithJSX("align-self", isJsx, "stretch");
      }
    }
    return { width: w, height: h };
  };

  // src/worker/backend/style/builderImpl/htmlBorderRadius.ts
  var htmlBorderRadius = (node, isJsx) => {
    const radius = getCommonRadius(node);
    if (node.type === "ELLIPSE") {
      return [formatWithJSX("border-radius", isJsx, 9999)];
    }
    let comp = [];
    let cornerValues = [0, 0, 0, 0];
    let singleCorner = 0;
    if ("all" in radius) {
      if (radius.all === 0) {
        return [];
      }
      singleCorner = radius.all;
      comp.push(formatWithJSX("border-radius", isJsx, radius.all));
    } else if ("topLeftRadius" in node) {
      cornerValues = handleIndividualRadius(node);
      comp.push(
        ...cornerValues.filter((d) => d > 0).map((value, index) => {
          const property = [
            "border-top-left-radius",
            "border-top-right-radius",
            "border-bottom-right-radius",
            "border-bottom-left-radius"
          ][index];
          return formatWithJSX(property, isJsx, value);
        })
      );
    }
    if ("children" in node && "clipsContent" in node && node.children.length > 0 && node.clipsContent === true) {
      comp.push(formatWithJSX("overflow", isJsx, "hidden"));
    }
    return comp;
  };
  var handleIndividualRadius = (node) => {
    const cornerValues = [
      node.topLeftRadius,
      node.topRightRadius,
      node.bottomRightRadius,
      node.bottomLeftRadius
    ];
    return cornerValues;
  };

  // src/worker/backend/style/htmlDefaultBuilder.ts
  var HtmlDefaultBuilder = class {
    constructor(node, showLayerName, optIsJSX) {
      __publicField(this, "styles");
      __publicField(this, "isJSX");
      __publicField(this, "visible");
      __publicField(this, "name", "");
      __publicField(this, "addStyles", (...newStyles) => {
        this.styles.push(...newStyles.filter((style) => style));
      });
      this.isJSX = optIsJSX;
      this.styles = [];
      this.visible = node.visible;
      if (showLayerName) {
        this.name = className(node.name);
      }
    }
    commonPositionStyles(node, optimizeLayout) {
      this.size(node, optimizeLayout);
      this.autoLayoutPadding(node, optimizeLayout);
      this.position(node, optimizeLayout);
      this.blend(node);
      return this;
    }
    commonShapeStyles(node) {
      this.applyFillsToStyle(
        node.fills,
        node.type === "TEXT" ? "text" : "background"
      );
      this.shadow(node);
      this.border(node);
      this.blur(node);
      return this;
    }
    blend(node) {
      this.addStyles(
        htmlVisibility(node, this.isJSX),
        ...htmlRotation(node, this.isJSX),
        htmlOpacity(node, this.isJSX),
        htmlBlendMode(node, this.isJSX)
      );
      return this;
    }
    border(node) {
      this.addStyles(...htmlBorderRadius(node, this.isJSX));
      const commonBorder = commonStroke(node);
      if (!commonBorder) {
        return this;
      }
      const color = htmlColorFromFills(node.strokes);
      const borderStyle = node.dashPattern.length > 0 ? "dotted" : "solid";
      const consolidateBorders = (border) => [`${sliceNum(border)}px`, color, borderStyle].filter((d) => d).join(" ");
      if ("all" in commonBorder) {
        if (commonBorder.all === 0) {
          return this;
        }
        const weight = commonBorder.all;
        this.addStyles(
          formatWithJSX("border", this.isJSX, consolidateBorders(weight))
        );
      } else {
        if (commonBorder.left !== 0) {
          this.addStyles(
            formatWithJSX(
              "border-left",
              this.isJSX,
              consolidateBorders(commonBorder.left)
            )
          );
        }
        if (commonBorder.top !== 0) {
          this.addStyles(
            formatWithJSX(
              "border-top",
              this.isJSX,
              consolidateBorders(commonBorder.top)
            )
          );
        }
        if (commonBorder.right !== 0) {
          this.addStyles(
            formatWithJSX(
              "border-right",
              this.isJSX,
              consolidateBorders(commonBorder.right)
            )
          );
        }
        if (commonBorder.bottom !== 0) {
          this.addStyles(
            formatWithJSX(
              "border-bottom",
              this.isJSX,
              consolidateBorders(commonBorder.bottom)
            )
          );
        }
      }
      return this;
    }
    position(node, optimizeLayout) {
      var _a, _b;
      if (commonIsAbsolutePosition(node, optimizeLayout)) {
        const { x, y } = getCommonPositionValue(node);
        this.addStyles(
          formatWithJSX("left", this.isJSX, x),
          formatWithJSX("top", this.isJSX, y),
          formatWithJSX("position", this.isJSX, "absolute")
        );
      } else {
        if (node.type === "GROUP" || "layoutMode" in node && ((_b = (_a = optimizeLayout ? node.inferredAutoLayout : null) != null ? _a : node) == null ? void 0 : _b.layoutMode) === "NONE") {
          this.addStyles(formatWithJSX("position", this.isJSX, "relative"));
        }
      }
      return this;
    }
    applyFillsToStyle(paintArray, property) {
      if (property === "text") {
        this.addStyles(
          formatWithJSX("text", this.isJSX, htmlColorFromFills(paintArray))
        );
        return this;
      }
      const backgroundValues = this.buildBackgroundValues(paintArray);
      if (backgroundValues) {
        this.addStyles(formatWithJSX("background", this.isJSX, backgroundValues));
      }
      return this;
    }
    buildBackgroundValues(paintArray) {
      if (paintArray === figma.mixed) {
        return "";
      }
      if (paintArray.length === 1 && paintArray[0].type === "SOLID") {
        return htmlColorFromFills(paintArray);
      }
      const styles = paintArray.map((paint) => {
        if (paint.type === "SOLID") {
          const color = htmlColorFromFills([paint]);
          return `linear-gradient(0deg, ${color} 0%, ${color} 100%)`;
        } else if (paint.type === "GRADIENT_LINEAR" || paint.type === "GRADIENT_RADIAL" || paint.type === "GRADIENT_ANGULAR") {
          return htmlGradientFromFills([paint]);
        }
        return "";
      });
      return styles.filter((value) => value !== "").join(", ");
    }
    shadow(node) {
      if ("effects" in node) {
        const shadow = htmlShadow(node);
        if (shadow) {
          this.addStyles(
            formatWithJSX("box-shadow", this.isJSX, htmlShadow(node))
          );
        }
      }
      return this;
    }
    size(node, optimize) {
      const { width, height } = htmlSizePartial(node, this.isJSX, optimize);
      if (node.type === "TEXT") {
        switch (node.textAutoResize) {
          case "WIDTH_AND_HEIGHT":
            break;
          case "HEIGHT":
            this.addStyles(width);
            break;
          case "NONE":
          case "TRUNCATE":
            this.addStyles(width, height);
            break;
        }
      } else {
        this.addStyles(width, height);
      }
      return this;
    }
    autoLayoutPadding(node, optimizeLayout) {
      var _a;
      if ("paddingLeft" in node) {
        this.addStyles(
          ...htmlPadding(
            (_a = optimizeLayout ? node.inferredAutoLayout : null) != null ? _a : node,
            this.isJSX
          )
        );
      }
      return this;
    }
    blur(node) {
      if ("effects" in node && node.effects.length > 0) {
        const blur = node.effects.find(
          (e) => e.type === "LAYER_BLUR" && e.visible
        );
        if (blur) {
          this.addStyles(
            formatWithJSX(
              "filter",
              this.isJSX,
              `blur(${sliceNum(blur.radius)}px)`
            )
          );
        }
        const backgroundBlur = node.effects.find(
          (e) => e.type === "BACKGROUND_BLUR" && e.visible
        );
        if (backgroundBlur) {
          this.addStyles(
            formatWithJSX(
              "backdrop-filter",
              this.isJSX,
              `blur(${sliceNum(backgroundBlur.radius)}px)`
            )
          );
        }
      }
    }
    build(additionalStyle = []) {
      this.addStyles(...additionalStyle);
      const formattedStyles = this.styles.map((s) => s.trim());
      let formattedStyle = "";
      if (this.styles.length > 0) {
        if (this.isJSX) {
          formattedStyle = ` style={{${formattedStyles.join(", ")}}}`;
        } else {
          formattedStyle = ` style="${formattedStyles.join("; ")}"`;
        }
      }
      if (this.name.length > 0) {
        const classOrClassName = this.isJSX ? "className" : "class";
        return ` ${classOrClassName}="${this.name}"${formattedStyle}`;
      } else {
        return formattedStyle;
      }
    }
  };

  // src/worker/backend/style/htmlTextBuilder.ts
  var HtmlTextBuilder = class extends HtmlDefaultBuilder {
    constructor(node, showLayerName, optIsJSX) {
      super(node, showLayerName, optIsJSX);
    }
    getTextSegments(id) {
      const segments = globalTextStyleSegments[id];
      if (!segments) {
        return [];
      }
      return segments.map((segment) => {
        const styleAttributes = formatMultipleJSX(
          {
            color: htmlColorFromFills(segment.fills),
            "font-size": segment.fontSize,
            "font-family": segment.fontName.family,
            "font-style": this.getFontStyle(segment.fontName.style),
            "font-weight": `${segment.fontWeight}`,
            "text-decoration": this.textDecoration(segment.textDecoration),
            "text-transform": this.textTransform(segment.textCase),
            "line-height": this.lineHeight(segment.lineHeight, segment.fontSize),
            "letter-spacing": this.letterSpacing(
              segment.letterSpacing,
              segment.fontSize
            ),
            // "text-indent": segment.indentation,
            "word-wrap": "break-word"
          },
          this.isJSX
        );
        const charsWithLineBreak = segment.characters.split("\n").join("<br/>");
        return { style: styleAttributes, text: charsWithLineBreak };
      });
    }
    fontSize(node, isUI = false) {
      if (node.fontSize !== figma.mixed) {
        const value = isUI ? Math.min(node.fontSize, 24) : node.fontSize;
        this.addStyles(formatWithJSX("font-size", this.isJSX, value));
      }
      return this;
    }
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
    letterSpacing(letterSpacing, fontSize) {
      const letterSpacingProp = commonLetterSpacing(letterSpacing, fontSize);
      if (letterSpacingProp > 0) {
        return letterSpacingProp;
      }
      return null;
    }
    lineHeight(lineHeight, fontSize) {
      const lineHeightProp = commonLineHeight(lineHeight, fontSize);
      if (lineHeightProp > 0) {
        return lineHeightProp;
      }
      return null;
    }
    /**
     * https://tailwindcss.com/docs/font-style/
     * example: font-extrabold
     * example: italic
     */
    getFontStyle(style) {
      if (style.toLowerCase().match("italic")) {
        return "italic";
      }
      return "";
    }
    textAlign(node) {
      if (node.textAlignHorizontal && node.textAlignHorizontal !== "LEFT") {
        let textAlign = "";
        switch (node.textAlignHorizontal) {
          case "CENTER":
            textAlign = "center";
            break;
          case "RIGHT":
            textAlign = "right";
            break;
          case "JUSTIFIED":
            textAlign = "justify";
            break;
        }
        this.addStyles(formatWithJSX("text-align", this.isJSX, textAlign));
      }
      return this;
    }
  };

  // src/worker/backend/style/styleMain.ts
  var styleMain = (sceneNode) => {
    const n = sceneNode[0];
    const visibleSceneNode = sceneNode.filter((d) => d.visible);
    const node = visibleSceneNode[0];
    let builder;
    let style = "";
    switch (node.type) {
      case "TEXT":
        builder = new HtmlTextBuilder(node, false, false).commonPositionStyles(node, true).textAlign(node);
        const styledHtml = builder.getTextSegments(node.id);
        for (let i of styledHtml) {
          if (i.text && i.text != " ") {
            const arr = i.style.split("; ");
            let css = arr.join(";\n  ");
            style += `${i.text} {
  ${css}
}
`;
          }
        }
        break;
      case "GROUP":
        builder = new HtmlDefaultBuilder(node, false, false).commonPositionStyles(node, true);
        style = builder.styles.join(";\n");
        break;
      default:
        builder = new HtmlDefaultBuilder(node, false, false).commonPositionStyles(node, true).commonShapeStyles(node);
        style = builder.styles.join(";\n");
        break;
    }
    if (node.type == "TEXT") {
    } else {
    }
    return style;
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
    let result = "";
    switch (settings.mode) {
      case "tailwind":
        let array = pacvueMain(convertedSelection, settings);
        result = tailwindMain(array, settings);
        break;
      case "style":
        result = styleMain(convertedSelection);
        break;
      default:
        break;
    }
    figma.ui.postMessage({
      type: "code",
      data: result,
      settings,
      htmlPreview: null,
      preferences: settings
    });
  };
  var codegenRun = (selection, settings) => {
    const convertedSelection = convertIntoNodes(selection, null);
    let result = styleMain(convertedSelection);
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
    roundTailwind: false,
    mode: "tailwind"
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
      console.error(e.message + "\n" + e.stack);
      if (e && typeof e === "object" && "message" in e) {
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
      if (msg.mode == "tailwind") {
      } else if (msg.mode == "style") {
      }
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
