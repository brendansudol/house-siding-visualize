# Westover color studio

An interactive Three.js exterior paint studio based on the four supplied photos of 41 Westover Drive. The site has no server-side application dependencies or build step; the Three.js 0.180.0 modules are vendored with their MIT license.

Run locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173/. Source lives in `dist/`: `house.js` builds the approximate geometry; `app.js` manages paint controls, presets, browser-local saved looks and PNG exports; `style.css` contains responsive styling. User reference photos are resized copies under `dist/photos/`.

The GitHub Pages site and this repository are public, including the reference photos. The original Sites deployment remains private. Local storage remains local to each browser and origin, so saved looks are not transferred between the two URLs. The only external runtime request is optional Google Fonts; system fonts provide a fallback. No map or location services are used.

## Model assumptions

Photo-derived approximation, not measured geometry. Main front gable, left porch, side cross gable, window rhythm, roof, trim, chimney, rear posts and exposed basement are represented. Hidden roof intersections, unobserved window placements, overall dimensions and landscape are inferred. Lighting presets are illustrative and not a geolocated sun simulation. The body uses profiled lap siding, and the gables use staggered shingle courses. Gables always match the lap siding color, including when restoring a previously saved look. The 145 paint swatches use Sherwin-Williams’ published digital values from its exterior house, accent, and front-door collections, filtered to active colors marked for exterior use. Names, SW numbers, and source links are stored in `dist/paint-colors.js`; these are digital representations, not calibrated renderings. Verify choices with physical paint samples.

The window schedule is in `dist/window-layout.js`, with photo references on observed openings and `inferred: true` on unphotographed ones. It distinguishes joined banks from separately cased windows: two front upstairs pairs, a triple beside the porch on the left wall, and two separate upper windows over five small windows on the downhill elevation. Window dimensions remain estimates; the model uses recessed one-over-one sashes and a separate fixed lower rear opening.

## Agent tools

When the browser supports `document.modelContext`, `get_house_palette` and `set_house_palette` expose the same paint state and rendering path as the interface. Unsupported browsers operate normally without them.

## GitHub Pages

The site is published at https://brendansudol.github.io/house-siding-visualize/.

The `Deploy to GitHub Pages` workflow publishes `dist/` when that folder or the workflow changes on `main`. It can also be run manually from GitHub Actions. Repository **Settings → Pages → Source** must be set to **GitHub Actions**. The app uses relative asset paths so it works under the repository subpath without a build step.

## Refresh the paint palette

Run `python3 scripts/update-sw-palette.py` to fetch current data from Sherwin-Williams’ public exterior collections and regenerate `dist/paint-colors.js`. This is a maintenance step only; the website uses the checked-in data without external API requests.
