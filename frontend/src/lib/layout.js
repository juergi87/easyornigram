// Simple top-down tree layout using Reingold-Tilford approach
const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const H_GAP = 40;
const V_GAP = 80;

export function autoLayout(nodes, edges) {
  if (!nodes.length) return nodes;

  // Build adjacency
  const children = {};
  const hasParent = new Set();
  nodes.forEach(n => { children[n.id] = []; });
  edges.forEach(e => {
    if (children[e.source]) children[e.source].push(e.target);
    hasParent.add(e.target);
  });

  // Find roots (nodes with no parent)
  const roots = nodes.filter(n => !hasParent.has(n.id)).map(n => n.id);
  if (!roots.length) {
    // Fallback: use first node
    roots.push(nodes[0].id);
  }

  const positions = {};

  function calcSubtreeWidth(nodeId) {
    const kids = children[nodeId] || [];
    if (!kids.length) return NODE_WIDTH;
    const childWidths = kids.map(calcSubtreeWidth);
    const total = childWidths.reduce((a, b) => a + b, 0) + H_GAP * (kids.length - 1);
    return Math.max(NODE_WIDTH, total);
  }

  function place(nodeId, x, y) {
    positions[nodeId] = { x, y };
    const kids = children[nodeId] || [];
    if (!kids.length) return;

    const widths = kids.map(calcSubtreeWidth);
    const totalWidth = widths.reduce((a, b) => a + b, 0) + H_GAP * (kids.length - 1);
    let curX = x - totalWidth / 2;

    kids.forEach((kid, i) => {
      const w = widths[i];
      place(kid, curX + w / 2, y + NODE_HEIGHT + V_GAP);
      curX += w + H_GAP;
    });
  }

  // Layout each tree
  let offsetX = 0;
  roots.forEach(rootId => {
    const w = calcSubtreeWidth(rootId);
    place(rootId, offsetX + w / 2, 0);
    offsetX += w + H_GAP * 3;
  });

  return nodes.map(n => ({
    ...n,
    position: positions[n.id] || n.position || { x: 0, y: 0 }
  }));
}
