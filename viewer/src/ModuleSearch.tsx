import React, { useState } from "react";
import { useViewerStore } from "./viewerStore";
import { NodeMeta } from "./types";

export default function ModuleSearch() {
  const nodes = useViewerStore((state) => state.completeGraph.nodes);
  const addNode = useViewerStore((state) => state.addNode);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<NodeMeta[]>([]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setResults([]);
    } else {
      const searchResults = nodes.filter((node) =>
        node.path_relative.includes(e.target.value),
      );
      setResults(searchResults);
    }
  };

  const handleSelectNode = (id: string) => {
    setSearchTerm("");
    setResults([]);

    addNode(id);
  };

  return (
    <div className="w-[600px] shadow-lg bg-white">
      <div className="flex">
        <input
          type="text"
          className="px-2 h-10 rounded-lg flex-1"
          placeholder="Search for a file..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      {results.length > 0 && (
        <div className="pt-4 overflow-auto max-h-80">
          <ul>
            {results.map((result: NodeMeta) => (
              <li
                key={result.id}
                className="py-2 px-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectNode(result.id)}
              >
                {result.path_relative}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
