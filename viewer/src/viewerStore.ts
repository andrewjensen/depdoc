import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Node, Edge, XYPosition, Position, MarkerType } from "reactflow";

import { Graph, EdgeMeta, NodeMeta } from "./types";

export type ViewerState = {
  completeGraph: Graph;
  visibleNodes: Node[];
  visibleEdges: Edge[];

  setGraphData: (graph: Graph) => void;
  addNode: (id: string) => void;
  dragNode: (id: string, position: XYPosition) => void;
};

export const useViewerStore = create<ViewerState>()(
  devtools((set) => ({
    completeGraph: { nodes: [], edges: [] },
    visibleNodes: [],
    visibleEdges: [],
    setGraphData: (graph: Graph) => {
      set({
        completeGraph: graph,
      });
    },
    addNode: (id: string) => {
      set((state) => {
        const node = state.completeGraph.nodes.find((node) => node.id === id);
        if (!node) {
          throw new Error("Could not find node");
        }

        const isAlreadyVisible = state.visibleNodes.some(
          (visibleNode) => visibleNode.id === id,
        );

        if (!isAlreadyVisible) {
          const addedNode = makeVisibleNode(node);
          return { visibleNodes: [...state.visibleNodes, addedNode] };
        } else {
          return {};
        }
      });
    },
    dragNode: (id: string, position: XYPosition) => {
      set((state: ViewerState) => {
        const foundNode = state.visibleNodes.find((node) => node.id === id);
        const editedNode: Node = { ...foundNode, position };

        return {
          visibleNodes: state.visibleNodes.map((node) =>
            node.id === id ? editedNode : node,
          ),
        };
      });
    },
  })),
);

function makeVisibleNode(nodeMeta: NodeMeta): Node {
  return {
    id: nodeMeta.id,
    position: {
      x: 20,
      y: 20,
    },
    data: { label: nodeMeta.label },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
}

function makeVisibleEdge(edgeMeta: EdgeMeta): Edge {
  return {
    id: `${edgeMeta.source_id}-${edgeMeta.target_id}`,
    source: edgeMeta.source_id,
    target: edgeMeta.target_id,
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  };
}
