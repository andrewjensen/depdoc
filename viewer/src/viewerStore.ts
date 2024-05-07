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
    completeGraph: { title: "", nodes: [], edges: [] },
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

        if (isAlreadyVisible) {
          return {};
        }

        const addedNode = makeVisibleNode(node);

        const currentEdgeIds: Set<string> = new Set(
          state.visibleEdges.map((edge) => edge.id),
        );

        const edgesByIds: Record<string, EdgeMeta> = {};
        for (let edge of state.completeGraph.edges) {
          // TODO: create this data structure at the beginning, not every time
          const edgeId = edge.id;
          edgesByIds[edgeId] = edge;
        }

        const currentNodeIds: Set<string> = new Set(
          state.visibleNodes.map((node) => node.id),
        );

        const nodesByIds: Record<string, NodeMeta> = {};
        for (let node of state.completeGraph.nodes) {
          nodesByIds[node.id] = node;
        }

        const addedEdges: Edge[] = [];
        for (let edgeMeta of state.completeGraph.edges) {
          if (
            !currentEdgeIds.has(edgeMeta.id) &&
            ((edgeMeta.source_id === id &&
              currentNodeIds.has(edgeMeta.target_id)) ||
              (edgeMeta.target_id === id &&
                currentNodeIds.has(edgeMeta.source_id)))
          ) {
            // This edge isn't already visible,
            // and it connects from an existing node to the new one
            const newEdge = makeVisibleEdge(edgeMeta);
            addedEdges.push(newEdge);
          }
        }

        return {
          visibleNodes: [...state.visibleNodes, addedNode],
          visibleEdges: [...state.visibleEdges, ...addedEdges],
        };
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
    type: "internalModule",
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
    id: edgeMeta.id,
    source: edgeMeta.source_id,
    target: edgeMeta.target_id,
    type: "default",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 16,
    },
  };
}
