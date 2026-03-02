import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#FFFDF8",
          color: "#3E2723",
          border: "1px solid #FFE0B2",
          borderRadius: "16px",
          fontFamily: "Inter, sans-serif",
        },
      }}
    />
    <App />
  </React.StrictMode>
);
