
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
export const pacvueMain = (sceneNode: Array<SceneNode>, settings: PluginSettings) => {
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
	let visibleChildNode: any[] = []
	if(n.children){
		visibleChildNode = n.children.filter((d) => d.visible);
	}
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
	const arrowNum = searchByName(visibleChildNode, 0, 'top bar-arrow-down')
	ParentObj.height = height
	if (childrenList.some(e=> ['多选框', 'Checkbox'].includes(e.name))){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueCheckbox';
	} else if (childrenList.some(e=> ['单选框', 'Radio'].includes(e.name))){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueRadio';
	}
	if(isAllPacvueRadio(childrenList)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueRadioGroup';
		ParentObj.children = childrenList
	} else if (isCustomButton(node, styleClass)){
		/* 通过样式判断是否是选框 */
		ParentObj.type = 'PACVUE';
		if (node.height !== node.width) {
			const excludedClasses = ['rounded-md', 'rounded', 'border', 'border-[var(--icon-disabled--)]', 'h-9', 'h-8'];
			const newClass = styleClass.filter(e => !excludedClasses.includes(e) && !e.includes('px') && !e.includes('py'));
			const dateNum = searchByName(visibleChildNode, 0, 'Rectangle 1138')
			const textLength = searchByType(visibleChildNode, 0, 'TEXT')
			const textArr: string[] = textLength > 0 ? getChildrenAllText(visibleChildNode, []) : []
			let name: string;
			if (dateNum > 0) {
				name = 'PacvueDatePicker';
				if (textArr.some(e => e === '~' || e.includes('~'))) {
					name += '-daterange';
				}
			} else if (arrowNum === 0) {
				name = 'PacvueInput';
				textArr.forEach(e => {
					if (e.length === 1) {
						name += `-${e}`;
					}
				});
			} else {
				name = 'PacvueSelect';
				const num = searchByName(visibleChildNode, 0, 'Rectangle 539');
				if (num === 1) {
					name += `-${textArr[0]}`;
				}
			}

			ParentObj.name = name;
			ParentObj.style = newClass;
		} else {
			ParentObj.name = `PacvueButton-${getIconName(visibleChildNode)}`;
		}
	} else if (isArrowBlock(childrenList, arrowNum)){
		ParentObj.type = 'PACVUE';
		var textLength = searchByType(visibleChildNode, 0, 'TEXT')
		var textArr: string[] = []
		if(textLength > 0){
			textArr = getChildrenAllText(visibleChildNode, textArr)
		}
		let name = 'PacvueInput-Selection';
			textArr.forEach((e) => {
			if (e.length == 1) {
				name += '-' + e;
			}
		});
		ParentObj.name = name;
	} else if (isCheckbox(node)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'Checkbox';
	} else if (isRadioButton(node, styleClass)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'Radio';
	} else if (hasArrowDownElement(childrenList)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueDropdown';
		ParentObj.children = childrenList
	} else if (isSwitch(node)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueSwitch';
	} else if (isTextArea(node)){
		if (childrenList.some(e=>['文本域','PacvueInput-Textarea'].includes(e.name))){
			ParentObj.type = 'PACVUE';
			ParentObj.name = 'PacvueInput-Textarea';
		} else {
			ParentObj.children = childrenList;
		}
	} else if (isSearchBox(node)){
		let slot = childrenList.length == 1 && childrenList[0].name == 'Search在后' ? '-append' : '-prefix'
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueInput-Search' + slot;
	} else if (isInputWithHeight(node, childrenList)){
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueInput-Textarea';
	} else if (isTab(node, childrenList)) {
		ParentObj.type = 'PACVUE';
		ParentObj.name = 'PacvueTab';
	} else if (isPrimaryOrSecondaryButton(node, styleClass)) {
		ParentObj.type = 'PACVUE';
		let icon = '';
		const iconList = visibleChildNode.filter(e => e.width === e.height && e.type !== 'TEXT');
		if (iconList.length === 1) {
			const iconName = iconList[0].name.trim();
			icon += '-' + (svgIcon as { [key: string]: string })[iconName];
		}
		const type = styleClass.includes("bg-[var(--el-color-primary)]") || node.name.includes('主要按钮') ? 'primary' : 'primaryplain';
		ParentObj.name = `PacvueButton-${type}${icon}`;
	} else if (isGrayButton(node)) {
		ParentObj.type = 'PACVUE';
		let type = node.name.includes('灰色按钮') ? '' : node.name.includes('次级按钮') ? 'plain' : 'primary';
		ParentObj.name = `PacvueButton-${type}`;
	} else if (isSmallSizedElement(node, childrenList)){
		ParentObj.type = 'PACVUE';
		const a: string = node.name;
		let icon = (svgIcon as { [key: string]: string })[a.trim()];
		ParentObj.name = `PacvueIcon-${icon}`;
	}

	const pacvueChildren = childrenList.filter(e=>e.type == 'PACVUE')
	const conditions = ['bg-', 'border-', 'grow', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'p-'];
	// 检查 ParentObj 的 type 是否不为 'PACVUE'，同时 childrenList 数组长度为1，且满足以下条件之一：
	// 1. pacvueChildren 数组长度为1
	// 2. styleClass 数组中没有任何元素的 name 包含 conditions 中的任何一个条件字符串
	if (ParentObj.type != 'PACVUE' && childrenList.length == 1 && (pacvueChildren.length == 1 || !styleClass.some(e => { return conditions.some(cond => e.includes(cond)) }))) {
		// 如果满足上述条件，返回 childrenList 数组中的第一个元素
		return childrenList[0]
	}else{
		// 如果条件不满足，将 childrenList 数组赋值给 ParentObj 的 children 属性
		ParentObj.children = childrenList
	}
	return ParentObj
}

const isAllPacvueRadio = (childrenList: any[]): boolean => {
	return childrenList.length > 1 && childrenList.filter(e => e.name == 'PacvueRadio').length == childrenList.length;
}
const isCustomButton = (node: SceneNode, styleClass: any[]): boolean => {
	// 检查节点高度是否在30到40之间
	const isHeightInRange = node.height < 40 && node.height > 30;
	// 检查样式类是否包含 'rounded-md' 或 'rounded'
	const hasRoundedClass = styleClass.includes('rounded-md') || styleClass.includes('rounded');
	// 检查样式类是否包含 'border'
	const hasBorderClass = styleClass.includes('border');
	// 检查样式类是否包含特定边框颜色 'border-[var(--icon-disabled--)]'
	const hasIconDisabledBorder = styleClass.includes('border-[var(--icon-disabled--)]');

	return isHeightInRange && hasRoundedClass && hasBorderClass && hasIconDisabledBorder;
};
const isArrowBlock = (childrenList: any[], arrowNum: number): boolean => {
	// 检查子元素列表是否有两个子元素
	const hasTwoChildren = childrenList.length === 2;
	// 检查第一个子元素是否具有圆角边框样式 'rounded-tl' 和 'rounded-bl'
	const isFirstChildRounded = childrenList[0]?.style.includes('rounded-tl rounded-bl');
	// 检查第二个子元素是否具有圆角边框样式 'rounded-tr' 和 'rounded-br'
	const isSecondChildRounded = childrenList[1]?.style.includes('rounded-tr rounded-br');
	// 检查子元素中是否含有箭头
	const isArrowNumOne = arrowNum === 1;
	return hasTwoChildren && isFirstChildRounded && isSecondChildRounded && isArrowNumOne;
};

const isCheckbox = (node: SceneNode): boolean => {
	// 检查节点的高度和宽度是否相等且为18，或者节点的名称是否为 '多选框'
	return (node.height == node.width && node.height == 18) || node.name == '多选框';
}
const isRadioButton = (node: SceneNode, styleClass: any[]): boolean => {
	// 检查节点的高度和宽度是否相等且为20，同时样式类包含 'rounded-full'，或者节点的名称为 '单选框'
	return (node.height == node.width && node.height == 20 && styleClass.includes("rounded-full")) || node.name == '单选框'
}
const hasArrowDownElement = (childrenList: any[]): boolean => {
	// 检查 childrenList 数组中是否存在至少一个元素，其 name 属性的值为 'top bar-arrow-down' 或 'PacvueIcon-PacvueIconTopBarArrowDown'
	return childrenList.some(e=>['top bar-arrow-down','PacvueIcon-PacvueIconTopBarArrowDown'].includes(e.name))
}
const isSwitch = (node: SceneNode): boolean => {
	return node.name == '开关'
}
const isTextArea = (node: SceneNode): boolean => {
	return node.name == '文本域'
}
const isSearchBox = (node: SceneNode): boolean => {
	return node.name == '搜索框'
}
const isInputWithHeight = (node: SceneNode, childrenList: any[]): boolean => {
	return childrenList.length == 1 && childrenList[0].name == 'Input' && node.height >= 40
}
const isTab = (node: SceneNode, childrenList: any[]): boolean => {
	// 检查以下条件之一：
	// 1. 节点的名称包含 'tab'
	// 2. 子元素列表的长度大于1，同时第一个子元素的样式包含 'rounded-tl rounded-bl'，第二个子元素的样式包含 'rounded-tr rounded-br'
	return node.name.includes('tab') || (childrenList.length > 1 && childrenList[0].style.includes('rounded-tl rounded-bl') && childrenList[1].style.includes('rounded-tr rounded-br'))
}
const isPrimaryOrSecondaryButton = (node: SceneNode, styleClass: any[]): boolean => {
	// 检查节点的名称是否包含 '主要按钮'
	const isMainButton = node.name.includes('主要按钮');
	// 检查节点的名称是否包含 '次级按钮'
	const isSecondaryButton = node.name.includes('次级按钮');
	// 检查节点的高度是否为36或32
	const isBorderHeight = node.height === 36 || node.height === 32;
	// 检查样式类是否包含 'border'
	const hasBorderClass = styleClass.includes("border");
	// 检查样式类是否包含特定主色边框颜色 'border-[var(--el-color-primary)]'
	const hasPrimaryBorderColor = styleClass.includes("border-[var(--el-color-primary)]");
	// 检查样式类是否不包含任何圆角边框样式 'rounded-tr rounded-br' 和 'rounded-tl rounded-bl'
	const isNotRounded = !styleClass.includes("rounded-tr rounded-br") && !styleClass.includes("rounded-tl rounded-bl");
	// 返回一个布尔值，表示节点是否为主要按钮或次级按钮，或者满足以下条件之一：
	// 1. 节点高度为36或32，同时样式类包含 'border'，包含特定主色边框颜色，且不包含任何圆角边框样式
	return (isMainButton || isSecondaryButton) || (isBorderHeight && hasBorderClass && hasPrimaryBorderColor && isNotRounded);
}
const isGrayButton = (node: SceneNode): boolean => {
	return node.name.includes('灰色按钮') || node.name.toLocaleLowerCase().includes('button')
}
const isSmallSizedElement = (node: SceneNode, childrenList: any[]): boolean => {
	return node.width == node.height && node.width < 26 && (node.type == 'INSTANCE' || childrenList.some(e=>e.name == 'Union'))
}
const getIconName = (visibleChildNode: any[]) => {
	let icon = '-';
	const iconList = visibleChildNode.filter(e => e.width === e.height && e.type !== 'TEXT');
	if (iconList.length === 1) {
		const iconName = iconList[0].name.trim();
		icon += (svgIcon as { [key: string]: string })[iconName];
	}
	return icon;
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
export const getChildrenAllText = (nodeList: SceneNode[], arr: string[]): string[]=>{
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