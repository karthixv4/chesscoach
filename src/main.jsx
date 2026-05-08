import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import posthog from "./lib/posthog.js";

// Fires a PostHog $pageview on every SPA route change
function PostHogPageTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [location]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PostHogPageTracker />
      <App />
    </BrowserRouter>
  </StrictMode>,
);

