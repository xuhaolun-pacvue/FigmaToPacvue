
import { retrieveTopFill } from "../common/retrieveFill";
import { indentString } from "../common/indentString";
import { PluginSettings } from "../code";
import { commonSortChildrenWhenInferredAutoLayout } from "../common/commonChildrenOrder";
import { tailwindAutoLayoutProps } from "./builderImpl/tailwindAutoLayout";
import { TailwindDefaultBuilder } from "./tailwindDefaultBuilder";
import { TailwindTextBuilder } from "./tailwindTextBuilder";
import { getChildrenAllText } from "./pacvueMain"

export let localTailwindSettings: PluginSettings;

let previousExecutionCache: { style: string; text: string }[];
const selfClosingTags = ["img"];

export const tailwindMain = (
	sceneNode: any[],
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
const tailwindWidgetGenerator = (sceneNode: any[], isJsx: boolean): string => {
	let comp = "";
	// 过滤非可见图层
	sceneNode.forEach((e) => {
		/* 判断当前图层是否与子图层一致 */
		switch (e.type) {
			case "PACVUE":
				comp += pacvueContainer(e)
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
				// 根据节点名称生成不同类型的组件
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
const tailwindFrame = (
	node: FrameNode | InstanceNode | ComponentNode | ComponentSetNode,
	obj: any,
	isJsx: boolean
): string => {
	const childrenStr = tailwindWidgetGenerator(obj.children, isJsx);
	var rowColumn = ''
	if(obj.children.length > 1){
		if (node.layoutMode !== "NONE") {
			rowColumn = tailwindAutoLayoutProps(node, node);
		} else if (localTailwindSettings.optimizeLayout && node.inferredAutoLayout !== null) {
			rowColumn = tailwindAutoLayoutProps(node, node.inferredAutoLayout);
		}
	}
	return tailwindContainer(node, childrenStr, rowColumn, isJsx);
};
const tailwindGroup = (obj: any, isJsx: boolean = false): string => {
	// 忽略尺寸为零或更小的视图
	// 虽然在技术上不应该小于0，由于四舍五入的原因，
	// 它可能变为类似于：-0.000004196293048153166 的值
	// 如果内部没有子元素，也忽略，因为这是没有意义的
	const node = obj.node	as GroupNode
	if (obj.width < 0 || node.height <= 0 || node.children.length === 0) {
		return "";
	}
	// 在调用CustomNode之后，需要调用这个，因为widthHeight依赖于它
	const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).blend(node);
	builder.size1(obj);
	builder.position(node, localTailwindSettings.optimizeLayout);
	const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
	const visibleChildNode = childrNode.filter((e: SceneNode) => (e.visible && ['RECTANGLE', 'VECTOR'].includes(e.type)) || e.name.includes("矩形"));
	if(visibleChildNode.length > 1){
		visibleChildNode.forEach(e=>{
			const cnode = node as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
			if(retrieveTopFill(cnode.fills)?.type !== "IMAGE"){
				builder.border(e)
			}
		})
	}
	if (builder.attributes || builder.style) {
		const attr = builder.build("");

		const generator = tailwindWidgetGenerator(obj.children, isJsx);
		return `\n<div${attr}>${indentString(generator)}\n</div>`;
	}

	return tailwindWidgetGenerator(obj.children, isJsx);
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
	let builder2 =  new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).commonShapeStyles(node);
	const asnode = node as FrameNode | InstanceNode | ComponentNode | ComponentSetNode
	const childrNode = commonSortChildrenWhenInferredAutoLayout(asnode,localTailwindSettings.optimizeLayout)
	const visibleChildNode = childrNode.filter((e: SceneNode) => e.visible && ['RECTANGLE', 'VECTOR'].includes(e.type) && e.name.includes("矩形"));
	if(visibleChildNode.length > 1){
		visibleChildNode.forEach(e=>{
			const cnode = node as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
			if(retrieveTopFill(cnode.fills)?.type !== "IMAGE"){
				builder.border(e)
			}
		})
	}
	if (builder.attributes || additionalAttr) {
		var build = builder.build(additionalAttr);
		// image fill and no children -- let's emit an <img />
		let tag = "div";
		let src = "";
		if (retrieveTopFill(node.fills)?.type === "IMAGE") {
			if (!("children" in node) || node.children.length === 0) {
				build = builder2.build(additionalAttr);
				tag = "img";
				src = ` src="https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)}"`;
			} else {
				builder.addAttributes(`bg-[url(https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)})]`);
			}
		}
		if(build.includes(' px-6 pt-6 pb-8')){
			build = build.replace(' px-6 pt-6 pb-8', "")
			let a = build.split(' ')
			let b = a.filter(e=> !e.includes('w-')&& e != "")
			build = ' class="' + b.join(" ")
		}
		if (children) {
			const n = node as SceneNode & ChildrenMixin
			if((!build || build == ' class="w-full"') && !src && n.children.length === 1){
				return children
			}else{
				return `\n<${tag}${build}${src}>${indentString(children)}\n</${tag}>`;
			}
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
const tailwindSection = (obj: any, isJsx: boolean): string => {
	const node = obj.node	as SectionNode
	const childrenStr = tailwindWidgetGenerator(obj.children, isJsx);
	const builder = new TailwindDefaultBuilder(node, localTailwindSettings.layerName, isJsx).size(node, localTailwindSettings.optimizeLayout).position(node, localTailwindSettings.optimizeLayout).customColor(node.fills, "bg");
	if (childrenStr) {
		return `\n<div${builder.build()}>${indentString(childrenStr)}\n</div>`;
	} else {
		return `\n<div${builder.build()}></div>`;
	}
};
/* Pacvue相关 */
const pacvueContainer = (node:any): string=>{
	var ary = node.name.split('-')
	var comp = ''
	const width = node.width ? ` width="${node.width}px"` : ''
	switch (ary[0]){
		case 'PacvueSelect':
			const labelInner = ary[1] ? ` labelInner="${ary[1]}"` : ''
			comp = indentString(`\n<${ary[0]}${width}${labelInner} />`)
			break
		case 'PacvueInput':
			let endTag = ' />';
			let slotCont = "";
			let slot = "";
			if (ary[1]) {
				switch (ary[1]) {
					case 'Textarea':
						const rows = node.height ? ` :rows="${((node.height - 10) / 21).toFixed(0)}"` : '';
						endTag = ` type="textarea"${rows}/>`;
						break;
					case 'Search':
						slotCont = indentString(`\n<el-icon><PacvueIconSearch /></el-icon>`);
						slot = indentString(`\n<template #${ary[2]}>${slotCont}\n</template>`);
						endTag = ` >\n${slot}</${ary[0]}>`;
						break;
					case 'Selection':
						if (ary[2]) {
							const slotType = ary[2] == '%' ? 'suffix' : 'prefix';
							slotCont = indentString(`\n<span>${ary[2]}</span>`);
							slot = indentString(`\n<template #${slotType}>${slotCont}\n</template>`);
						}
						endTag = ` :inputWithSelection="true" :removeDuplication="true">${slot}\n</${ary[0]}>`;
						break;
					case '%':
						slotCont = indentString(`\n<span>${ary[1]}</span>`);
						slot = indentString(`\n<template #suffix>${slotCont}\n</template>`);
						endTag = ` >${slot}\n</${ary[0]}>`;
						break;
					default:
						slotCont = indentString(`\n<span>${ary[1]}</span>`);
						slot = indentString(`\n<template #prefix>${slotCont}\n</template>`);
						endTag = ` >${slot}\n</${ary[0]}>`;
						break;
				}
			}
			comp = `\n<${ary[0]}${width}${endTag}`;
		break
		case 'PacvueDatePicker':
			const datetype = ary[1] ? ` type="${ary[1]}"` : ''
			comp = `\n<${ary[0]}${datetype} />`
			break
		case 'PacvueCheckbox':
		case 'PacvueRadio':
			const list = node.children.filter((e: any)=>e.type != 'PACVUE')
			const text = tailwindWidgetGenerator(list, false)
			const line = text.split("\n")
			if(line.length > 6){
				comp = `\n<${ary[0]} style="margin-right: 0"></${ary[0]}>${indentString(text)}`
			}else{
				comp = `\n<${ary[0]} style="margin-right: 0">${indentString(text)}\n</${ary[0]}>`
			}
			break
		case 'PacvueButton':
			let nodeClone = node.node
			let html = getChildrenAllText(node.node.children, []).join(' ')
			if(node.children.length > 1){
				const child = tailwindWidgetGenerator(node.children, false)
				const flexStyle = tailwindAutoLayoutProps(nodeClone, nodeClone)
				html = `\n<div class="${flexStyle}">${indentString(child)}\n</div>\n`
			}
			let type = ""
			let size = node.height == 32 ? ' size="small"' : ""
			if(ary[1]){
				if(ary[1].includes('primary')){
					type = ` type="primary"`
				}
				if(ary[1].includes('plain')){
					type += ' plain'
				}
			}
			comp = `\n<${ary[0]}${type}${size}>${indentString(html)}</${ary[0]}>`
			break
		case 'PacvueSwitch':
			comp = `\n<${ary[0]} />`
			break
		case 'PacvueRadioGroup':
			let builder = new TailwindDefaultBuilder(node.node, localTailwindSettings.layerName, false).commonPositionStyles(node.node, localTailwindSettings.optimizeLayout).commonShapeStyles(node.node);
			const rowColumn = tailwindAutoLayoutProps(node.node, node.node.inferredAutoLayout);
			var build = ''
			if (builder.attributes || rowColumn) {
				build = builder.build(rowColumn);
			}
			comp = `\n<pacvue-radio-group ${build}>${indentString(tailwindWidgetGenerator(node.children, false))}\n</pacvue-radio-group>`
			break
		case 'PacvueTab':
			let tabhtml = ''
			node.children.forEach((e: any)=>{
				const text = getChildrenAllText([e.node], []).join(' ')
				if(node.children.some((a: any)=>{ return a.style.includes('border') })){
					tabhtml += `\n<pacvue-radio-button >${ text }</pacvue-radio-button>`
					comp = `\n<pacvue-radio-group>${indentString(tabhtml)}\n</pacvue-radio-group>`
				}else{
					tabhtml += `\n<el-tab-pane label="${ text }"></el-tab-pane>`
					comp = `\n<PacvueTab tab-position="top">${indentString(tabhtml)}\n</PacvueTab>`
				}
			})
			break
		case 'PacvueIcon':
			if(ary[1] == 'PacvueIconTipsExclamation'){
				const tooltipContent = indentString(`\n<template #content>${indentString(`\n<div><!-- Tooltip文案 --></div>`)}\n</template>`);
				const tooltipComponent = `\n<pacvue-tooltip placement="top" effect="dark">${tooltipContent}\n<el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>\n</pacvue-tooltip>`;	
				comp = tooltipComponent;
			}
			comp = `\n<el-icon :size="20"><${ary[1]}></${ary[1]}></el-icon>`
			break
		case 'PacvueDropdown':
			const buildClass = node.style.join(" ")
			const dropdownReferenceTemplate = indentString(`\n<template #reference>${indentString(`\n<div class="${buildClass}">${indentString(tailwindWidgetGenerator(node.children, false))}\n</div>`)}\n</template>`);
			const dropdownComponent = `\n<pacvue-dropdown>${dropdownReferenceTemplate}\n</pacvue-dropdown>`;
			comp = dropdownComponent
			break
		default:
			return ''
	}
	return comp
}