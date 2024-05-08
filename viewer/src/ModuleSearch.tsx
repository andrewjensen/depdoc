import React, { useState, useCallback, useRef } from "react";
import { useViewerStore } from "./viewerStore";
import { NodeMeta } from "./types";
import useKeypress from "./useKeypress";

export default function ModuleSearch() {
  const nodes = useViewerStore((state) => state.completeGraph.nodes);
  const addNode = useViewerStore((state) => state.addNode);

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<NodeMeta[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIdx(0);

    if (e.target.value === "") {
      setResults([]);
    } else {
      const lowercaseSearchTerm = e.target.value.toLowerCase();
      const searchResults = nodes.filter(
        (node) =>
          node.path_relative.toLowerCase().includes(lowercaseSearchTerm) ||
          (node.node_type === "EXTERNAL" &&
            node.label.toLowerCase().includes(lowercaseSearchTerm)),
      );
      setResults(searchResults);
    }
  };

  const handleSelectNode = useCallback(
    (id: string) => {
      setSearchTerm("");
      setResults([]);

      addNode(id);
    },
    [setSearchTerm, setResults, addNode],
  );

  const handleKeypress = useCallback(
    (event: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
          setSelectedIdx((prev: number) => Math.max(0, prev - 1));
          break;
        case "ArrowDown":
          setSelectedIdx((prev: number) =>
            Math.min(results.length - 1, prev + 1),
          );
          break;
        case "Enter":
          if (results.length > 0) {
            handleSelectNode(results[selectedIdx].id);
          }
          break;
        case "Escape":
          setSearchTerm("");
          setResults([]);
          break;
      }
    },
    [results, setSelectedIdx, selectedIdx, handleSelectNode, inputRef],
  );

  useKeypress(["ArrowUp", "ArrowDown", "Enter", "Escape"], handleKeypress);

  return (
    <div className="w-[600px] shadow-lg bg-white">
      <div className="flex">
        <input
          type="text"
          ref={inputRef}
          className="px-2 h-10 rounded-lg flex-1"
          placeholder="Search for a file..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      {results.length > 0 && (
        <div className="pt-4 overflow-auto max-h-80">
          <ul>
            {results.map((result: NodeMeta, idx: number) => (
              <li
                key={result.id}
                className={`py-2 px-2 hover:bg-gray-100 cursor-pointer ${idx === selectedIdx ? "bg-gray-100" : ""}`}
                onClick={() => handleSelectNode(result.id)}
              >
                {result.node_type === "INTERNAL"
                  ? result.path_relative
                  : result.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
