
import { PluginSettings } from "../code";
import { TailwindDefaultBuilder } from "./tailwindDefaultBuilder";
import { TailwindTextBuilder } from "./tailwindTextBuilder";
import { svgIcon } from "./PacvueIcon";
type ParentNodeObj = {
  type: string;
  name: string;
  node: SceneNode;
  width: number;
  height: number;
  html: string;
  style: string[];
  children: any[];
};
type ChildNodeObj = {
  type: string;
  name: string;
  node: SceneNode;
  width: number;
  height: number;
  html: string;
  style: string[];
};
export let localTailwindSettings: PluginSettings;
export const tailwindMain1 = (sceneNode: Array<SceneNode>,
  settings: PluginSettings) => {
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
const tailwindContainer = (node: SceneNode ): ParentNodeObj | ChildNodeObj =>{
  const nodeStyle = node as SceneNode & SceneNodeMixin & MinimalBlendMixin & LayoutMixin
  const nodeStyle1 = node as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & MinimalBlendMixin
  const nodeStyle2 = node as GeometryMixin & BlendMixin & SceneNode
  var builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, false)
  .blend(nodeStyle)
  .position(node, localTailwindSettings.optimizeLayout)
  .customColor(nodeStyle.fills, "bg")
  .commonPositionStyles(nodeStyle1, localTailwindSettings.optimizeLayout)
  .commonShapeStyles(nodeStyle2);
  if(node.type == 'TEXT'){
    builder = new TailwindTextBuilder(node, localTailwindSettings.layerName, false).commonPositionStyles(node, localTailwindSettings.optimizeLayout).textAlign(node);
  }
  var styleClass = uniqueArray(builder.attributes)
  let ParentObj: ParentNodeObj = {
    type: node.type,
    name: node.name,
    node: node,
    width: node.width,
    height: node.height,
    style: styleClass,
    html: '',
    children: []
  }
  let ChildObj: ChildNodeObj = {
    type: node.type,
    name: node.name,
    node: node,
    width: node.width,
    height: node.height,
    style: styleClass,
    html: '',
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
    if(
      (node.height == 36 || node.height == 32)&&
      (styleClass.includes('rounded-md') || styleClass.includes('rounded')) &&
      styleClass.includes("border") &&
      styleClass.includes('border-[var(--icon-disabled--)]')
    ){
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
        return ParentObj;
      }
    } else if ((node.height == node.width && node.height == 18) || node.name == '多选框'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'Checkbox';
      return ParentObj
    } else if ((node.height == node.width && node.height == 20 && styleClass.includes("border")) || node.name == '单选框'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'Radio';
      return ParentObj
    } else if (node.name == '开关'){
      ParentObj.type = 'PACVUE';
      ParentObj.name = 'PacvueSwitch';
      return ParentObj
    } else if (node.name == '文本域'){
      if(childrenList.filter(e=>{
        return e.name == '文本域' || e.name == 'PacvueInput-Textarea'
      }).length == 0){
        ParentObj.type = 'PACVUE';
        ParentObj.name = 'PacvueInput-Textarea';
        return ParentObj
      }else{
        ParentObj.children = childrenList
      }
    } else if (node.name.includes('tab')) {
      ParentObj.type = 'PACVUE';
      let html = ''
      childrenList.forEach(e=>{
        const text = getChildrenAllText([e.node], []).join(' ')
        if(childrenList.some(e=>{
          return e.style.includes('border')
        })){
          ParentObj.name = `PacvueRadioGroup`;
          html += `\n<pacvue-radio-button >${ text }</pacvue-radio-button>`
        }else{
          ParentObj.name = `PacvueTab`;
          html += `\n<el-tab-pane label="${ text }"></el-tab-pane>`
        }
      })
      ParentObj.html = html
      return ParentObj
    } else if (
      (node.name.includes('主要按钮') || node.name.includes('次级按钮')) || (
      (node.height == 36 || node.height == 32) && 
      styleClass.includes("border") &&
      styleClass.includes("border-[var(--el-color-primary)]")
    )) {
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
      return ParentObj;
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
      return ParentObj
    } else if (node.width == node.height && node.width < 26 && node.type == 'INSTANCE'){
      ParentObj.type = 'PACVUE';
      const a: string = node.name;
      let icon = (svgIcon as { [key: string]: string })[a.trim()];
      ParentObj.name = `PacvueIcon-${icon}`;
      return ParentObj;
    } else{
      const pacvueChildren = childrenList.filter(e=>e.type == 'PACVUE')
      if(childrenList.length == 1 && pacvueChildren.length == 1){
        return childrenList[0]
      }
      if(pacvueChildren.length > 0 && ['Checkbox', 'Radio'].includes(pacvueChildren[0].name)){
        const tipNum = searchByName(visibleChildNode, 0, 'tips-exclamation')
        var textLength = searchByType(visibleChildNode, 0, 'TEXT')
        var textArr: string[] = []
        if(textLength > 0){
          const tipNode = getNodeByType(visibleChildNode, [], 'TEXT')
          tipNode.forEach(e=>{
            const n = e as TextNode
            textArr.push(tailwindText(n, false))
          })
        }
        ParentObj.html = textArr.join(' ')
        ParentObj.type = 'PACVUE';
        ParentObj.name = 'Pacvue' + pacvueChildren[0].name + (tipNum > 0 ? '-Tips' : '');
        return ParentObj
      }
      if(childrenList.length == 1 && styleClass.filter(e=>{
        return e.includes('bg-') || e.includes('border-')
      }).length == 0){
        return childrenList[0]
      }else{
        ParentObj.children = childrenList
      }
    }
    return ParentObj
  }else{
    return ChildObj
  }

}
const uniqueArray = (array: string[]): string[] => {
  let arr1: string[] = [];
  array.forEach((value) => {
    if (!arr1.includes(value)) {
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
const tailwindText = (node: TextNode, isJsx: boolean): string => {
  let layoutBuilder = new TailwindTextBuilder(node, localTailwindSettings.layerName, isJsx).commonPositionStyles(node, localTailwindSettings.optimizeLayout).textAlign(node);
  const styledHtml = layoutBuilder.getTextSegments(node.id);

  let content = "";
  if (styledHtml.length === 1) {
    layoutBuilder.addAttributes(styledHtml[0].style);
    content = styledHtml[0].text;
  } else {
    content = styledHtml.map((style) => `<span class="${style.style}">${style.text}</span>`).join("");
  }
  return `\n<div${layoutBuilder.build()}>${content}</div>`;
};