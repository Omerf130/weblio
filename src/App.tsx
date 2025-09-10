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

function App() {
  const [isLoaderDisplay, setIsLoaderDisplay] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaderDisplay(false);
    }, 1500);
  }, []);
  return (
    <div className="app">
      <Nav />
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
