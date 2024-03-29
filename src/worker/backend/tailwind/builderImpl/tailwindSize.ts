import { pxToLayoutSize } from "../conversionTables";
import { nodeSize } from "../../common/nodeWidthHeight";
import { commonIsAbsolutePosition } from "../../common/commonPosition";
import { formatWithJSX } from "../../common/parseJSX";

export const tailwindSizePartial = (
	node: SceneNode,
	optimizeLayout: boolean
): { width: string; height: string } => {
	const size = nodeSize(node, optimizeLayout);
	const node1 = node as  SceneNode & ChildrenMixin;
	const nodeParent =
		(node.parent && optimizeLayout && "inferredAutoLayout" in node.parent
			? node.parent.inferredAutoLayout
			: null) ?? node.parent;
	let w = "";
	const isReactive = node.type === "GROUP" || ("layoutMode" in node && ((optimizeLayout ? node.inferredAutoLayout : null) ?? node)?.layoutMode === "NONE")
	if (typeof size.width === "number" ) {
		if((!node1.children && node.type!="TEXT") || isReactive){
			w = `w-${pxToLayoutSize(size.width)}`;
		}
	} else if (size.width === "fill") {
		if (
			nodeParent &&
			"layoutMode" in nodeParent &&
			nodeParent.layoutMode === "HORIZONTAL"
		) {
			w = `grow shrink basis-0`;
		} else {
			w = `w-full`;
		}
	}

	let h = "";
	if (typeof size.height === "number"	) {
		if((!node1.children && node.type!="TEXT") || isReactive){
			h = `h-${pxToLayoutSize(size.height)}`;
		}
	} else if (size.height === "fill") {
		if (
			size.height === "fill" &&
			nodeParent &&
			"layoutMode" in nodeParent &&
			nodeParent.layoutMode === "VERTICAL"
		) {
			h = `grow shrink basis-0`;
		} else {
			h = `self-stretch`;
		}
	}

	return { width: w, height: h };
};

export const htmlSizePartialForTailwind = (
	node: SceneNode,
	isJSX: boolean
): [string, string] => {
	return [
		formatWithJSX("width", isJSX, node.width),
		formatWithJSX("height", isJSX, node.height),
	];
};
