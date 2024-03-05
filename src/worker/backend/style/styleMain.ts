
import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HtmlTextBuilder } from "./htmlTextBuilder";
export const styleMain = (sceneNode: Array<SceneNode>): string =>{
	const n = sceneNode[0] as SceneNode & DimensionAndPositionMixin
	const visibleSceneNode = sceneNode.filter((d) => d.visible);
	const node = visibleSceneNode[0] as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
	let builder: any
	let style: string = ''
	switch(node.type){
		case 'TEXT':
			builder = new HtmlTextBuilder(node, false, false)
				.commonPositionStyles(node, true)
				.textAlign(node);
		
			const styledHtml = builder.getTextSegments(node.id);
			for(let i of styledHtml){
				if(i.text && i.text  != " "){
					const arr = i.style.split('; ')
					let css = arr.join(';\n  ')
					style += `${i.text} {\n  ${css}\n}\n`
				}
			}
			break
		case 'GROUP':
			builder = new HtmlDefaultBuilder(node, false, false)
				.commonPositionStyles(node, true)
			style = builder.styles.join(";\n");
			break
		default:
			builder = new HtmlDefaultBuilder(node, false, false)
				.commonPositionStyles(node, true)
				.commonShapeStyles(node);
			style = builder.styles.join(";\n");
			break

	}
	if(node.type == 'TEXT'){
	}else{
	}
	return style;
}
