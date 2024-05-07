import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeMeta } from "./types";

// TODO: finish implementing
const SHOW_EXPANDERS = false;

export default function InternalModuleNode({ data }: NodeProps<NodeMeta>) {
  const handleExpandUp = () => {
    console.log("expand up");
  };

  const handleExpandDown = () => {
    console.log("expand down");
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="ml-[2px]" />
      <div className="bg-white px-8 py-4 rounded border border-black">
        <p className="text-xl text-black">{data.label}</p>
        {SHOW_EXPANDERS && (
          <>
            <ExpanderBadge
              position="left"
              label="+"
              tooltip="Expand all dependent modules"
              onClick={handleExpandUp}
            />
            <ExpanderBadge
              position="right"
              label="+"
              tooltip="Expand all dependencies"
              onClick={handleExpandDown}
            />
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="mr-[2px]" />
    </>
  );
}

type ExpanderBadgeProps = {
  position: "left" | "right";
  label: string;
  tooltip: string;
  onClick: () => void;
};

function ExpanderBadge({
  position,
  label,
  tooltip,
  onClick,
}: ExpanderBadgeProps) {
  const classes = [
    "absolute",
    "bg-gray-500",
    "cursor-pointer",
    "h-[20px]",
    "hover:bg-gray-700",
    "inline",
    "pt-[3px]",
    "rounded-[999px]",
    "text-center",
    "text-white",
    "text-xs",
    "top-[-8px]",
    "w-[20px]",
  ];
  if (position === "left") {
    classes.push("left-[-10px]");
  } else {
    classes.push("right-[-10px]");
  }

  return (
    <div className={classes.join(" ")} title={tooltip} onClick={onClick}>
      {label}
    </div>
  );
}
