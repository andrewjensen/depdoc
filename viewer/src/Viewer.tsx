import React, { useCallback } from "react";
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

import { useViewerStore } from "./viewerStore";
import ModuleSearch from "./ModuleSearch";
import InternalModuleNode from "./InternalModuleNode";

import "reactflow/dist/style.css";

type ViewerProps = {
  nodes: Node[];
  edges: Edge[];
};

const NODE_TYPES = {
  internalModule: InternalModuleNode,
};

export default function Viewer({ nodes, edges }: ViewerProps) {
  const dragNode = useViewerStore((state) => state.dragNode);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // console.log("nodes change", changes);
    for (let change of changes) {
      if (change.type === "position" && change.dragging) {
        dragNode(change.id, change.position);
      } else {
        // console.log("Unhandled change:", change);
      }
    }
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodeTypes={NODE_TYPES}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        // snapToGrid={true}
        // snapGrid={[20, 20]}
        zoomOnScroll={false}
      >
        <Background color="#aaa" gap={20} variant={BackgroundVariant.Dots} />
        <Panel position="top-center">
          <ModuleSearch />
        </Panel>
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
