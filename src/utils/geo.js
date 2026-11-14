// Location helpers for the Near me page

// eBird allows up to 50 km; the server accepts only these distances so cached responses get reused
export const DISTANCES_KM = [5, 10, 25, 50]
export const DEFAULT_DISTANCE_KM = 5

// About 1 km of precision: enough to find nearby birds, and the most that ever leaves the browser
export const roundCoordinate = (value) => Math.round(value * 100) / 100

// Straight-line distance in km between two points (haversine)
export const distanceKm = (lat1, lng1, lat2, lng2) => {
    const toRadians = (degrees) => degrees * Math.PI / 180
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// "800 m away", "3.2 km away", "18 km away"
export const formatDistance = (km) => {
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m away`
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`
}

// The visitor's position, rounded, as { lat, lng }. Rejects with the GeolocationPositionError on failure.
export const getRoundedPosition = () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: roundCoordinate(coords.latitude), lng: roundCoordinate(coords.longitude) }),
        reject,
        // A position up to 10 minutes old is fine for finding birds, and avoids a fresh GPS fix on every visit
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 }
    )
})

// 'granted', 'prompt', 'denied', or 'unknown' when the browser can't say
export const locationPermission = async () => {
    try {
        return (await navigator.permissions.query({ name: 'geolocation' })).state
    } catch {
        return 'unknown'
    }
}
