import './App.css'
import About from './components/about/About'
import Contacts from './components/contact/Contacts'
import Hero from './components/hero/Hero'
import Nav from './components/nav/Nav'
import Services from './components/services/Services'

function App() {

  return (
    <div className='app'>
      <Nav/>
      <Hero/>
      <About/>
      <Services/>
      <Contacts/>
    </div>
  )
}

export default App
