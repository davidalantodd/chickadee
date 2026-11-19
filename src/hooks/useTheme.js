import { useEffect, useState } from 'react'

// Light or dark theme. Follows the browser's setting until the visitor picks one with the header button; their pick
// is remembered in localStorage. Picking the theme the browser already asks for goes back to following the browser,
// so a later change to the system setting applies again.
// index.html sets the theme before the page draws, so dark mode doesn't flash light on load. Keep the two in step.
const STORAGE_KEY = 'theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const readStoredTheme = () => {
    try {
        const theme = localStorage.getItem(STORAGE_KEY)
        return theme === 'light' || theme === 'dark' ? theme : null
    } catch {
        return null
    }
}

const storeTheme = (theme) => {
    try {
        if (theme) localStorage.setItem(STORAGE_KEY, theme)
        else localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Storage blocked (e.g. some private windows): the pick lasts until the page closes
    }
}

export function useTheme() {
    const [picked, setPicked] = useState(readStoredTheme)
    const [system, setSystem] = useState(() => darkQuery().matches ? 'dark' : 'light')

    useEffect(() => {
        const query = darkQuery()
        const onChange = (event) => setSystem(event.matches ? 'dark' : 'light')
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])

    const theme = picked ?? system

    // Bootstrap themes its components from this attribute, and index.css themes the rest
    useEffect(() => { document.documentElement.setAttribute('data-bs-theme', theme) }, [theme])

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        const nextPick = next === system ? null : next
        storeTheme(nextPick)
        setPicked(nextPick)
    }

    return { theme, toggleTheme }
}
