/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useState, useRef } from "react";
import { ObservationsContext } from "../contexts/ObservationsContext";
import { useOpenObservation } from "../hooks/useOpenObservation";
import { formatDate } from "../utils/format";

import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap } from "react-leaflet";
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

// Location names are free text from eBird users, so escape them before building popup HTML
const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => (
	{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));

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
						${observation.photo ? `<img class="map-popup-photo" src="${escapeHtml(observation.photo.popup)}" alt="" title="${escapeHtml(observation.photo.credit)}" width="160" height="120" />` : ''}
						<strong>${escapeHtml(observation.comName)}</strong><br />
						Location: ${escapeHtml(observation.locName)}<br />
						${observation.area ? `Area: near ${escapeHtml(observation.area)}<br />` : ''}
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

// Fits the map to the search radius when there is one, otherwise to the observations as they load
// eslint-disable-next-line react/prop-types
function MapBoundsUpdater({ observations, searchArea }) {
	const map = useMap();
	
	useEffect(() => {
		if (searchArea) {
			map.fitBounds(L.latLng(searchArea.lat, searchArea.lng).toBounds(searchArea.radiusKm * 2000), { padding: [20, 20] });
			return;
		}
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
	}, [observations, searchArea, map]);
	
	return null;
}

// The loaded (and searched) observations as clustered markers. `searchArea` ({ lat, lng, radiusKm }) draws the
// Near me search radius and the visitor's approximate position.
// eslint-disable-next-line react/prop-types
function ObservationMap({ searchArea }) {
	const { observations, filteredObservations } = useContext(ObservationsContext);
	// Stable identity: MarkerClusterGroup rebuilds every marker when its onMarkerClick prop changes
	const handleSingleObsView = useOpenObservation();
	const [isMapReady, setIsMapReady] = useState(false);
	const [visibleObservations, setVisibleObservations] = useState([]);
	
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
				key={`map-${observations.key}`}
				center={searchArea ? [searchArea.lat, searchArea.lng] : [39.8283, -98.5795]} // Default center (US)
				zoom={searchArea ? 10 : 4}
				scrollWheelZoom={true}
				id="map"
				whenReady={() => setIsMapReady(true)}
				preferCanvas={true}
			>
				<TileLayer
					attribution="Tiles &copy; Esri &mdash; USGS Topo via ESRI &mdash; Source: USGS, National Geographic, DeLorme, NAVTEQ"
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
				/>
				{searchArea && (
					<>
						<Circle
							center={[searchArea.lat, searchArea.lng]}
							radius={searchArea.radiusKm * 1000}
							pathOptions={{ color: '#B4905D', weight: 2, fillOpacity: 0.06 }}
							interactive={false}
						/>
						<CircleMarker
							center={[searchArea.lat, searchArea.lng]}
							radius={7}
							pathOptions={{ color: 'white', weight: 2, fillColor: '#4b3621', fillOpacity: 1 }}
							interactive={false}
						/>
					</>
				)}
				<MarkerClusterGroup markers={markers} onMarkerClick={handleSingleObsView} />
				<MapBoundsUpdater observations={visibleObservations} searchArea={searchArea} />
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