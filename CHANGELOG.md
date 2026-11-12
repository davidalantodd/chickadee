# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2026-11-11

### Added
- Near me tab: recent bird sightings within 5, 10, 25 or 50 km of you, with the same species, notable, search, list and map options as Explore
- Each nearby sighting shows how far away it is, and the map shows your search radius
- The species dropdown on Near me lists only species reported nearby
- Explore / Near me tabs in the header, and a "Birds near me" button on the splash page

### Changed
- Location is requested only after a short explanation, rounded to about 1 km before it leaves your browser, and never saved or put in shared links; a shared Near me link shows birds near whoever opens it
- Explore and Near me share the same filters, list, map and details popup, and both server functions share the same handling of private locations, town names, photos and caching

### Fixed
- Species whose common name matches an unrelated Wikipedia article now show the right photo and link, e.g. Redhead (was red hair), Mao (was Mao Zedong), Merlin, Rook and Wild Turkey; 65 species corrected in all
- Species with no confirmed Wikipedia article link to a search for their scientific name instead of a wrong page

## [2.1.0] - 2026-11-11

### Changed
- Observation popup redesigned: a full-screen sheet with a pinned title and close button on phones, and photo beside the details on wide screens, so it fits without scrolling in most cases
- The species photo is shown whole instead of cropped, with smaller copies loaded on smaller screens
- Popup links are now labelled buttons ("View full checklist on eBird", "Read about this bird on Wikipedia") marked as opening in a new tab
- The popup map keeps its zoom buttons but can no longer be dragged, so swiping over it scrolls the popup
- Back-to-top button restyled in the site's brown and enlarged to an easier 44px target
- Dropdowns, the search box and the splash button use slightly rounded corners instead of pill shapes; filter and popup labels are sentence case

### Fixed
- Map zoom buttons no longer draw over open filter dropdowns
- The hidden back-to-top button no longer catches clicks at the bottom of the page
- Removed leftover starter-template styles that gave buttons a gray background

## [2.0.0] - 2026-11-09

### Added
- Worldwide regions: browse any country, then its regions and sub-regions
- Type-to-filter in the country, region and species dropdowns
- Species dropdown limited to species seen in the selected area, with a switch to include every species ever recorded there
- Observation details open in a popup over the list or map instead of a separate page
- Shareable URLs: filters, search, list/map view and open observations are kept in the URL
- Species photos as thumbnails in the list and map popups, and larger in the details popup
- Nearest town and state on every observation (e.g. "near Blacksburg, Virginia"), worldwide
- "View checklist on eBird" link for observations at public hotspots
- Clear filters button
- Scripts to rebuild the bundled town data (GeoNames) and species photo data (Wikipedia)
- CDN caching for all Netlify functions
- Data attribution for eBird, GeoNames, Wikimedia Commons and OpenStreetMap

### Changed
- **Breaking:** the eBird API key environment variable is now `EBIRD_API_KEY` (was `VITE_EBIRD_API_KEY`) and is only read by Netlify functions
- Filter bar reorganised into Location and Species groups with pill-style dropdowns and a "Notable only" toggle
- Splash page redesigned: fills the screen between header and footer, with a headline, description and button beside the bird
- Species photos come from a prebuilt list, so browsing makes no Wikipedia API calls; images use Wikimedia's standard thumbnail sizes instead of full-size originals
- Splash photo reduced from 2.9 MB to 213–571 KB, served by screen size
- Netlify functions use ESM exports
- README rewritten with new features, setup for the bundled data, and new screenshots

### Fixed
- Footer stays at the bottom of short pages
- Map markers use local icons in production
- Location names containing "&" no longer break observation links
- Location names in map popups are escaped
- Wikipedia image requests send a User-Agent header and handle errors

### Security
- Private locations (yards, home addresses) are hidden before data reaches the browser: coordinates are rounded to about 1 km, names are shown as "Private location", and checklist and location IDs are removed

## [1.1.0] - 2025-04-16

### Added
- Add Leaflet map to single observation view with location marker
- Implement loading state for Wikipedia images
- Update back button with Bootstrap icon
- Add lazy loading for images
- Add error handling for image loading
- Add smooth transitions for image loading states
- Add view toggle between list and map views
- Add marker clustering for improved map performance
- Add progressive loading for large datasets
- Add interactive observation markers on map
- Add infinite scroll to observations component
- Add ScrollToTopButton component with smooth scroll
- Add debouncing to filter features
- Add virtualization for SpeciesDropdown using react-window

### Changed
- Optimize image loading performance
- Improve user experience with loading indicators
- Update back button styling and behavior
- Move fetchObservationsByRegion to api.js utility
- Optimize map rendering with key-based refresh and memoization
- Standardize filter bar typography and spacing
- Enhance mobile responsiveness and landing page layout
- Update landing page image positioning and button style

### Fixed
- Fix scroll position when navigating to single observation view
- Fix image loading error handling
- Fix hamburger menu link to point to /observations view
- Fix direct access to /observations endpoint
- Fix loading component height spacing

## [1.0.0] - 2025-02-28

### Added
- Initial release of Chickadee
- Add observation list view with filtering capabilities
- Add single observation view with detailed information
- Add Wikipedia image integration
- Add location formatting and display
- Add date formatting and display
- Add navigation between views
- Add responsive design for mobile and desktop
- Add dark mode support
- Add loading states and error handling
- Add accessibility features
- Add unit tests
- Add documentation
- Add CI/CD pipeline
- Add deployment configuration
- Add license and contribution guidelines

**Key Features:**

* **Regional Observation Filtering:**
    * Users can filter bird observations by region and subregion (e.g., US states).
    * The application defaults to displaying observations within the US region.
* **Species Filtering:**
    * A dropdown menu allows users to filter observations by specific bird species.
    * The species list is dynamically fetched from taxonomy data.
* **Notable Observation Filtering:**
    * Users can toggle a switch to view only notable bird observations.
* **Detailed Observation View:**
    * Clicking on an observation card displays a detailed view, including a link to the corresponding Wikipedia page.
* **Responsive Design:**
    * The application features a responsive design for optimal viewing on various devices, including mobile.
* **Landing Page:**
    * A landing page has been created with a sample image and information about the application.
    * The landing page includes updated styling and screenshots.
* **Data Presentation:**
    * Observations are presented in a user-friendly card format, with alternating card shading for improved readability.
    * The date in the observations table is formatted for clarity.
* **Loading and Error Handling:**
    * A loading animation is displayed during data fetching.
    * An appropriate message is shown when no observations are found.
    * Error handling has been implemented for API fetches.
* **Performance Optimizations:**
    * Redundant API fetches have been removed.
    * useEffect hooks have been optimized to prevent repeated data fetching.
    * Fetch functions have been extracted to utility files.
* **Netlify Deployment:**
    * The application is deployed on Netlify.
    * API keys are securely handled using Netlify Functions.
    * The README instructions have been updated to use the `netlify dev` command.
* **Header and Footer:**
    * A header and footer have been added for consistent navigation.

**Technical Improvements:**

* Refactored the `ObservationView` component to use separate dropdown components.
* Implemented context to manage application state.
* API key security improved.
* Taxonomy data refinement.

**Initial Setup:**

* See the README file for detailed setup instructions.