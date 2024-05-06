import React from "react";
import ReactFlow, { Background, BackgroundVariant, Panel } from "reactflow";

import "reactflow/dist/style.css";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export default function App() {
  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <Viewer />
      </main>
    </div>
  );
}

function Header() {
  return <header className="text-3xl bg-black text-white p-8">My Repo</header>;
}

function Viewer() {
  return (
    <div className="w-full h-full">
      <ReactFlow nodes={initialNodes} edges={initialEdges}>
        <Background color="#aaa" variant={BackgroundVariant.Dots} />
        <Panel position="top-center">Hello from the panel</Panel>
      </ReactFlow>
    </div>
  );
}
