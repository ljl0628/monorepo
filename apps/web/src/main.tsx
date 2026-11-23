import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@monorepo/ui";
import { createResponse } from "@monorepo/utils";
import "./App.css";

const data = createResponse({ name: "Monorepo" });
console.log(data);

function App() {
  return (
    <div className="app">
      <h1>Monorepo Web</h1>
      <p>pnpm workspaces + React + TypeScript</p>
      <Button onClick={() => alert("Hello from monorepo!")}>Click me</Button>
      <Button variant="secondary" style={{ marginLeft: 8 }}>
        Secondary
      </Button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
