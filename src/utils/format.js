// Helper functions to format data for display in the UI
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

// Shorten long location names so they fit on a list card
export const formatLocation = (origLocationString) => {
    if (origLocationString.length > 70){
        return origLocationString.slice(0,70).concat("...")
    }
    return origLocationString
}