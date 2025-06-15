import {useState, useEffect} from 'react'

const useWindowWidth = (maxWidth: number) => {
  const [isBelow, setIsBelow] = useState(false);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  },[maxWidth])

  const handleResize = () => {
    setIsBelow(window.innerWidth <= maxWidth);
  }

  return isBelow
}

export default useWindowWidth