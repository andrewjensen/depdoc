export type Graph = {
  title: string;
  nodes: NodeMeta[];
  edges: EdgeMeta[];
};

export type NodeMeta = {
  id: string;
  node_type: string;
  label: string;
  path_absolute: string;
  path_relative: string;
};

export type EdgeMeta = {
  id: string;
  source_id: string;
  target_id: string;
};
