import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import App from "./App.tsx";
import "./index.scss";
import "./assets/styles/main.scss";
import Projects from "./pages/projects/Projects.tsx";
import ReactGA from "react-ga4";
import GATracker from "./components/GATracker/GATracker.tsx";

ReactGA.initialize("G-9G2M3T5KEG");


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <GATracker/>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
