
/**
 * Identify all nodes that are inside Rectangles and transform those Rectangles into Frames containing those nodes.
 */
export const convertNodesOnRectangle = (
  node: FrameNode | GroupNode | InstanceNode | ComponentNode | ComponentSetNode
): FrameNode | GroupNode | InstanceNode | ComponentNode | ComponentSetNode => {
  if (node.children.length < 2) {
    return node;
  }
  if (!node.id) {
    throw new Error(
      "Node is missing an id! This error should only happen in tests."
    );
  }
  
  return node;
};
