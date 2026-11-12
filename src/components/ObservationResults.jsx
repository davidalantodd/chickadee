/* eslint-disable react/prop-types */
import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import ObservationList from './ObservationList'
import ObservationMap from './ObservationMap'
import LoadingMessage from './LoadingMessage'

// The list or map of loaded observations, shared by both pages. `dataKey` is the page's current query (see
// useObservationLoader): observations loaded for a different query, such as the other page's, show as loading.
// `searchArea` ({ lat, lng, radiusKm }) draws the Near me search radius on the map.
export default function ObservationResults({ dataKey, emptyMessage, searchArea }) {
    const { observations, loading, viewType } = useContext(ObservationsContext)

    if (loading || observations.key !== dataKey) return <LoadingMessage text="loading birds..."/>
    return viewType === 'map'
        ? <ObservationMap searchArea={searchArea}/>
        : <ObservationList emptyMessage={emptyMessage}/>
}
