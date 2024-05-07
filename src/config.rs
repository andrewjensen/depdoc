use serde::Deserialize;
use std::fs::File;
use std::io::Read;
use std::path::Path;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub title: String,
    pub language: String,
    pub path: String,
}

pub fn read_config_file(file_path: &str) -> Result<Config, Box<dyn std::error::Error>> {
    let path = Path::new(file_path);
    let mut file = File::open(path)?;

    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let config: Config = serde_yaml::from_str(&content)?;

    Ok(config)
}
