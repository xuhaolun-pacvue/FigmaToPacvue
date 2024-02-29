export const commonSortChildrenWhenInferredAutoLayout = (
  node: SceneNode & ChildrenMixin,
  optimize: boolean
) => {
  if(!node.children) return []
  if (node.children.length <= 1) {
    return node.children;
  }

  if (
    optimize &&
    "inferredAutoLayout" in node &&
    node.inferredAutoLayout !== null
  ) {
    const children = [...node.children];
    switch (node.inferredAutoLayout.layoutMode) {
      case "HORIZONTAL":
        return children.sort((a, b) => a.x - b.x);
      // NONE is a bug from Figma.
      case "NONE":
      case "VERTICAL":
        return children.sort((a, b) => a.y - b.y);
    }
  }
  return node.children;
};
