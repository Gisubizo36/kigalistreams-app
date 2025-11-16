import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./app.jsx";
import './index.css';

try {
  const container = document.getElementById("root");
  const root = ReactDOMClient.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Failed to start React app:", e);
}