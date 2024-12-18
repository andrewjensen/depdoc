import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Node, Edge, XYPosition, Position, MarkerType } from "reactflow";

import { Graph, EdgeMeta, NodeMeta } from "./types";

export type ViewerState = {
  completeGraph: Graph;
  visibleNodes: Node[];
  visibleEdges: Edge[];
  selectedNodeId: string | null;

  setGraphData: (graph: Graph) => void;
  addNode: (id: string) => void;
  expandUpstream: (nodeId: string) => void;
  dragNode: (id: string, position: XYPosition) => void;
  setSelectedNodeId: (id: string | null) => void;
};

const DEFAULT_NODE_POSITION = { x: 20, y: 20 };
const DEFAULT_SPACING_X = 300;
const DEFAULT_SPACING_Y = 80;

export const useViewerStore = create<ViewerState>()(
  devtools((set) => ({
    completeGraph: { title: "", nodes: [], edges: [] },
    visibleNodes: [],
    visibleEdges: [],
    selectedNodeId: null,

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
    expandUpstream: (nodeId: string) =>
      set((state: ViewerState) => {
        const currentNode = state.visibleNodes.find(
          (node) => node.id === nodeId,
        );
        if (!currentNode) {
          throw new Error("Could not find node");
        }

        // Get all nodes upstream of `nodeId`
        // Filter out any nodes that are already visible
        // Make each node into a visible node
        const missingUpstreamNodes = state.completeGraph.edges
          .filter(
            (edge) =>
              edge.target_id === nodeId &&
              !state.visibleNodes.some((node) => node.id === edge.source_id),
          )
          .map((edge) =>
            state.completeGraph.nodes.find(
              (node) => node.id === edge.source_id,
            ),
          )
          .filter((maybeNode) => maybeNode !== undefined) as NodeMeta[];
        missingUpstreamNodes.sort((a, b) => a.label.localeCompare(b.label));

        // Create visible nodes, arranged vertically
        const offsetY = currentNode.position.y;
        const addedVisibleNodes = missingUpstreamNodes.map((node, idx) => {
          const position: XYPosition = {
            x: currentNode.position.x - DEFAULT_SPACING_X,
            y: offsetY + idx * DEFAULT_SPACING_Y,
          };
          return makeVisibleNode(node, position);
        });

        // Get every visible node
        // get every edge that involves those
        // take the ones that aren't already visible
        //
        // TODO: extract into function, it's the same logic as above
        const visibleNodesSet = new Set([
          ...state.visibleNodes.map((node) => node.id),
          ...addedVisibleNodes.map((node) => node.id),
        ]);
        const visibleEdgesSet = new Set(
          state.visibleEdges.map((edge) => edge.id),
        );
        const addedEdges = state.completeGraph.edges.filter(
          (edge) =>
            !visibleEdgesSet.has(edge.id) &&
            (visibleNodesSet.has(edge.source_id) ||
              visibleNodesSet.has(edge.target_id)),
        );

        const addedVisibleEdges = addedEdges.map(makeVisibleEdge);

        return {
          visibleNodes: [...state.visibleNodes, ...addedVisibleNodes],
          visibleEdges: [...state.visibleEdges, ...addedVisibleEdges],
        };
      }),
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
    setSelectedNodeId: (id: string | null) => {
      set({ selectedNodeId: id });
    },
  })),
);

function makeVisibleNode(
  nodeMeta: NodeMeta,
  position: XYPosition = DEFAULT_NODE_POSITION,
): Node {
  return {
    id: nodeMeta.id,
    type: "internalModule",
    position,
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
