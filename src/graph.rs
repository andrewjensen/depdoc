use serde::Serialize;

#[derive(Serialize)]
pub struct Graph {
    pub title: String,
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Serialize)]
pub struct Node {
    pub id: String,
    pub node_type: NodeType,
    pub label: String,
    pub path_absolute: String,
    pub path_relative: String,
}

#[derive(Serialize)]
pub enum NodeType {
    Internal,
    External,
}

#[derive(Serialize, Debug)]
pub struct Edge {
    pub id: String,
    pub source_id: String,
    pub target_id: String,
}
