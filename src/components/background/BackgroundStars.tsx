import React from "react";
import "./BackgroundStars.scss";

const BackgroundStars: React.FC = () => {
  return (
    <div className="background-wrapper">
      <div className="stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
    </div>
  );
};

export default BackgroundStars;
