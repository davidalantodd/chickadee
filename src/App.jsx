import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ObservationView from './components/ObservationView'
import NearbyView from './components/NearbyView'
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer'
import { ObservationsContext } from './contexts/ObservationsContext';
import { useEffect, useRef, useState } from 'react'
import ObservationModal from './components/ObservationModal';
import { readUrlFilters } from './utils/url';
import ScrollToTopButton from './components/ScrollToTopButton';
import { fetchTaxonomy } from './utils/api';

function App() {
  // Filters start from the URL. Only codes are known at this point; the dropdowns look up display names.
  const [initialFilters] = useState(readUrlFilters)

  // The current page's loaded observations; `key` names the query they came from (see useObservationLoader)
  const [observations, setObservations] = useState({
    key: '',
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
  const [daysBack, setDaysBack] = useState(initialFilters.days)
  const [taxonomy, setTaxonomy] = useState([])
  const [currentSpecies, setCurrentSpecies] = useState(
    initialFilters.species ? { speciesCode: initialFilters.species, comName: '' } : ''
  )
  const [loading, setLoading] = useState(true)
  const [filteredObservations, setFilteredObservations] = useState({
    key: '',
    obs: []
  })
  const [viewType, setViewType] = useState(initialFilters.view)  // 'list' or 'map'
  // Whether the filter bar is open on phones, where it can be collapsed; it starts closed there to leave room
  // for results. Wider screens always show the filters.
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Each page's last filters as a query string ({ observations, nearby }), so the header tabs return to them
  const lastSearch = useRef({ observations: '', nearby: '' })

  // eBird's species list, used by both pages' species dropdowns
  useEffect(() => {
    fetchTaxonomy().then(data => setTaxonomy(data.sort((a, b) => a.comName.localeCompare(b.comName))))
  }, [])

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
                                                  daysBack, setDaysBack,
                                                  taxonomy, setTaxonomy,
                                                  currentSpecies, setCurrentSpecies,
                                                  loading, setLoading,
                                                  filteredObservations, setFilteredObservations,
                                                  viewType, setViewType,
                                                  filtersOpen, setFiltersOpen,
                                                  lastSearch}}>
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
            <Route path="/nearby/:id?" element={
                <main>
                  <NearbyView />
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
