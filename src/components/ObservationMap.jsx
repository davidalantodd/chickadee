/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useState, useRef } from "react";
import { ObservationsContext } from "../contexts/ObservationsContext";
import { fetchObservationsByRegion } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils/format";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Import marker icons
import markerIcon from '../assets/markers/marker-icon.png';
import markerIconRetina from '../assets/markers/marker-icon-2x.png';
import markerShadow from '../assets/markers/marker-shadow.png';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIconRetina,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

// Add marker clustering support
// eslint-disable-next-line react/prop-types
const MarkerClusterGroup = (props) => {
	const map = useMap();
	const mcgRef = useRef();

	useEffect(() => {
		mcgRef.current = L.markerClusterGroup({
			chunkedLoading: true,
			spiderfyOnMaxZoom: true,
			disableClusteringAtZoom: 12,
			maxClusterRadius: 50
		});
		map.addLayer(mcgRef.current);

		return () => {
			map.removeLayer(mcgRef.current);
		};
	}, [map]);

	useEffect(() => {
		mcgRef.current.clearLayers();
		if (props.markers && props.markers.length > 0) {
			const markerElements = props.markers.filter(Boolean); // Filter out null markers
			markerElements.forEach((marker) => {
				const latLng = marker.props.position;
				const observation = marker.props.obsData;
				
				// Create popup content as HTML
				const popupContent = `
					<div class="map-popup" style="cursor:pointer" data-obs-id="${observation.subId}">
						<strong>${observation.comName}</strong><br />
						Location: ${observation.locName}<br />
						Date: ${formatDate(observation.obsDt)}<br />
						<span class="popup-click-text">(Click for details)</span>
					</div>
				`;
				
				const leafletMarker = L.marker(latLng).bindPopup(popupContent);
				
				// Add click handler to the popup content after it's opened
				leafletMarker.on('popupopen', (e) => {
					// Find the popup container
					const container = e.popup._container;
					if (container) {
						// Find the popup content div inside the container
						const popupDiv = container.querySelector(`[data-obs-id="${observation.subId}"]`);
						if (popupDiv) {
							// Add click handler to the popup
							popupDiv.addEventListener('click', () => {
								props.onMarkerClick(observation);
							});
						}
					}
				});
				
				mcgRef.current.addLayer(leafletMarker);
			});
		}
	}, [props.markers, props.onMarkerClick]);

	return null;
};

// This component accesses the map instance and fits bounds when observations change
// eslint-disable-next-line react/prop-types
function MapBoundsUpdater({ observations }) {
	const map = useMap();
	
	useEffect(() => {
		if (observations.length > 0) {
			// Filter out observations without lat/lng
			const validObservations = observations.filter(obs => obs.lat && obs.lng);
			
			if (validObservations.length > 0) {
				// Create bounds from all marker positions
				const bounds = validObservations.reduce((bounds, obs) => {
					return bounds.extend([obs.lat, obs.lng]);
				}, L.latLngBounds([validObservations[0].lat, validObservations[0].lng]));
				
				// Add some padding around the bounds
				map.fitBounds(bounds, {
					padding: [50, 50],
					maxZoom: 10
				});
			}
		}
	}, [observations, map]);
	
	return null;
}

// eslint-disable-next-line react/prop-types
function ObservationMap() {
	const { currentRegion, currentSubRegion, 
		notable, currentSpecies, setObservations, 
		setLoading, filteredObservations } = useContext(ObservationsContext);
	const navigate = useNavigate();
	const [isMapReady, setIsMapReady] = useState(false);
	const [visibleObservations, setVisibleObservations] = useState([]);
	
	// Function to navigate to the SingleObservationView
	const handleSingleObsView = (observation) => {
		navigate(`/observations/${observation.subId}?code=${observation.speciesCode}&commonName=${observation.comName}&location=${observation.locName}&date=${observation.obsDt}&lat=${observation.lat}&lng=${observation.lng}`);
	};

	// Fetch observations whenever relevant filters or regions change
	useEffect(() => {
		fetchObservationsByRegion(currentRegion, currentSubRegion, notable, currentSpecies, setObservations, setLoading);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentRegion, currentSubRegion, notable, currentSpecies]);

	// Progressive loading of observations
	useEffect(() => {
		if (filteredObservations.obs.length > 0) {
			// Initial batch - load first 100 immediately
			const initialBatch = filteredObservations.obs
				.filter(obs => obs.lat && obs.lng)
				.slice(0, 100);
			
			setVisibleObservations(initialBatch);
			
			// If there are more, load them after a delay
			if (filteredObservations.obs.length > 100) {
				const timer = setTimeout(() => {
					setVisibleObservations(filteredObservations.obs.filter(obs => obs.lat && obs.lng));
				}, 500);
				
				return () => clearTimeout(timer);
			}
		} else {
			setVisibleObservations([]);
		}
	}, [filteredObservations.obs]);

	// Memoize markers to avoid recreating them on every render
	const markers = useMemo(() => {
		return visibleObservations.map((observation) => (
			observation.lat && observation.lng ? (
				<Marker 
					key={observation.subId} 
					position={[observation.lat, observation.lng]}
					obsData={observation}
				>
					<Popup>
						<div className="map-popup" onClick={() => handleSingleObsView(observation)} style={{ cursor: 'pointer' }}>
							<strong>{observation.comName}</strong><br />
							Location: {observation.locName}<br />
							Date: {observation.obsDt}<br />
							<span className="popup-click-text">(Click for details)</span>
						</div>
					</Popup>
				</Marker>
			) : null
		));
	}, [visibleObservations, handleSingleObsView]);

	// Callback for marker clicks in the cluster
	const handleMarkerClick = (observation) => {
		handleSingleObsView(observation);
	};

	return (
		<>
			{!isMapReady && visibleObservations.length > 0 && (
				<div className="map-loading">
					<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
						className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
						<path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
						<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
					</svg>
					<h4>positioning birds on map...</h4>
				</div>
			)}
			<MapContainer
				key={`map-${currentRegion.code}-${currentSubRegion.code}-${notable}-${currentSpecies.speciesCode}`}
				center={[39.8283, -98.5795]} // Default center (US)
				zoom={4}
				scrollWheelZoom={true}
				id="map"
				whenReady={() => setIsMapReady(true)}
				preferCanvas={true}
			>
				<TileLayer
					attribution="Tiles &copy; Esri &mdash; USGS Topo via ESRI &mdash; Source: USGS, National Geographic, DeLorme, NAVTEQ"
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
				/>
				<MarkerClusterGroup markers={markers} onMarkerClick={handleMarkerClick} />
				{/* This component handles map bounds updates */}
				<MapBoundsUpdater observations={visibleObservations} />
			</MapContainer>
			{visibleObservations.length < filteredObservations.obs.length && isMapReady && (
				<div className="map-loading-more">
					<span>{visibleObservations.length} of {filteredObservations.obs.filter(obs => obs.lat && obs.lng).length} birds shown</span>
				</div>
			)}
		</>
	);
}

export default ObservationMap;