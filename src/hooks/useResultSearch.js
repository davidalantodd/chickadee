import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { ObservationsContext } from '../contexts/ObservationsContext'

// The "Search these results" box: narrows the loaded observations by bird name into the shared filtered list.
// Typing is debounced; a newly loaded set of observations is filtered straight away.
export function useResultSearch(initialText = '') {
    const { observations, setFilteredObservations } = useContext(ObservationsContext)
    const [filterText, setFilterText] = useState(initialText)

    const applyFilter = useCallback((loaded, text) => {
        const lowered = text.toLowerCase()
        setFilteredObservations({
            key: loaded.key,
            obs: lowered ? loaded.obs.filter(observation => observation.comName.toLowerCase().includes(lowered)) : loaded.obs,
        })
    }, [setFilteredObservations])

    const debouncedFilter = useMemo(() => debounce(applyFilter, 300), [applyFilter])
    useEffect(() => () => debouncedFilter.cancel(), [debouncedFilter])

    useEffect(() => {
        debouncedFilter.cancel()
        applyFilter(observations, filterText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [observations])

    const setSearch = (text) => {
        setFilterText(text)
        debouncedFilter(observations, text)
    }

    const clearSearch = () => {
        debouncedFilter.cancel()
        setFilterText('')
        applyFilter(observations, '')
    }

    return { filterText, setSearch, clearSearch }
}
