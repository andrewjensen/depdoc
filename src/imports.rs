use crate::config::ModuleResolutionItem;
use crate::graph::{Node, NodeType};
use std::collections::HashMap;
use std::path::{Component, PathBuf};

#[derive(Debug)]
pub struct UnresolvedImport {
    pub module_name: String,
}

#[derive(Debug, PartialEq)]
pub enum ResolvedImport {
    InternalImport {
        target_path: String,
        target_node_id: String,
    },
    ExternalImport {
        target_module_name: String,
    },
}

pub fn resolve_imports(
    unresolved_imports: Vec<UnresolvedImport>,
    node: &Node,
    nodes_by_path: &HashMap<String, &Node>,
    module_resolution: &Option<Vec<ModuleResolutionItem>>,
) -> Vec<ResolvedImport> {
    let mut resolved_imports = vec![];

    for unresolved_import in unresolved_imports {
        if unresolved_import.module_name.starts_with("./")
            || unresolved_import.module_name.starts_with("../")
        {
            let resolved_import =
                resolve_relative_path_import(&unresolved_import, &node, &nodes_by_path);

            if let Some(resolved_import) = resolved_import {
                resolved_imports.push(resolved_import);
                continue;
            }
        }

        let mut found_resolution = false;
        if let Some(module_resolution) = module_resolution {
            for resolution_item in module_resolution.iter() {
                if unresolved_import
                    .module_name
                    .starts_with(&resolution_item.pattern)
                {
                    let resolved_import = resolve_resolution_with_substitution(
                        &unresolved_import,
                        &nodes_by_path,
                        &resolution_item,
                    );

                    if let Some(resolved_import) = resolved_import {
                        resolved_imports.push(resolved_import);
                        found_resolution = true;
                        break;
                    }
                }
            }
        }

        if !found_resolution {
            let resolved_import = ResolvedImport::ExternalImport {
                target_module_name: unresolved_import.module_name,
            };
            resolved_imports.push(resolved_import);
        }
    }

    resolved_imports
}

fn resolve_relative_path_import(
    unresolved_import: &UnresolvedImport,
    node: &Node,
    nodes_by_path: &HashMap<String, &Node>,
) -> Option<ResolvedImport> {
    let mut resolved_path = PathBuf::from(&node.path_relative);
    resolved_path.pop();

    let module_buf = PathBuf::from(&unresolved_import.module_name);

    for component in module_buf.components() {
        match component {
            Component::Normal(c) => {
                resolved_path.push(c);
            }
            Component::CurDir => {
                // Do nothing
            }
            Component::ParentDir => {
                resolved_path.pop();
            }
            _ => {
                unreachable!();
            }
        }
    }

    let candidates = create_file_path_candidates(&resolved_path.to_str().unwrap());
    for candidate in candidates.iter() {
        let target_path = candidate.to_str().unwrap().to_string();
        match nodes_by_path.get(&target_path) {
            Some(target_node) => {
                let resolved_import = ResolvedImport::InternalImport {
                    target_path,
                    target_node_id: target_node.id.clone(),
                };

                return Some(resolved_import);
            }
            None => {
                continue;
            }
        }
    }

    None
}

fn resolve_resolution_with_substitution(
    unresolved_import: &UnresolvedImport,
    nodes_by_path: &HashMap<String, &Node>,
    resolution_item: &ModuleResolutionItem,
) -> Option<ResolvedImport> {
    let relative_path = unresolved_import
        .module_name
        .replace(&resolution_item.pattern, &resolution_item.replacement);

    let candidates = create_file_path_candidates(&relative_path);
    for candidate in candidates.iter() {
        let target_path = candidate.to_str().unwrap().to_string();

        match nodes_by_path.get(&target_path) {
            Some(target_node) => {
                let resolved_import = ResolvedImport::InternalImport {
                    target_path,
                    target_node_id: target_node.id.clone(),
                };

                return Some(resolved_import);
            }
            None => {
                continue;
            }
        }
    }

    None
}

fn create_file_path_candidates(module_path: &str) -> Vec<PathBuf> {
    vec![
        PathBuf::from(module_path),
        PathBuf::from(format!("{}.tsx", module_path)),
        PathBuf::from(format!("{}.ts", module_path)),
        PathBuf::from(format!("{}.jsx", module_path)),
        PathBuf::from(format!("{}.js", module_path)),
        PathBuf::from(format!("{}/index.tsx", module_path)),
        PathBuf::from(format!("{}/index.ts", module_path)),
        PathBuf::from(format!("{}/index.jsx", module_path)),
        PathBuf::from(format!("{}/index.js", module_path)),
    ]
}

mod test {
    use super::*;

    #[test]
    fn test_resolve_imports_both_root_directory() {
        let source_node = Node {
            id: "7c00c281-b165-4ccd-9deb-3575a0d7e71d".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/myFile.tsx".to_string(),
            path_relative: "myFile.tsx".to_string(),
        };

        let target_node = Node {
            id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/myOtherFile.tsx".to_string(),
            path_relative: "myOtherFile.tsx".to_string(),
        };

        let mut nodes_by_path = HashMap::new();
        nodes_by_path.insert(source_node.path_relative.clone(), &source_node);
        nodes_by_path.insert(target_node.path_relative.clone(), &target_node);

        let unresolved_imports = vec![UnresolvedImport {
            module_name: "./myOtherFile".to_string(),
        }];

        let module_resolution = None;

        let resolved_imports = resolve_imports(
            unresolved_imports,
            &source_node,
            &nodes_by_path,
            &module_resolution,
        );
        assert_eq!(
            resolved_imports,
            vec![ResolvedImport::InternalImport {
                target_path: "myOtherFile.tsx".to_string(),
                target_node_id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string()
            }]
        );
    }

    #[test]
    fn test_resolve_imports_same_directory() {
        let source_node = Node {
            id: "7c00c281-b165-4ccd-9deb-3575a0d7e71d".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/subdirectory/myFile.tsx".to_string(),
            path_relative: "subdirectory/myFile.tsx".to_string(),
        };

        let target_node = Node {
            id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/subdirectory/myOtherFile.tsx".to_string(),
            path_relative: "subdirectory/myOtherFile.tsx".to_string(),
        };

        let mut nodes_by_path = HashMap::new();
        nodes_by_path.insert(source_node.path_relative.clone(), &source_node);
        nodes_by_path.insert(target_node.path_relative.clone(), &target_node);

        let unresolved_imports = vec![UnresolvedImport {
            module_name: "./myOtherFile".to_string(),
        }];

        let module_resolution = None;

        let resolved_imports = resolve_imports(
            unresolved_imports,
            &source_node,
            &nodes_by_path,
            &module_resolution,
        );
        assert_eq!(
            resolved_imports,
            vec![ResolvedImport::InternalImport {
                target_path: "subdirectory/myOtherFile.tsx".to_string(),
                target_node_id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string()
            }]
        );
    }

    #[test]
    fn test_resolve_imports_far_away_directory() {
        let source_node = Node {
            id: "7c00c281-b165-4ccd-9deb-3575a0d7e71d".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/feature-a/subfeature/myFile.tsx".to_string(),
            path_relative: "feature-a/subfeature/myFile.tsx".to_string(),
        };

        let target_node = Node {
            id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/feature-b/subfeature/myOtherFile.tsx".to_string(),
            path_relative: "feature-b/subfeature/myOtherFile.tsx".to_string(),
        };

        let mut nodes_by_path = HashMap::new();
        nodes_by_path.insert(source_node.path_relative.clone(), &source_node);
        nodes_by_path.insert(target_node.path_relative.clone(), &target_node);

        let unresolved_imports = vec![UnresolvedImport {
            module_name: "../../feature-b/subfeature/myOtherFile".to_string(),
        }];

        let module_resolution = None;

        let resolved_imports = resolve_imports(
            unresolved_imports,
            &source_node,
            &nodes_by_path,
            &module_resolution,
        );
        assert_eq!(
            resolved_imports,
            vec![ResolvedImport::InternalImport {
                target_path: "feature-b/subfeature/myOtherFile.tsx".to_string(),
                target_node_id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string()
            }]
        );
    }

    #[test]
    fn test_resolve_imports_external() {
        let source_node = Node {
            id: "7c00c281-b165-4ccd-9deb-3575a0d7e71d".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/myFile.tsx".to_string(),
            path_relative: "myFile.tsx".to_string(),
        };

        let mut nodes_by_path = HashMap::new();
        nodes_by_path.insert(source_node.path_relative.clone(), &source_node);

        let unresolved_imports = vec![UnresolvedImport {
            module_name: "react".to_string(),
        }];

        let module_resolution = None;

        let resolved_imports = resolve_imports(
            unresolved_imports,
            &source_node,
            &nodes_by_path,
            &module_resolution,
        );
        assert_eq!(
            resolved_imports,
            vec![ResolvedImport::ExternalImport {
                target_module_name: "react".to_string(),
            }]
        );
    }

    #[test]
    fn resolve_imports_with_substitution() {
        let source_node = Node {
            id: "7c00c281-b165-4ccd-9deb-3575a0d7e71d".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/feature-a/subfeature/myFile.tsx".to_string(),
            path_relative: "feature-a/subfeature/myFile.tsx".to_string(),
        };

        let target_node = Node {
            id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string(),
            node_type: NodeType::Internal,
            label: "test".to_string(),
            path_absolute: "/path/to/repo/app/common/myCommonFile.tsx".to_string(),
            path_relative: "app/common/myCommonFile.tsx".to_string(),
        };

        let mut nodes_by_path = HashMap::new();
        nodes_by_path.insert(source_node.path_relative.clone(), &source_node);
        nodes_by_path.insert(target_node.path_relative.clone(), &target_node);

        let unresolved_imports = vec![UnresolvedImport {
            module_name: "~/common/myCommonFile".to_string(),
        }];

        let module_resolution = Some(vec![ModuleResolutionItem {
            pattern: "~/".to_string(),
            replacement: "app/".to_string(),
        }]);

        let resolved_imports = resolve_imports(
            unresolved_imports,
            &source_node,
            &nodes_by_path,
            &module_resolution,
        );
        assert_eq!(
            resolved_imports,
            vec![ResolvedImport::InternalImport {
                target_path: "app/common/myCommonFile.tsx".to_string(),
                target_node_id: "c319b51d-2f58-41aa-96f5-fbe35bb227b4".to_string()
            }]
        );
    }
}
