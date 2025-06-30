import { useEffect, useState } from 'react'
import './Loader.scss'

const Loader = () => {
  const [isLoaderDisplay, setIsLoaderDisplay] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaderDisplay(false)
    }, 1500);
  },[])

  return (
    <div className='overlay' style={{display: isLoaderDisplay ? "block" :"none"}}>
      <span className="loader"></span>
    </div>
      
  )
}

export default Loader