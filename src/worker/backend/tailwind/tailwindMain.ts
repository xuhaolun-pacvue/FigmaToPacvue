
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
	const width = node.width ? `width='${node.width}px'` : ''
	const childrNode = commonSortChildrenWhenInferredAutoLayout(node, localTailwindSettings.optimizeLayout)
	if(node.name == '单选框+文字'){
		return tailwindWidgetGenerator(obj.children, isJsx);
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
		if(isIcon(visibleChildNodelast)){
			if(getIconName(visibleChildNodelast) == 'Rectangle 1138'){
				return '\n<PacvueDatePicker type="daterange" />'
			}
		}
	}
	if(isIcon(node)){
		return pacvueIcon(node)
	}
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
export const tailwindCodeGenTextStyles = () => {
	const result = previousExecutionCache
		.map((style) => `// ${style.text}\n${style.style.split(" ").join("\n")}`)
		.join("\n---\n");

	if (!result) {
		return "// No text styles in this selection";
	}

	return result;
};


/* Pacvue相关 */
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
		return `\n<pacvue-tooltip placement="top" effect="dark">\n  <template #content>\n    <div><!-- Tooltip文案 --></div>\n  </template>\n  <el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>\n</pacvue-tooltip>`
	}
	return `\n<el-icon :size="${node.width}">\n  <${iconName} />\n</el-icon>`;
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
const pacvueContainer = (node:any): string=>{
	var ary = node.name.split('-')
	var comp = ''
	const width = node.width ? ` width="${node.width}px"` : ''
	switch (ary[0]){
		case 'PacvueSelect':
			const labelInner = ary[1] ? ` :labelInner="'${ary[1]}'"` : ''
			comp = `\n<${ary[0]}${width} ${labelInner} />`
			break
		case 'PacvueInput':
			let endTag = ' />'
			if(ary[1]){
				if(ary[1] == 'Textarea') {
					let rows = node.height ? ` :rows="${((node.height-10) / 21).toFixed(0)}"` : ''
					endTag = ' type="textarea"' + rows + '/>'
				}else if(ary[1] == 'Search') {
					endTag = ` >\n  <template #${ary[2]}>\n    <el-icon><PacvueIconSearch /></el-icon>\n  </template>\n</${ary[0]}>`
				}else if(ary[1] == 'Selection') {
					let slot =''
					if(ary[2]){
						const slotType = ary[2] == '%' ? 'suffix' : 'prefix'
						slot = `\n  <template #${slotType}>\n    <span>${ary[2]}</span>\n  </template>\n`
					}
					endTag = ` :inputWithSelection="true" :removeDuplication="true">${slot}</${ary[0]}>`
				}else if(ary[1] == '%') {
					endTag = ` >\n  <template #suffix>\n    <span>${ary[1]}</span>\n  </template>\n</${ary[0]}>`
				}else{
					endTag = ` >\n  <template #prefix>\n    <span>${ary[1]}</span>\n  </template>\n</${ary[0]}>`
				}
			}
			comp = `\n<${ary[0]}${width}${endTag}`;
		break
		case 'PacvueDatePicker':
			comp = `\n<${ary[0]} type="${ary[1]}" />`
			break
		case 'PacvueCheckbox':
		case 'PacvueRadio':
			const list = node.children.filter((e: any)=>e.type != 'PACVUE')
			const text = tailwindWidgetGenerator(list, false)
			const line = text.split("\n")
			if(line.length > 6){
				comp = `\n<${ary[0]} style="margin-right: 0"></${ary[0]}>${text}`
			}else{
				comp = `\n<${ary[0]} style="margin-right: 0">${text}\n</${ary[0]}>`
			}
			break
		case 'PacvueButton':
			let type = ""
			let icon = ""
			let size = node.height == 32 ? ' size="small"' : ""
			if(ary[1]){
				if(ary[1].includes('primary')){
					type = ` type="primary"`
				}
				if(ary[1].includes('plain')){
					type += ' plain'
				}
			}
			if(ary[2]){
				icon = `<el-icon :size="20"><${ary[2]}></${ary[2]}></el-icon>`
			}
			comp = `\n<${ary[0]}${type}${size}>${icon}${node.html}</${ary[0]}>`
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
			comp = `\n<pacvue-radio-group ${build}>${tailwindWidgetGenerator(node.children, false)}\n</pacvue-radio-group>`
			break
		case 'PacvueButtonTab':
			comp = `\n<pacvue-radio-group>${node.html}\n</pacvue-radio-group>`
			break
		case 'PacvueTab':
			comp = `\n<PacvueTab tab-position="top">${node.html}\n</PacvueTab>`
			break
		case 'PacvueIcon':
			if(ary[1] == 'PacvueIconTipsExclamation'){
				return `\n<pacvue-tooltip placement="top" effect="dark">\n  <template #content>\n    <div><!-- Tooltip文案 --></div>\n  </template>\n  <el-icon :size="${node.width}" color="#b2b2b8"><PacvueIconTipsExclamation /></el-icon>\n</pacvue-tooltip>`
			}
			comp = `\n<el-icon :size="20"><${ary[1]}></${ary[1]}></el-icon>`
			break
		case 'PacvueDropdown':
			const buildClass = node.style.join(" ")
			comp = `\n<pacvue-dropdown>\n  <template #reference>\n<div class="${buildClass}">    ${tailwindWidgetGenerator(node.children, false)}\n  </div>\n</template>\n</pacvue-dropdown>`
			break
		default:
			return ''
	}
	return comp
}