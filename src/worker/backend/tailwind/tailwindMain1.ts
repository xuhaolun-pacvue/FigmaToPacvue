
import { PluginSettings } from "../code";
import { TailwindDefaultBuilder } from "./tailwindDefaultBuilder";
import { TailwindTextBuilder } from "./tailwindTextBuilder";
import { svgIcon } from "./PacvueIcon";
import { tailwindAutoLayoutProps } from "./builderImpl/tailwindAutoLayout";
type NodeObj = {
  type: string;
  name: string;
  node: SceneNode;
  width: number;
  height: number;
  html: string;
  style: string[];
  children: any[];
};
export let localTailwindSettings: PluginSettings;
export const tailwindMain1 = (sceneNode: Array<SceneNode>, settings: PluginSettings) => {
  localTailwindSettings = settings;
  let result = tailwindWidgetGenerator(sceneNode);
  return result;
};

const tailwindWidgetGenerator = (sceneNode: Array<SceneNode>) => {
  let array: any[] = []
  const visibleSceneNode = sceneNode.filter((d) => d.visible);
  visibleSceneNode.forEach((node) => {
    array.push(tailwindContainer(node))
  });
  return array
}
const tailwindContainer = (node: SceneNode ): NodeObj =>{
  const nodeStyle = node as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
  var styleClass = getStyle(nodeStyle)
  let ParentObj: NodeObj = {
    type: node.type,
    name: node.name,
    node: node,
    width: node.width,
    height: node.height,
    style: styleClass,
    html: '',
    children: []
  }
  const n = node as SceneNode & ChildrenMixin
  if(n.children){
    const visibleChildNode = n.children.filter((d) => d.visible);
    var childrenList: any[] = []
    visibleChildNode.forEach(e=>{
      childrenList.push(tailwindContainer(e))
    })
    let height = node.height
    childrenList.forEach(e=>{
      if(e.height > height){
        height = e.height
      }
    })
    ParentObj.height = height

    if (childrenList.some(e=> ['多选框', 'Checkbox'].includes(e.name))){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueCheckbox';
    } else if (childrenList.some(e=> ['单选框', 'Radio'].includes(e.name))){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueRadio';
    } 

    if(childrenList.length > 1 && childrenList.filter(e=>e.name == 'PacvueRadio').length == childrenList.length){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueRadioGroup';
      ParentObj.children = childrenList
    } else if (node.height < 40 && node.height > 30 && (styleClass.includes('rounded-md') || styleClass.includes('rounded')) && styleClass.includes("border") && styleClass.includes('border-[var(--icon-disabled--)]')){
      /* 通过样式判断是否是选框 */
      if(node.height != node.width){
        const newClass = styleClass.filter(e=>e != 'rounded-md' && e != 'rounded' && e != 'border' && e != 'border-[var(--icon-disabled--)]' && e != 'h-9' && e != 'h-8' && !e.includes('px') && !e.includes('py'))
        const arrowNum = searchByName(visibleChildNode, 0, 'top bar-arrow-down')
        const dateNum = searchByName(visibleChildNode, 0, 'Rectangle 1138')
        var textLength = searchByType(visibleChildNode, 0, 'TEXT')
        var textArr: string[] = []
        if(textLength > 0){
          textArr = getChildrenAllText(visibleChildNode, textArr)
        }
        let name: string;
        if (dateNum > 0) {
          name = 'PacvueDatePicker';
          textArr.forEach((e) => {
            if(e == '~' || e.includes('~')){
              name += '-daterange'
            }
          })
        } else if (arrowNum == 0) {
          name = 'PacvueInput';
          textArr.forEach((e) => {
            if (e.length == 1) {
              name += '-' + e;
            }
          });
        } else {
          name = 'PacvueSelect';
          const num =  searchByName(visibleChildNode, 0, 'Rectangle 539')
          if(num == 1){
            name += '-' + textArr[0]
          } 
        }
        ParentObj.type = 'PACVUE';
        ParentObj.name = name;
        ParentObj.style = newClass;
      }else{
        ParentObj.type = 'PACVUE';
        let icon = '-';
        const iconList = visibleChildNode.filter(e => {
          return e.width == e.height && e.type != 'TEXT';
        });
        if (iconList.length == 1) {
          const a: string = iconList[0].name;
          icon += (svgIcon as { [key: string]: string })[a.trim()];
        }
        ParentObj.name = `PacvueButton-${icon}`;
      }
    } else if ((node.height == node.width && node.height == 18) || node.name == '多选框'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'Checkbox';

    } else if ((node.height == node.width && node.height == 20 && styleClass.includes("border")) || node.name == '单选框'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'Radio';
    } else if (childrenList.some(e=>['top bar-arrow-down','PacvueIcon-PacvueIconTopBarArrowDown'].includes(e.name))){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueDropdown';
      ParentObj.children = childrenList
    } else if (node.name == '开关'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueSwitch';
    } else if (node.name == '文本域'){
      if (childrenList.some(e=>['文本域','PacvueInput-Textarea'].includes(e.name))){
        ParentObj.type = 'PACVUE';
        ParentObj.name = 'PacvueInput-Textarea';
      } else {
        ParentObj.children = childrenList;
      }
    } else if (node.name == '搜索框'){
      let slot = '-prefix'
      if(childrenList.length == 1 && childrenList[0].name == 'Search在后'){
        slot = '-append'
      }
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueInput-Search' + slot;
    } else if (childrenList.length == 1 && childrenList[0].name == 'Input' && node.height >= 40){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueInput-Textarea';
    } else if (node.name.includes('tab')) {
      ParentObj.type = 'PACVUE';
      let html = ''
      childrenList.forEach(e=>{
        const text = getChildrenAllText([e.node], []).join(' ')
        if(childrenList.some(e=>{
          return e.style.includes('border')
        })){
          ParentObj.name = `PacvueButtonTab`;
          html += `\n<pacvue-radio-button >${ text }</pacvue-radio-button>`
        }else{
          ParentObj.name = `PacvueTab`;
          html += `\n<el-tab-pane label="${ text }"></el-tab-pane>`
        }
      })
      ParentObj.html = html
    } else if ((node.name.includes('主要按钮') || node.name.includes('次级按钮')) || ((node.height == 36 || node.height == 32) && styleClass.includes("border") &&styleClass.includes("border-[var(--el-color-primary)]"))) {
      ParentObj.type = 'PACVUE';
      let icon = '-';
      const iconList = visibleChildNode.filter(e => {
        return e.width == e.height && e.type != 'TEXT';
      });
      if (iconList.length == 1) {
        const a: string = iconList[0].name;
        icon += (svgIcon as { [key: string]: string })[a.trim()];
      }
      var textLength = searchByType(visibleChildNode, 0, 'TEXT')
      var textArr: string[] = []
      if(textLength > 0){
        textArr = getChildrenAllText(visibleChildNode, textArr)
      }
      if(textArr.length > 0){
        ParentObj.html = textArr.join(' ')
      }
      var type = 'primaryplain'
      if(styleClass.includes("bg-[var(--el-color-primary)]") || node.name.includes('主要按钮')){
        type = 'primary'
      }
      ParentObj.name = `PacvueButton-${type}${icon}`;
    } else if (node.name.includes('灰色按钮') || node.name.toLocaleLowerCase().includes('button')) {
      ParentObj.type = 'PACVUE';
      let name = 'PacvueButton'
      let type = 'primary'
      if(node.name.includes('灰色按钮')){
        type = ''
      }
      if(node.name.includes('次级按钮')){
        type = 'plain'
      }
      ParentObj.name = `${name}-${type}`;
    } else if (node.width == node.height && node.width < 26 && (node.type == 'INSTANCE' || childrenList.some(e=>e.name == 'Union'))){
      ParentObj.type = 'PACVUE';
      const a: string = node.name;
      let icon = (svgIcon as { [key: string]: string })[a.trim()];
      ParentObj.name = `PacvueIcon-${icon}`;
    }

    const pacvueChildren = childrenList.filter(e=>e.type == 'PACVUE')
    if(childrenList.length == 1 && (pacvueChildren.length == 1 || !styleClass.some(e=>{ return e.includes('bg-') || e.includes('border-') || e.includes('grow') }))){
      return childrenList[0]
    }else{
      ParentObj.children = childrenList
    }
  }
  return ParentObj
}
const uniqueArray = (array: string[]): string[] => {
  let arr1: string[] = [];
  array.forEach((value) => {
    if (!arr1.includes(value) && value && value != " ") {
      arr1.push(value);
    }
  });
  return arr1
}
const searchByName = (nodeList: SceneNode[], num: number, searchName: string): number=>{
  /* 判断子级有多少个符合的Name */
  nodeList.forEach(e=>{
    const n = e as SceneNode & ChildrenMixin
    if(n.children){
      const visibleChildNode = n.children.filter((d) => d.visible);
      num = searchByName(visibleChildNode, num, searchName)
    }
    if(e.name == searchName){
      num++
    }
  })
  return num
}
const getNodeByType = (nodeList: SceneNode[], ary: any[], searchName: string): any[]=>{
  /* 判断子级有多少个符合的Name */
  nodeList.forEach(e=>{
    const n = e as SceneNode & ChildrenMixin
    if(n.children){
      const visibleChildNode = n.children.filter((d) => d.visible);
      ary = getNodeByType(visibleChildNode, ary, searchName)
    }
    if(e.type == searchName){
      ary.push(e)
    }
  })
  return ary
}
const searchByType = (nodeList: SceneNode[], num: number, searchName: string): number=>{
  /* 判断子级有多少个符合的Type */
  nodeList.forEach(e=>{
    const n = e as SceneNode & ChildrenMixin
    if(n.children){
      const visibleChildNode = n.children.filter((d) => d.visible);
      num = searchByType(visibleChildNode, num, searchName)
    }
    if(e.type == searchName){
      num++
    }
  })
  return num
}
const getChildrenAllText = (nodeList: SceneNode[], arr: string[]): string[]=>{
  /* 获取子级所有的文本 */
  nodeList.forEach(e=>{
    const n = e as SceneNode & ChildrenMixin
    if(n.children){
      const visibleChildNode = n.children.filter((d) => d.visible);
      arr = getChildrenAllText(visibleChildNode, arr)
    }
    if(e.type == 'TEXT'){
      const node = e as TextNode
      arr.push(node.characters)
    }
  })
  return arr
}
const getStyle = (node: SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin): string[] =>{
  var builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false)
  .commonPositionStyles(node, localTailwindSettings.optimizeLayout)
  .commonShapeStyles(node);
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
      builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false)
        .blend(node)
        .size(node, localTailwindSettings.optimizeLayout)
        .position(node, localTailwindSettings.optimizeLayout);
      break;
    case "TEXT":
     let layoutBuilder = new TailwindTextBuilder(node, localTailwindSettings.layerName, false)
        .commonPositionStyles(node, localTailwindSettings.optimizeLayout)
        .textAlign(node);
        const styledHtml = layoutBuilder.getTextSegments(node.id);
      break;
    case "SECTION":
      builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false)
        .size(node, localTailwindSettings.optimizeLayout)
        .position(node, localTailwindSettings.optimizeLayout)
        .customColor(node.fills, "bg");
      break;
  }
  const node1 = node as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
  var layoutBuilder = tailwindAutoLayoutProps(node, node1)
  var build = [...builder.attributes, ...layoutBuilder.split(" ")]
  var styleClass =  uniqueArray(build)
  return styleClass
}