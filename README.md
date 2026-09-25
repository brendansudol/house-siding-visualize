# Westover color studio

An interactive Three.js exterior paint studio based on the four supplied photos of 41 Westover Drive. The site has no server-side application dependencies or build step; the Three.js 0.180.0 modules are vendored with their MIT license.

Run locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173/. Source lives in `dist/`: `house.js` builds the approximate geometry; `app.js` manages paint controls, presets, browser-local saved looks and PNG exports; `style.css` contains responsive styling. User reference photos are resized copies under `dist/photos/`.

The GitHub Pages site and this repository are public, including the reference photos. The original Sites deployment remains private. Local storage remains local to each browser and origin, so saved looks are not transferred between the two URLs. The only external runtime request is optional Google Fonts; system fonts provide a fallback. No map or location services are used.

## Model assumptions

Photo-derived approximation, not measured geometry. Main front gable, left porch, side cross gable, window rhythm, roof, trim, chimney, rear posts and exposed basement are represented. Hidden roof intersections, unobserved window placements, overall dimensions and landscape are inferred. Lighting presets are illustrative and not a geolocated sun simulation. Swatches are descriptive digital colors, not manufacturer matches. Verify choices with physical paint samples.

## Agent tools

When the browser supports `document.modelContext`, `get_house_palette` and `set_house_palette` expose the same paint state and rendering path as the interface. Unsupported browsers operate normally without them.

## GitHub Pages

The site is published at https://brendansudol.github.io/house-siding-visualize/.

The `Deploy to GitHub Pages` workflow publishes `dist/` when that folder or the workflow changes on `main`. It can also be run manually from GitHub Actions. Repository **Settings → Pages → Source** must be set to **GitHub Actions**. The app uses relative asset paths so it works under the repository subpath without a build step.
