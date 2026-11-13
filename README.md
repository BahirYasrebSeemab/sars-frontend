# SAR Change Watch: NISAR change detection (map)

NASA Space Apps Challenge 2026, "Dancing with the SARs". A full-screen map that shows what
changed between two NISAR L-band radar passes: floods, burns and other surface change, with a
before/after swipe, change classes, numbered areas of concentrated change and dated NASA photos.
The processing pipeline, the method and the data are in
[sars-backend](https://github.com/yusof-shkn/sars-backend).

## Run
Start the backend first (see its README), then:

    bun install
    bun run start            # http://localhost:5173; API at VITE_API_URL, default http://localhost:8000

## What is on the page
- Left sidebar: a searchable event list, the measured change per class, the numbered areas
  (searchable by number or by darker / growth / double bounce), the change histogram, how to read
  the radar, and the data provenance (granules, release maturity, orbit data).
- Map: before date left of the divider, after date right of it. Switches for the change classes,
  the numbered areas, the 500 m landscape layer and the HH/HV colour view; radar opacity; gray,
  satellite, street and dated NASA photo basemaps. Click anywhere to read that pixel.

## Checks
Run against the dev servers (backend on 8000, this app on 5173 or the port Vite prints):

    uv run --with playwright python -I e2e/smoke.py     # every map action, phone layout
    uv run --with playwright python -I e2e/areas.py     # numbered areas and the swipe, as shown
    uv run --with playwright python -I e2e/offline.py   # NASA photos with NASA's servers blocked

Stack: React 19, Vite, Tailwind CSS 4, Leaflet (react-leaflet), Base UI.
