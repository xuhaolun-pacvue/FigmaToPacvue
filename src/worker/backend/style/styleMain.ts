
import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
export const styleMain = (sceneNode: Array<SceneNode>): string =>{
	const visibleSceneNode = sceneNode.filter((d) => d.visible);
	const node = visibleSceneNode[0] as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
	const builder = new HtmlDefaultBuilder(node, false, false)
		.commonPositionStyles(node, true)
		.commonShapeStyles(node);
	const style = builder.styles.join(";\n");
	return style
}