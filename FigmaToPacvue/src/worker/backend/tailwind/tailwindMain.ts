
import { retrieveTopFill } from "../common/retrieveFill";
import { indentString } from "../common/indentString";
import { PluginSettings } from "../code";
import { commonSortChildrenWhenInferredAutoLayout } from "../common/commonChildrenOrder";
import { tailwindAutoLayoutProps } from "./builderImpl/tailwindAutoLayout";
import { TailwindDefaultBuilder } from "./tailwindDefaultBuilder";
import { TailwindTextBuilder } from "./tailwindTextBuilder";

export let localTailwindSettings: PluginSettings;

let previousExecutionCache: { style: string; text: string }[];
const selfClosingTags = ["img"];

export const tailwindMain = (
  sceneNode: Array<SceneNode>,
  settings: PluginSettings
): string => {
  // 设置本地 Tailwind 设置和执行缓存
  localTailwindSettings = settings;
  previousExecutionCache = [];

  // 生成 Tailwind 控件
  let result = tailwindWidgetGenerator(sceneNode, localTailwindSettings.jsx);

  // 移除容器中生成的初始换行符
  if (result.length > 0 && result.startsWith("\n")) {
    result = result.slice(1, result.length);
  }
  return result;
};
const tailwindWidgetGenerator = (sceneNode: ReadonlyArray<SceneNode>, isJsx: boolean): string => {
  let comp = "";
  // 过滤非可见图层
  const visibleSceneNode = sceneNode.filter((d) => d.visible);
  visibleSceneNode.forEach((node) => {
    const node1 = node as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
    const childrNode = commonSortChildrenWhenInferredAutoLayout(
      node1,
      localTailwindSettings.optimizeLayout
    )
    // 过滤非可见子图层
    const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
    /* 判断当前图层是否与子图层一致 */
    if(visibleChildNode.length == 1){
      let nodeStr = JSON.stringify(node)
      let nodeArr = nodeStr.split(node.name)
      let childNodeStr = JSON.stringify(visibleChildNode[0])
      let childNodeArr = childNodeStr.split(visibleChildNode[0].name)
      /* 如果一致 则跳过当前图层 */ /* 如果当前图层只有一个子级 并且子级是输入框 跳过当前图层 */
      if(nodeArr[1] == childNodeArr[1] || visibleChildNode[0].name.includes('特殊输入框')){
        comp += tailwindWidgetGenerator(visibleChildNode, isJsx)
        return
      }
    }
    switch (node.type) {
      case "RECTANGLE":
      case "ELLIPSE":
        comp += tailwindContainer(node, "", "", isJsx);
        break;
      case "GROUP":
        comp += tailwindGroup(node, isJsx);
        break;
      case "INSTANCE":
      case "FRAME":
      case "COMPONENT":
      case "COMPONENT_SET":
        // 根据节点名称生成不同类型的组件
        comp += tailwindFrame(node, isJsx);
        break;
      case "TEXT":
        comp += tailwindText(node, isJsx);
        break;
      case "LINE":
        comp += tailwindLine(node, isJsx);
        break;
      case "SECTION":
        comp += tailwindSection(node, isJsx);
        break;
      case "VECTOR":
        break;
    }
  });
  return comp;
};
const tailwindFrame = (
  node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode,
  isJsx: boolean
): string => {
  const width = node.width ? `width='${node.width}px'` : ''
  if(node.name.includes('特殊输入框') || node.name.includes('文本域')){
    return pacvueInput(node)
  }
  if(node.name.includes('widget-arrow')){
    return pacvueIcon(node)
  }
  if(node.name.includes('tab')){
    return pacvueTab(node, isJsx)
  }
  if(node.name == '搜索框'){
    return `\n<pacvue-input ${width}>\n  <template #prefix>\n    <el-icon><PacvueIconSearch /></el-icon>\n  </template>\n</pacvue-input>`
  }
  if(node.name=='开关'){
    return '\n<pacvue-switch />'
  }
  if(node.name=='日期筛选'){
    return '\n<PacvueDatePicker type="daterange" />'
  }
  if(node.name.includes('主要按钮') || node.name.includes('灰色按钮')  || node.name.includes('次级按钮') || node.name.toLocaleLowerCase().includes('button') ){
    return pacvueButton(node, isJsx)
  }
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  if(node.name == '单选框+文字'){
    return tailwindWidgetGenerator(childrNode, isJsx);
  }
  const visibleChildNode = childrNode.filter((e) => e.visible);
  const visibleChildNode0 = visibleChildNode[0] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
  if(visibleChildNode.length == 1 && visibleChildNode[0].name == 'Input'){
    return pacvueInput( visibleChildNode0)
  }
  if(visibleChildNode.length == 2){
    if(visibleChildNode[1].name == 'top bar-arrow-down'){
      const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode0, localTailwindSettings.optimizeLayout )
      const visibleGrandChildNode = grandChildrNode.filter((e) => e.visible);
      if(visibleGrandChildNode.length > 1 && visibleGrandChildNode[0].name == 'Vendor' && visibleGrandChildNode[1].name == 'Rectangle 539'){
        const grandChildrNodeText = grandChildrNode[0] as TextNode
        let text = grandChildrNodeText.characters
        return  `\n<pacvue-select ${width} :labelInner="'${text}'" />`
      }
    }
  }
  if(visibleChildNode.length >= 2){
    const visibleChildNodelast = visibleChildNode[visibleChildNode.length - 1] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
    if(visibleChildNode[0].name == '单选框'){
      return pacvueRadio(node, isJsx)
    }else if(visibleChildNode[0].name == '多选框'){
      return pacvueCheckBox(node, isJsx)
    }else if(isIcon(visibleChildNodelast)){
      if(getIconName(visibleChildNodelast) == 'Rectangle 1138'){
        return '\n<PacvueDatePicker type="daterange" />'
      }
    }
  }
  if (node.name == '选择器'){
    if(visibleChildNode.length  == 1){
      return pacvueInput(node)
    }else{
      return pacvueSelect(node)
    }
  }else if(node.name == '选择器-带标题' && visibleChildNode.length == 2){
    const visibleChildNode0 = visibleChildNode[0] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
    console.log(visibleChildNode0)
    const visibleChildNode0child = commonSortChildrenWhenInferredAutoLayout(visibleChildNode0, localTailwindSettings.optimizeLayout)
    let comp = ""
    if(visibleChildNode0child.length > 0){
      const nodeText = visibleChildNode0child[0] as TextNode
      comp = tailwindText(nodeText, isJsx)
    }
    const pacvueNode = visibleChildNode[1] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
    comp += pacvueSelect(pacvueNode)
    return tailwindContainer(node, comp, "", isJsx);
  }
  if(isIcon(node)){
    return pacvueIcon(node)
  }
  const childrenStr = tailwindWidgetGenerator(childrNode, isJsx );
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
const tailwindGroup = (node: GroupNode, isJsx: boolean = false): string => {
  // 忽略尺寸为零或更小的视图
  // 虽然在技术上不应该小于0，由于四舍五入的原因，
  // 它可能变为类似于：-0.000004196293048153166 的值
  // 如果内部没有子元素，也忽略，因为这是没有意义的
  if (node.width < 0 || node.height <= 0 || node.children.length === 0) {
    return "";
  }
  // 在调用CustomNode之后，需要调用这个，因为widthHeight依赖于它
  const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).blend(node).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout);
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible && ['RECTANGLE', 'VECTOR'].includes(e.type));
  if(visibleChildNode.length > 1){
    visibleChildNode.forEach(e=>{
      builder.border(e)
    })
  }
  if (builder.attributes || builder.style) {
    const attr = builder.build("");

    const generator = tailwindWidgetGenerator(node.children, isJsx);
    return `\n<div${attr}>${indentString(generator)}\n</div>`;
  }

  return tailwindWidgetGenerator(node.children, isJsx);
};

export const tailwindText = (node: TextNode, isJsx: boolean): string => {
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
  return `\n<div${layoutBuilder.build()}>${content}</div>`;
};
export const tailwindContainer = (node: SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin, children: string, additionalAttr: string, isJsx: boolean): string => {
  // 在尺寸为零或更小的情况下忽略视图
  // 虽然在技术上它不应该小于0，但由于舍入误差，
  // 它可能变为类似于：-0.000004196293048153166 的值
  if (node.width < 0 || node.height < 0) {
    return children;
  }

  let builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).commonShapeStyles(node);
  const asnode = node as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
  const childrNode = commonSortChildrenWhenInferredAutoLayout(asnode,localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible && ['RECTANGLE', 'VECTOR'].includes(e.type));
  if(visibleChildNode.length == 1){
    builder.border(visibleChildNode[0])
  }
  if (builder.attributes || additionalAttr) {
    const build = builder.build(additionalAttr);
    // image fill and no children -- let's emit an <img />
    let tag = "div";
    let src = "";
    if (retrieveTopFill(node.fills)?.type === "IMAGE") {
      if (!("children" in node) || node.children.length === 0) {tag = "img";src = ` src="https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)}"`;
      } else {
        builder.addAttributes(`bg-[url(https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)})]`);
      }
    }
    if (children) {
      return `\n<${tag}${build}${src}>${indentString(children)}\n</${tag}>`;
    } else if (selfClosingTags.includes(tag) || isJsx) {
      return `\n<${tag}${build}${src} />`;
    } else {
      return `\n<${tag}${build}${src}></${tag}>`;
    }
  }
  return children;
};
export const tailwindLine = (node: LineNode, isJsx: boolean): string => {
  const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).commonShapeStyles(node);
  return `\n<div${builder.build()}></div>`;
};
export const tailwindSection = (node: SectionNode, isJsx: boolean): string => {
  const childrenStr = tailwindWidgetGenerator(node.children, isJsx);
  const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout).customColor(node.fills, "bg");
  if (childrenStr) {
    return `\n<div${builder.build()}>${indentString(childrenStr)}\n</div>`;
  } else {
    return `\n<div${builder.build()}></div>`;
  }
};

/* Pacvue相关 */
const pacvueButton =  (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode, isJsx: boolean): string => {
  let type = ' type="primary"'
  if(node.name.includes('灰色按钮')){
    type = ''
  }
  if(node.name.includes('次级按钮')){
    type = ' type="primary" plain'
  }
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  let index = 0
  let text = ''
  let icon = ''
  let width = node.width ? `width='${node.width}px'` : ''
  if(visibleChildNode.length == 1 && visibleChildNode[0].type != 'TEXT'){
    return tailwindWidgetGenerator(childrNode, isJsx);
  }
  for(let e of visibleChildNode){
    index ++
    if(e.type == 'TEXT'){
      text = e.characters
      break
    }
  }
  if(visibleChildNode.length > 1){
    if(index > 1){
      icon = `\n<el-icon :size="20" style="margin-right: 8px">\n  <PacvueIconAdd></PacvueIconAdd>\n</el-icon>`
    }
    if(index < visibleChildNode.length){
      return `\n<pacvue-dropdown>\n  <template #reference>\n    <pacvue-button type="primary" plain>\n      ${icon}${text}\n      <el-icon :size="20" style="margin-left: 8px">\n        <PacvueIconTopBarArrowDown></PacvueIconTopBarArrowDown>\n      </el-icon>\n    </pacvue-button>\n  </template>\n</pacvue-dropdown>`
    }
  }
  return `\n<pacvue-button${type} ${width}>${icon}${text}</pacvue-button>`
}
const pacvueCheckBox = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode, isJsx: boolean ): string => {
  let text = findSpecifiedChiuldren(commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout), isJsx)
  return `\n<pacvue-checkbox>${text}</pacvue-checkbox>`
}
const pacvueRadio = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode, isJsx: boolean ): string => {
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  let text = findSpecifiedChiuldren(childrNode, isJsx)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  const visibleChildNode1 = visibleChildNode[1] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
  const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode1, localTailwindSettings.optimizeLayout)
  let tootip = ""
  grandChildrNode.forEach(e=>{
    if(e.name == 'tips-exclamation'){
      tootip = `\n<pacvue-tooltip placement="top" effect="dark">\n  <template #content>\n    <div><!-- Tooltip文案 --></div>\n  </template>\n  <el-icon :size="${e.width}" color="#66666c" class="ml-1"><PacvueIconTipsExclamation /></el-icon>\n</pacvue-tooltip>\n`
    }
  })
  return `\n<pacvue-radio>\n  <div class="flex items-center">${text}${tootip}\n  </div>\n</pacvue-radio>`
}
const pacvueInput = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode): string => {
  let width = node.width ? `width='${node.width}px'` : ''
  let textarea = ''
  if(node.name == '文本域'){
    let rows = node.height ? ` :rows="${((node.height-10) / 21).toFixed(0)}"` : ''
    textarea = 'type="textarea"' + rows
  }
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  let endTag = '/>'
  if(visibleChildNode.length == 2){
    let symbol = ""
    visibleChildNode.forEach((n) => {
      const childN = n as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
      const a = commonSortChildrenWhenInferredAutoLayout(childN, localTailwindSettings.optimizeLayout )
      const b = a.filter((e) => e.visible);
      b.forEach(e=>{
        if(e.type == 'TEXT'){
          const c = e as TextNode
          if(['$', '%'].includes(c.characters)){
            symbol = c.characters
          }
        }
      })
    })
    if(symbol == '%'){
      endTag = `>\n  <template #suffix>\n    <span>${symbol}</span>\n  </template>\n</pacvue-input>`
    }else{
      endTag = `>\n  <template #prefix>\n    <span>${symbol}</span>\n  </template>\n</pacvue-input>`
    }
  }
  return `\n<pacvue-input ${width} ${textarea}${endTag}`;
};
const pacvueSelect = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode): string => {
  let width = node.width ? `width='${node.width}px'` : ''
  return `\n<pacvue-select ${width}/>`;
};

const pacvueIcon = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode): string => {
  let iconName = 'PacvueIconAmazon'
  if(node.name == 'widget-arrow-down'){
    iconName = 'PacvueIconWidgetArrowDown1'
  }
  if(node.name == 'widget-arrow-up'){
    iconName = 'PacvueIconWidgetArrowUp1'
  }
  if(node.name == 'tips-exclamation'){
    iconName = 'PacvueIconTipsExclamation'
    return `\n<pacvue-tooltip placement="top" effect="dark">\n  <template #content>\n    <div><!-- Tooltip文案 --></div>\n  </template>\n  <el-icon :size="${node.width}" color="#66666c" class="ml-1"><PacvueIconTipsExclamation /></el-icon>\n</pacvue-tooltip>`
  }
  return `\n<el-icon :size="${node.width}">\n  <${iconName} />\n</el-icon>`;
}
const pacvueTab = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode,
  isJsx: boolean):string => {
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  let comp = ""
  visibleChildNode.forEach((n) => {
    const textNode = n as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
    let text = findSpecifiedChiuldren(commonSortChildrenWhenInferredAutoLayout(textNode, localTailwindSettings.optimizeLayout), isJsx)
    if(node.name.includes('水平方向')){
      comp += `\n  <el-tab-pane label="${text}"></el-tab-pane>`
    }else{
      comp += `\n  <pacvue-radio-button >${text}</pacvue-radio-button>`
    }
  })
  if(node.name.includes('水平方向')){
    return `\n<PacvueTab tab-position="top">${comp}\n</PacvueTab>`
  }else{
    return `\n<pacvue-radio-group>${comp}\n</pacvue-radio-group>`
  }
}
const findSpecifiedChiuldren = ( sceneNode: ReadonlyArray<SceneNode>, isJsx: boolean ): string => {
  let comp = "";
  // 过滤非可见图层
  const visibleSceneNode = sceneNode.filter((d) => d.visible);
  visibleSceneNode.forEach((node) => {
    if(node.type == 'TEXT'){
      comp += node.characters
    }else{
      const asnode = node as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
      comp += findSpecifiedChiuldren(commonSortChildrenWhenInferredAutoLayout(asnode, localTailwindSettings.optimizeLayout), isJsx)
    }
  });
  return comp;
};
const isIcon = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode):Boolean => {
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  if(node.type == 'INSTANCE' && visibleChildNode.length == 1 && visibleChildNode[0].type == "GROUP"){
    const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode[0], localTailwindSettings.optimizeLayout)
    let index = 0
    grandChildrNode.forEach(e=>{
      if(e.name == 'Union'){
        index++
      }
    })
    return index == 1
  }
  return false
}
const getIconName = (node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode):string => {
  let iconName = ''
  const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
  const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible);
  const visibleChildNode0 = visibleChildNode[0] as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
  const grandChildrNode = commonSortChildrenWhenInferredAutoLayout(visibleChildNode0, localTailwindSettings.optimizeLayout)
  grandChildrNode.forEach(e=>{
    if(e.type == 'RECTANGLE' && e.name != 'Union'){
      iconName = e.name
    }
  })
  return iconName
}