import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ObservationView from './components/ObservationView'
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer'
import { ObservationsContext } from './contexts/ObservationsContext';
import { useState } from 'react'
import ObservationModal from './components/ObservationModal';
import { readUrlFilters } from './utils/url';
import ScrollToTopButton from './components/ScrollToTopButton';

function App() {
  // Filters start from the URL. Only codes are known at this point; the dropdowns look up display names.
  const [initialFilters] = useState(readUrlFilters)

  const [observations, setObservations] = useState({
    region: '',
    obs: []
  });
  const [countries, setCountries] = useState([])
  const [currentCountry, setCurrentCountry] = useState({
    code: initialFilters.country,
    name: ''
  })
  const [regions, setRegions] = useState([])
  const [currentRegion, setCurrentRegion] = useState({
    code: initialFilters.region,
    name:''
  })
  const [subRegions, setSubRegions] = useState([])
  const [currentSubRegion, setCurrentSubRegion] = useState({
    code: initialFilters.subregion,
    name:''
  })
  const [notable, setNotable] = useState(initialFilters.notable)
  const [taxonomy, setTaxonomy] = useState([])
  const [currentSpecies, setCurrentSpecies] = useState(
    initialFilters.species ? { speciesCode: initialFilters.species, comName: '' } : ''
  )
  const [loading, setLoading] = useState(true)
  const [filteredObservations, setFilteredObservations] = useState({
    region: '',
    obs: []
  })
  const [viewType, setViewType] = useState(initialFilters.view)  // 'list' or 'map'
  
  return (
    <>
      <ObservationsContext.Provider value = {{observations, setObservations,
                                                  countries, setCountries,
                                                  currentCountry, setCurrentCountry,
                                                  regions, setRegions,
                                                  currentRegion, setCurrentRegion,
                                                  subRegions, setSubRegions,
                                                  currentSubRegion, setCurrentSubRegion,
                                                  notable, setNotable,
                                                  taxonomy, setTaxonomy,
                                                  currentSpecies, setCurrentSpecies,
                                                  loading, setLoading,
                                                  filteredObservations, setFilteredObservations,
                                                  viewType, setViewType}}>
        <Router>
        <Header/>
          <Routes>
            <Route path="/" element = {<LandingPage/>} />
            {/* Optional :id opens the modal; a single route keeps the list mounted underneath it */}
            <Route path="/observations/:id?" element={
                <main>
                  <ObservationView />
                  <ObservationModal />
                </main>
            }/>
          </Routes>
          <Footer/>
          <ScrollToTopButton />
        </Router>
      </ObservationsContext.Provider>
    </>
  )
}

export default App
