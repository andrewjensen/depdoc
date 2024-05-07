use clap::{Parser, Subcommand};
use glob::glob;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

mod config;
mod graph;
mod imports;
mod parse;

use crate::config::read_config_file;
use crate::graph::{Edge, Graph, Node, NodeType};
use crate::imports::{resolve_imports, ResolvedImport};
use crate::parse::extract_imports;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Generate static files to publish
    Generate {
        /// Location of the config file
        #[arg(short, long)]
        config: String,
    },
    /// Generate and serve files
    Serve {
        /// Location of the config file
        #[arg(short, long)]
        config: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Generate { config }) => {
            let graph = generate_graph(&config);

            println!("Saving graph to JSON...");
            let graph_json = serde_json::to_string_pretty(&graph).unwrap();
            let cwd = std::env::current_dir().unwrap();
            let output_path = cwd.join("graph.json");
            fs::write(output_path, graph_json).unwrap();

            println!("Done!");
        }
        Some(Commands::Serve { config: _ }) => {
            panic!("Not implemented yet");
        }
        None => {
            println!("No command provided");
            std::process::exit(1);
        }
    }
}

fn generate_graph(config_location: &str) -> Graph {
    println!("Config location: {}", config_location);

    let config = read_config_file(config_location).unwrap();

    println!("Finding source paths...");
    let paths = get_source_paths(&config.path);
    println!("Found {} source files.", paths.len());

    let nodes: Vec<Node> = paths
        .iter()
        .map(|path| {
            let file_name = path.file_name().unwrap().to_str().unwrap();
            let path_relative = path.strip_prefix(&config.path).unwrap().to_str().unwrap();
            Node {
                id: Uuid::new_v4().to_string(),
                node_type: NodeType::Internal,
                label: file_name.to_string(),
                path_absolute: path.to_str().unwrap().to_string(),
                path_relative: path_relative.to_string(),
            }
        })
        .collect();

    let nodes_by_path: HashMap<String, &Node> = nodes
        .iter()
        .map(|node| (node.path_absolute.clone(), node))
        .collect();

    println!("Extracting imports from files...");
    let mut edges: Vec<Edge> = vec![];
    for node in nodes.iter() {
        println!("  Parsing file: {:?}", node.path_relative);
        let contents = fs::read_to_string(&node.path_absolute).unwrap();
        let unresolved_imports = extract_imports(&contents);

        let resolved_imports = resolve_imports(unresolved_imports, &node, &nodes_by_path);

        let import_edges: Vec<Edge> = resolved_imports
            .iter()
            .filter_map(|import| {
                match import {
                    ResolvedImport::InternalImport {
                        target_path: _,
                        target_node_id,
                    } => Some(Edge {
                        id: Uuid::new_v4().to_string(),
                        source_id: node.id.clone(),
                        target_id: target_node_id.clone(),
                    }),
                    ResolvedImport::ExternalImport {
                        target_module_name: _,
                    } => {
                        // TODO: create edges for external imports
                        None
                    }
                }
            })
            .collect();
        edges.extend(import_edges);
    }
    println!("Found {} edges between modules.", edges.len());

    let graph = Graph {
        title: config.title,
        nodes,
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
        .any(|component| component == "node_modules" || component == "build")
}
