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
import AboutPage from "./pages/about/About.tsx";
import ServicesPage from "./pages/services/ServicesPage.tsx";
import ReactGA from "react-ga4";
import GATracker from "./components/GATracker/GATracker.tsx";
import MetaPixelTracker from "./components/MetaPixelTracker/MetaPixelTracker.tsx";
import CookieConsent from "./components/cookieConsent/CookieConsent";
import { initMetaPixel } from "./utils/metaPixel";

// Initialize Google Analytics
ReactGA.initialize("G-9G2M3T5KEG");

// Track initial page view
ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });

// Initialize Meta Pixel
initMetaPixel();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <GATracker/>
    <MetaPixelTracker/>
    <CookieConsent />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
