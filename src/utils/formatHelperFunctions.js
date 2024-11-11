export const formatDate = (originalDateString) => {
    const date = new Date(originalDateString)

    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })

    return formatter.format(date);
}

export const formatLocation = (origLocationString, singleObsView) => {
    const formattedLocation = origLocationString;

    if (singleObsView === -1 && formattedLocation.length > 70){
        return origLocationString.slice(0,70).concat("...")
    }
    return formattedLocation
}