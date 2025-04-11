import { useContext, useEffect, useMemo } from "react";
import { ObservationsContext } from "../contexts/ObservationsContext";
import { fetchObservationsByRegion } from "../utils/api";
import { useNavigate } from "react-router-dom";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// eslint-disable-next-line react/prop-types
function ObservationMap() {
	const { currentRegion, currentSubRegion, 
		notable, currentSpecies, setObservations, 
		setLoading, filteredObservations } = useContext(ObservationsContext);
	const navigate = useNavigate();

	// Function to navigate to the SingleObservationView
	const handleSingleObsView = (observation) => {
		navigate(`/observations/${observation.subId}?code=${observation.speciesCode}&commonName=${observation.comName}&location=${observation.locName}&date=${observation.obsDt}`);
	};

	// Fetch observations whenever relevant filters or regions change
	useEffect(() => {
		fetchObservationsByRegion(currentRegion, currentSubRegion, notable, currentSpecies, setObservations, setLoading);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentRegion, currentSubRegion, notable, currentSpecies]);

	// Memoize markers to avoid recreating them on every render
	const markers = useMemo(() => {
		return filteredObservations.obs.map((observation) => (
			observation.lat && observation.lng ? (
				<Marker 
					key={observation.subId} 
					position={[observation.lat, observation.lng]}
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
	}, [filteredObservations.obs, navigate, handleSingleObsView]);

	return (
		<MapContainer
			key={`map-${currentRegion.code}-${currentSubRegion.code}-${notable}-${currentSpecies.speciesCode}-${filteredObservations.obs.length}`}
			center={[39.8283, -98.5795]}
			zoom={4}
			scrollWheelZoom={true}
			id="map"
		>
			<TileLayer
				attribution="Tiles &copy; Esri &mdash; USGS Topo via ESRI &mdash; Source: USGS, National Geographic, DeLorme, NAVTEQ"
				url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
			/>
			{markers}
		</MapContainer>
	);
}

export default ObservationMap;