
import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HtmlTextBuilder } from "./htmlTextBuilder";
export const styleMain = (sceneNode: Array<SceneNode>): string =>{
	const visibleSceneNode = sceneNode.filter((d) => d.visible);
	const node = visibleSceneNode[0] as SceneNode & SceneNodeMixin & BlendMixin & LayoutMixin & GeometryMixin & MinimalBlendMixin
	let builder: any
	if(node.type == 'TEXT'){
		builder = new HtmlTextBuilder(node, false, false)
			.commonPositionStyles(node, true)
			.textAlign(node);
	
		const styledHtml = builder.getTextSegments(node.id);
		var html = ''
		for(let i of styledHtml){
			if(i.text && i.text  != " "){
				const arr = i.style.split('; ')
				let css = arr.join(';\n  ')
				html += `${i.text} {\n  ${css}\n}\n`
			}
		}
		return html
	}else{
		builder = new HtmlDefaultBuilder(node, false, false)
			.commonPositionStyles(node, true)
			.commonShapeStyles(node);
			const style = builder.styles.join(";\n");
			return style
	}
}