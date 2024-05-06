import React, { useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Panel,
  Node,
  Edge,
  MiniMap,
  Controls,
  NodeChange,
} from "reactflow";

import { NodeMeta, EdgeMeta } from "./types";
import { useViewerStore } from "./viewerStore";
import "reactflow/dist/style.css";
import ModuleSearch from "./ModuleSearch";

const BASE_URL = "http://localhost:5000";

export default function App() {
  const state = useViewerStore();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`${BASE_URL}/graph.json`);
      const responseJson = await response.json();

      state.setGraphData(responseJson);
    }

    fetchData();

    return () => {};
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <Viewer nodes={state.visibleNodes} edges={state.visibleEdges} />
      </main>
    </div>
  );
}

function Header() {
  return <header className="text-3xl bg-black text-white p-8">My Repo</header>;
}

type ViewerProps = {
  nodes: Node[];
  edges: Edge[];
};

function Viewer({ nodes, edges }: ViewerProps) {
  const dragNode = useViewerStore((state) => state.dragNode);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    console.log("nodes change", changes);
    for (let change of changes) {
      if (change.type === "position" && change.dragging) {
        dragNode(change.id, change.position);
      } else {
        console.log("Unhandled change:", change);
      }
    }
  }, []);

  // const onEdgesChange = useCallback((changes) => {
  //   console.log("edges change", changes);
  // }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        // snapToGrid={true}
        // snapGrid={[20, 20]}
      >
        <Background color="#aaa" variant={BackgroundVariant.Dots} />
        <Panel position="top-center">
          <ModuleSearch />
        </Panel>
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
