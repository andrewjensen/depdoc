use tree_sitter::{Parser, Query, QueryCursor, Tree};
use tree_sitter_typescript;

use crate::imports::UnresolvedImport;

pub fn extract_imports(file_contents: &str) -> Vec<UnresolvedImport> {
    if !file_contents.contains("import") {
        return vec![];
    }

    let tree = parse_ts_file(file_contents);

    let language = tree_sitter_typescript::language_tsx();

    let query_contents = r###"
            (
                (import_statement
                    source:
                        (string
                            (string_fragment) @source_name
                        )
                )
            )
        "###;
    let query = Query::new(language, query_contents).unwrap();
    let source_name_index = query
        .capture_index_for_name("source_name")
        .expect("couldn't find capture index for `source_name`")
        as usize;

    let mut cursor = QueryCursor::new();
    let query_matches = cursor.matches(&query, tree.root_node(), file_contents.as_bytes());

    let module_imports: Vec<UnresolvedImport> = query_matches
        .into_iter()
        .map(|match_item| {
            let source_name_node = match_item.captures[source_name_index].node;
            let module_name = node_text(source_name_node, file_contents);

            UnresolvedImport { module_name }
        })
        .collect();

    module_imports
}

fn parse_ts_file(file_contents: &str) -> Tree {
    let language = tree_sitter_typescript::language_tsx();
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    let tree = parser.parse(file_contents, None).unwrap();

    tree
}

fn node_text(node: tree_sitter::Node, src: &str) -> String {
    return src[node.start_byte()..node.end_byte()].to_string();
}
