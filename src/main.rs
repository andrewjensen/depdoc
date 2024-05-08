use clap::{Parser, Subcommand};
use std::fs;

mod config;
mod graph;
mod imports;
mod parse;

use crate::graph::generate_graph;

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
