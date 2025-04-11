import chickadee from '../assets/chickadee.png'
import { Dropdown } from 'react-bootstrap'
import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'

function Header() {
    const { setViewType } = useContext(ObservationsContext)

    return (
        <nav id="header">
            <a href="/" className="header-logo">
                <img className="chickadee-icon" src={chickadee}/>
                <h1 className="title">chickadee</h1>
            </a>
            <div className="spacer"></div>
            <Dropdown>
                <Dropdown.Toggle className="menu-dropdown" variant="nooutline" show="false">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-list menu-icon" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                    </svg>
                </Dropdown.Toggle>
                <></>
                <Dropdown.Menu variant="nooutline">
                    <Dropdown.Item onClick={() => setViewType('list')}>List View</Dropdown.Item>
                    <Dropdown.Item onClick={() => setViewType('map')}>Map View</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </nav>
    )
}

export default Header