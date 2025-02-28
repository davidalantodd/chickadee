# Changelog

## v1.0.0 - Initial Release

This release marks the initial stable version of chickadee, a web application that allows users to explore bird observations from the eBird API.

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