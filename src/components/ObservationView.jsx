import Observations from './Observations'
import { useEffect, useContext } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
const myHeaders = new Headers();
myHeaders.append("X-eBirdApiToken", import.meta.env.VITE_EBIRD_API_KEY);
const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
};

function ObservationView() {
    const {regionsInUS, setRegionsInUS,
        currentRegion, setCurrentRegion,
        subRegions, setSubRegions,
        currentSubRegion, setCurrentSubRegion,
        notable, setNotable,
        taxonomy, setTaxonomy,
        currentSpecies, setCurrentSpecies} = useContext(ObservationsContext);

    const fetchRegionsInUS = () => {
        fetch(eBirdBaseAPIURL + 'ref/region/list/subnational1/US', requestOptions)
        .then(response => response.json())
        .then(data =>
            setRegionsInUS(data)
        )
    }

    const fetchSubRegions = () => {
        fetch(eBirdBaseAPIURL + `ref/region/list/subnational2/${currentRegion.code}`, requestOptions)
        .then(response => response.json())
        .then(data => {setSubRegions(data)});
    }

    const fetchTaxonomy = () => {
        fetch(eBirdBaseAPIURL + `ref/taxonomy/ebird?fmt=json`, requestOptions)
        .then(response => response.json())
        .then(data => {
            data.sort((a,b) => a.comName.localeCompare(b.comName))
            setTaxonomy(data)
        });
    }

    const handleRegionSelect = (region) => {
        setCurrentRegion(region) 
        setCurrentSubRegion({code:'',name:''})
    } 

    useEffect(() => {
        fetchRegionsInUS();
        fetchSubRegions();
        fetchTaxonomy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion]);

    return (
        <>
            <section className="filter-bar">
                <h5>Filter by Region</h5>
                <Dropdown className='region-dropdown'>
                    <Dropdown.Toggle variant="primary" id="dropdown-basic">
                        {currentRegion.name !== 'United States' ? currentRegion.name : 'Select State'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className='region-dropdown-menu'>
                        <Dropdown.Item key={'default'} onClick={()=>setCurrentRegion({code:'US',name:'United States'})}>Clear Selection</Dropdown.Item>
                        {regionsInUS.map((region) => (
                            <Dropdown.Item key={region.code} onClick={()=>handleRegionSelect(region)}>{region.name}</Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown className='region-dropdown'>
                    <Dropdown.Toggle variant="primary" id="dropdown-basic">
                        {currentSubRegion.name ? currentSubRegion.name : 'Select Sub-Region'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className='region-dropdown-menu'>
                        <Dropdown.Item key={'default'} onClick={()=>setCurrentSubRegion({code:'',name:''})}>Clear Selection</Dropdown.Item>
                        {subRegions.map((region) => (
                            <Dropdown.Item key={region.code} onClick={()=>setCurrentSubRegion(region)}>{region.name}</Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown className='species-dropdown'>
                    <Dropdown.Toggle variant="primary" id="dropdown-basic">
                        {!currentSpecies ? 'Select Species' : currentSpecies.comName}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className='species-dropdown-menu'>
                        <Dropdown.Item key={'default'} onClick={()=>setCurrentSpecies('')}>Clear Selection</Dropdown.Item>
                        {taxonomy.map((species) => (
                            <Dropdown.Item key={species.speciesCode} onClick={()=>setCurrentSpecies(species)}>{species.comName}</Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
                <Form className='notable-switch'>
                    <Form.Check
                        type="switch"
                        id="custom-switch"
                        label="Notable Observations"
                        checked={notable}
                        onChange={() => setNotable(!notable)}
                    />
                </Form>
            </section>
            <Observations className="observations-component"/>
        </>
    )
}


export default ObservationView