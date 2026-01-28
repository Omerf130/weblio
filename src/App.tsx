import { useEffect, useState } from "react";
import "./App.css";
import About from "./components/about/About";
import Contacts from "./components/contact/Contacts";
import Footer from "./components/footer/Footer";
import Hero from "./components/hero/Hero";
import Loader from "./components/loader/Loader";
import Nav from "./components/nav/Nav";
import Projects from "./components/projects/Projects";
import Services from "./components/services/Services";
import WhyMe from "./components/whyMe/WhyMe";
import BackgroundStars from "./components/background/BackgroundStars";

function App() {
  const [isLoaderDisplay, setIsLoaderDisplay] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaderDisplay(false);
    }, 1500);

    // Detect Facebook in-app browser and add class
    const isFacebookBrowser = () => {
      const ua = navigator.userAgent || navigator.vendor;
      return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);
    };

    if (isFacebookBrowser()) {
      document.body.classList.add("fb-browser");
      // Force a reflow to ensure proper rendering
      document.body.style.transform = "translateZ(0)";
    }
  }, []);
  return (
    <div className="app">
      <Nav />
      <BackgroundStars />
      {isLoaderDisplay ? (
        <Loader />
      ) : (
        <>
          <Hero />
          <About />
          <Services />
          <WhyMe />
          <Projects />
          <Contacts />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
