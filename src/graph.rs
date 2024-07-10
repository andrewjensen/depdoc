use glob::glob;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use crate::config::read_config_file;
use crate::imports::{resolve_import, ResolvedImport};
use crate::parse::extract_imports;

#[derive(Serialize)]
pub struct Graph {
    pub title: String,
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Serialize, Clone)]
pub struct Node {
    pub id: String,
    pub node_type: NodeType,
    pub label: String,
    pub path_absolute: String,
    pub path_relative: String,
}

#[derive(Serialize, Clone)]
pub enum NodeType {
    #[serde(rename = "INTERNAL")]
    Internal,

    #[serde(rename = "EXTERNAL")]
    External,
}

#[derive(Serialize, Debug)]
pub struct Edge {
    pub id: String,
    pub source_id: String,
    pub target_id: String,
}

pub fn generate_graph(config_location: &str) -> Graph {
    println!("Config location: {}", config_location);

    let config = read_config_file(config_location).unwrap();

    println!("Finding source paths...");
    let paths = get_source_paths(&config.path);
    println!("Found {} source files.", paths.len());

    let internal_nodes: Vec<Node> = paths
        .iter()
        .map(|path| {
            let path_relative = path.strip_prefix(&config.path).unwrap().to_str().unwrap();
            Node {
                id: Uuid::new_v4().to_string(),
                node_type: NodeType::Internal,
                label: get_node_label(path_relative),
                path_absolute: path.to_str().unwrap().to_string(),
                path_relative: path_relative.to_string(),
            }
        })
        .collect();

    let nodes_by_path: HashMap<String, &Node> = internal_nodes
        .iter()
        .map(|node| (node.path_relative.clone(), node))
        .collect();

    let mut external_nodes_by_name: HashMap<String, Node> = HashMap::new();

    println!("Extracting imports from files...");
    let mut edges: Vec<Edge> = vec![];
    for node in internal_nodes.iter() {
        println!("  Parsing file: {:?}", node.path_relative);
        let contents = fs::read_to_string(&node.path_absolute).unwrap();
        let unresolved_imports = extract_imports(&contents);

        let resolved_imports: Vec<ResolvedImport> = unresolved_imports
            .into_iter()
            .map(|import| resolve_import(import, &node, &nodes_by_path, &config.module_resolution))
            .collect();

        for resolved_import in &resolved_imports {
            match resolved_import {
                ResolvedImport::InternalImport {
                    target_path: _,
                    target_node_id: _,
                } => {}
                ResolvedImport::ExternalImport { target_module_name } => {
                    if !external_nodes_by_name.contains_key(target_module_name) {
                        let external_node = Node {
                            id: Uuid::new_v4().to_string(),
                            node_type: NodeType::External,
                            label: target_module_name.clone(),
                            path_absolute: "".to_string(), // TODO: yucky type hack
                            path_relative: "".to_string(),
                        };
                        external_nodes_by_name.insert(target_module_name.clone(), external_node);
                    }
                }
            }
        }

        let import_edges: Vec<Edge> = resolved_imports
            .iter()
            .map(|import| match import {
                ResolvedImport::InternalImport {
                    target_path: _,
                    target_node_id,
                } => Edge {
                    id: Uuid::new_v4().to_string(),
                    source_id: node.id.clone(),
                    target_id: target_node_id.clone(),
                },
                ResolvedImport::ExternalImport { target_module_name } => {
                    let related_external_node =
                        external_nodes_by_name.get(target_module_name).unwrap();
                    Edge {
                        id: Uuid::new_v4().to_string(),
                        source_id: node.id.clone(),
                        target_id: related_external_node.id.clone(),
                    }
                }
            })
            .collect();
        edges.extend(import_edges);
    }
    println!("Found {} edges between modules.", edges.len());

    println!(
        "Added {} extra nodes for external modules.",
        external_nodes_by_name.len()
    );

    let mut combined_nodes: Vec<Node> = vec![];
    combined_nodes.extend(internal_nodes.clone());
    combined_nodes.extend(external_nodes_by_name.values().cloned());

    let graph = Graph {
        title: config.title,
        nodes: combined_nodes,
        edges,
    };

    graph
}

fn get_source_paths(root_directory: &str) -> Vec<PathBuf> {
    let mut combined_results = Vec::new();

    combined_results.extend(get_paths(root_directory, "js"));
    combined_results.extend(get_paths(root_directory, "jsx"));
    combined_results.extend(get_paths(root_directory, "ts"));
    combined_results.extend(get_paths(root_directory, "tsx"));

    combined_results
}

fn get_paths(root_directory: &str, file_extension: &str) -> Vec<PathBuf> {
    let glob_pattern = format!("{}/**/*.{}", root_directory, file_extension);

    let paths: Vec<PathBuf> = glob(&glob_pattern)
        .expect("Failed to read glob pattern")
        .filter_map(|entry| match entry {
            Ok(path) => Some(path),
            Err(_) => None,
        })
        .filter(|path| !contains_node_modules(&path))
        .collect();

    paths
}

fn contains_node_modules(path: &PathBuf) -> bool {
    path.iter()
        .any(|component| component == "node_modules" || component == "build" || component == "dist")
}

pub fn get_node_label(path_relative: &str) -> String {
    let path = PathBuf::from(path_relative);

    let file_stem = path.file_stem().unwrap().to_str().unwrap();
    let file_name = path.file_name().unwrap().to_str().unwrap();

    if file_stem == "index"
        && path.parent().is_some()
        && path.parent().unwrap().file_name().is_some()
    {
        let parent_dir_name = path
            .parent()
            .unwrap()
            .file_name()
            .unwrap()
            .to_str()
            .unwrap();
        format!("{}/{}", parent_dir_name, file_name)
    } else {
        file_name.to_string()
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_get_node_label_root_index() {
        let path = "index.ts";
        let label = get_node_label(path);
        assert_eq!(label, "index.ts");
    }

    #[test]
    fn test_get_node_label_src_index() {
        let path = "src/index.ts";
        let label = get_node_label(path);
        assert_eq!(label, "src/index.ts");
    }

    #[test]
    fn test_get_node_label_standard() {
        let path = "src/components/MyComponent.jsx";
        let label = get_node_label(path);
        assert_eq!(label, "MyComponent.jsx");
    }

    #[test]
    fn test_get_node_label_index() {
        let path = "src/SomeContext/index.ts";
        let label = get_node_label(path);
        assert_eq!(label, "SomeContext/index.ts");
    }
}
