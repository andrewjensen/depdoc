import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeMeta } from "./types";
import { useViewerStore } from "./viewerStore";

export default function InternalModuleNode({ id, data }: NodeProps<NodeMeta>) {
  const selectedNodeId = useViewerStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useViewerStore((state) => state.setSelectedNodeId);
  const expandUpstream = useViewerStore((state) => state.expandUpstream);

  const handleToggleMenuButton = () => {
    if (id === selectedNodeId) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(id);
    }
  };

  const handleExpandUpstream = () => {
    expandUpstream(id);
  };

  const handleExpandDownstream = () => {
    console.log("TODO: expand downstream");
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="ml-[2px]" />
      <div className="bg-white px-8 py-4 rounded-lg border border-black">
        <p className="text-xl text-black">{data.label}</p>
        <MenuButton onToggle={handleToggleMenuButton} />
        {id === selectedNodeId && (
          <Menu
            onExpandUpstream={handleExpandUpstream}
            onExpandDownstream={handleExpandDownstream}
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} className="mr-[2px]" />
    </>
  );
}

type MenuButtonProps = {
  onToggle: () => void;
};

function MenuButton({ onToggle }: MenuButtonProps) {
  return (
    <div
      className="absolute right-1 top-1 bg-white w-6 h-6 rounded border border-1 border-white text-center text-gray-400 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800"
      onClick={onToggle}
    >
      <span className="block my-[-3px]">...</span>
    </div>
  );
}

type MenuProps = {
  onExpandUpstream: () => void;
  onExpandDownstream: () => void;
};

function Menu({ onExpandUpstream, onExpandDownstream }: MenuProps) {
  return (
    <div className="absolute top-0 right-[-244px] w-[240px] bg-white border border-gray-400 border-1 text-sm z-50 py-2 rounded-lg cursor-default">
      <p
        className="py-1 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={onExpandUpstream}
      >
        Expand upstream
      </p>
      <p
        className="py-1 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={onExpandDownstream}
      >
        Expand downstream
      </p>
    </div>
  );
}
