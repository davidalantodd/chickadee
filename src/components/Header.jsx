import chickadee from '../assets/chickadee.png'
import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { useLocation } from 'react-router-dom'

function Header() {
    const { viewType, setViewType } = useContext(ObservationsContext)
    const location = useLocation()
    
    // Only show toggle on observation routes, not on homepage
    const showViewToggle = location.pathname !== '/'

    return (
        <nav id="header">
            <a href="/" className="header-logo">
                <img className="chickadee-icon" src={chickadee}/>
                <h1 className="title">chickadee</h1>
            </a>
            <div className="spacer"></div>
            
            {showViewToggle && (
                <div className="view-toggle-container">
                    <button 
                        className={`view-toggle-btn ${viewType === 'list' ? 'active' : ''}`} 
                        onClick={() => setViewType('list')}
                        title={viewType === 'list' ? 'Currently in List View' : 'Switch to List View'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-list-ul" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                        </svg>
                    </button>
                    <span className="view-toggle-divider">|</span>
                    <button 
                        className={`view-toggle-btn ${viewType === 'map' ? 'active' : ''}`} 
                        onClick={() => setViewType('map')}
                        title={viewType === 'map' ? 'Currently in Map View' : 'Switch to Map View'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-map" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z"/>
                        </svg>
                    </button>
                </div>
            )}
        </nav>
    )
}

export default Header