export const buildCategoryTree = (flat) => {
  const map = new Map();
  const roots = [];
  flat.forEach((item) => map.set(Number(item.id), { ...item, children: [] }));
  flat.forEach((item) => {
    const node = map.get(Number(item.id));
    if (item.parent_id && map.has(Number(item.parent_id))) {
      map.get(Number(item.parent_id)).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};
