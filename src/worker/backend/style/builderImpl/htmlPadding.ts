import { commonPadding } from "../../common/commonPadding";
import { formatWithJSX } from "../../common/parseJSX";

export const htmlPadding = (
  node: InferredAutoLayoutResult,
  isJsx: boolean
): string[] => {
  const padding = commonPadding(node);
  if (padding === null) {
    return [];
  }

  if ("all" in padding) {
    if (padding.all !== 0) {
      return [formatWithJSX("padding", isJsx, padding.all)];
    } else {
      return [];
    }
  }

  let comp: string[] = [];

  // horizontal and vertical, as the default AutoLayout
  if ("horizontal" in padding) {
    if (padding.horizontal !== 0 || padding.vertical !== 0) {
      let y = padding.vertical !== 0 ? padding.vertical + 'px' : 0;
      let x = padding.horizontal !== 0 ? padding.horizontal + 'px' : 0;
      let paddingxy = `${y} ${x}`;
      comp.push(formatWithJSX("padding", isJsx, paddingxy));
    }
    return comp;
  }
  let index = 0
  const directions: Array<keyof typeof padding> = ['top', 'bottom', 'left', 'right'];
  directions.forEach(direction => {
    if (padding[direction] !== 0) {
      index++;
    }
  });
  if(index <= 2){
    if (padding.top !== 0) {
      comp.push(formatWithJSX("padding-top", isJsx, padding.top));
    }
    if (padding.bottom !== 0) {
      comp.push(formatWithJSX("padding-bottom", isJsx, padding.bottom));
    }
    if (padding.left !== 0) {
      comp.push(formatWithJSX("padding-left", isJsx, padding.left));
    }
    if (padding.right !== 0) {
      comp.push(formatWithJSX("padding-right", isJsx, padding.right));
    }
  }else{
    const top = padding.top !== 0 ? padding.top + 'px' : 0;
    const bottom = padding.top !== 0 ? padding.top + 'px' : 0;
    const left = padding.top !== 0 ? padding.top + 'px' : 0;
    const right = padding.top !== 0 ? padding.top + 'px' : 0;
    let p = `${top} ${right} ${bottom} ${left}`;
    comp.push(formatWithJSX("padding", isJsx, p));
  }
  
  // todo use REM

  return comp;
};
