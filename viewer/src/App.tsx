import React, { useEffect } from "react";

import { useViewerStore } from "./viewerStore";
import Viewer from "./Viewer";

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
      <Header title={state.completeGraph.title} />
      <main className="flex-1">
        <Viewer nodes={state.visibleNodes} edges={state.visibleEdges} />
      </main>
    </div>
  );
}

type HeaderProps = {
  title: string;
};

function Header({ title }: HeaderProps) {
  return <header className="text-3xl bg-black text-white p-8">{title}</header>;
}
