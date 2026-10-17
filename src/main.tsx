import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  // Load the application separately so outdated dependency chunks cannot leave
  // the initial document blank before React's error boundary can mount.
  Promise.all([import("./App.tsx"), import("./i18n")])
    .then(([{ default: App }]) => createRoot(root).render(<App />))
    .catch(() => {
      const heading = document.createElement("h1");
      heading.textContent = "U⚡️Sportz couldn’t load";
      const message = document.createElement("p");
      message.textContent = "Check your connection and reload the page.";
      const retry = document.createElement("a");
      retry.href = window.location.href;
      retry.textContent = "Reload page";
      root.className = "min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center";
      root.replaceChildren(heading, message, retry);
    });
}
