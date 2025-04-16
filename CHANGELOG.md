# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2024-04-16

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

## [1.0.0] - 2024-02-28

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