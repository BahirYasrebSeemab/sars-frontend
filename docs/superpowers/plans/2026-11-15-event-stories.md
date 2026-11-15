# Event Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each event tells its story through 3-6 pinned places with photos, an account of what happened and the radar reading at that spot.

**Architecture:** A hand-written `story.json` beside each `event.json`; the API validates it, computes a radar reading per point from the event's own arrays and serves it inside the event. The frontend draws lettered pins and an optional path, and shows a story panel first in the sidebar.

**Tech Stack:** FastAPI + pydantic + numpy (backend, pytest); React 19 + react-leaflet + Tailwind (frontend, `tsc -b`, Playwright smoke test).

**Spec:** `docs/superpowers/specs/2026-11-15-event-stories-design.md`

## Global Constraints

- Machine has ~1.8 GB memory: run pytest and tsc under `systemd-run --user --scope -p MemoryMax=600M`; never two heavy jobs at once.
- Photos only from free-licence sources (NASA/USGS public domain, Wikimedia Commons, UN agencies), each with `credit`, `licence`, `source_url`. No copied news photos.
- Every story fact has a source; conflicting figures are a range.
- A point with no radar signal says so and why. Never imply a signal.
- English only. Commits end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## Review Focus

1. `story.json` malformed or missing a required field: the event must fail loudly at load with the file named, not serve a half story.
2. Story point outside the analysed box or in radar shadow: reading is `covered: false`, card says "no radar here".
3. Photo file named in the story but absent on disk: load error naming the file.
4. Event with no `story.json`: loads exactly as before; frontend shows no story panel or pins.
5. Phone width (360 px): story card and Prev/Next stay usable; pins tappable.

---

### Task 1: Story schema, loading and radar reading (backend)

**Files:**
- Modify: `sars-backend/app/modules/events/schemas.py`, `sars-backend/app/modules/events/service.py`
- Create: `sars-backend/app/modules/events/story.py`
- Test: `sars-backend/tests/test_story.py`

**Interfaces:**
- Produces (schemas): `StoryPhoto{file, caption, credit, licence, source_url}`, `StorySource{label, url}`, `StoryPath{label, points: list[tuple[float, float]]}`, `PointRadar{covered: bool, pre_db, post_db, delta_db: float|None, flag: str|None, changed_pct_300m: float|None}`, `StoryPoint{id, title, lat, lon, zoom: float = 13, what_happened, photos = [], sources = [], radar: PointRadar|None}`, `Story{summary, path: StoryPath|None, points}`; `Event.story: Story | None = None`.
- Produces (story.py): `load_story(folder: Path, event: Event) -> Story | None`; `RADIUS_M = 300`.

- [ ] Write failing tests in `tests/test_story.py` (use the synthetic scene written to `tmp_path` as `test_probe_reads_the_flooded_pixel` does):
  - `test_event_without_story_loads_with_story_none`
  - `test_story_is_attached_and_photo_urls_point_at_files`: photo `file` `photos/a.jpg` becomes `/files/events/<id>/photos/a.jpg`
  - `test_point_radar_matches_probe`: `radar.pre_db/post_db/flag` equal `service.probe` at the same lat/lon
  - `test_changed_pct_300m_is_high_inside_the_flood_and_zero_far_from_it`
  - `test_point_outside_the_box_is_not_covered`: `radar.covered is False`, dB fields None
  - `test_malformed_story_raises_with_the_file_name`
  - `test_missing_photo_file_raises_with_the_file_name`
- [ ] Run: `pytest tests/test_story.py -q` → fails (module missing).
- [ ] Implement. `changed_pct_300m`: share of pixels with `flags` in (1, 2, 3) among finite pixels within `RADIUS_M` of the point on the display grid (cell size from bounds, cos-lat corrected). `service._load` calls `load_story`.
- [ ] Run full `pytest -q` and `ruff check`, `ruff format --check` → clean.
- [ ] Commit `feat: serve a hand-written story with a radar reading at each point`.

### Task 2: Rasuwa story content

**Files:**
- Create: `sars-backend/data/events/rasuwa-debris-flow/story.json`, `.../photos/*`

- [ ] Research coordinates and facts for: the collapse source, Lende Khola confluence at Rasuwagadhi/Miteri bridge, Timure, Syabrubesi; and the river path between them. Sources: USGS, ICIMOD, UNDP, Eos Landslide Blog.
- [ ] Search Wikimedia Commons / USGS / UN for free-licence photos; download only those with a clear licence; record credit and licence.
- [ ] Write `story.json`; load the event through the API and read each point's `radar`.
- [ ] Commit `feat: story of the Rasuwa debris flow`.

### Task 3: Story on the map and in the panel (frontend)

**Files:**
- Modify: `src/lib/api.ts`, `src/components/change-map.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src/lib/story.ts`, `src/components/story-panel.tsx`

**Interfaces:**
- Consumes: `SarEvent.story` as in Task 1.
- Produces: `radarSentence(point: StoryPoint, event: SarEvent): string` in `lib/story.ts`; `<StoryPanel story event index onIndex onShowPhotoMap />`; `ChangeMap` props `story?: Story`, `storyIndex: number | null`, `onStoryPoint: (i: number) => void`.

- [ ] `radarSentence` cases: not covered → "The radar could not see this spot…"; `changed_pct_300m < 1` → "…shows no clear change within 300 m…" plus the reason hint by hazard; otherwise the share changed and what the dominant class means (reuse `readsAs`).
- [ ] Pins: lettered A, B, C (`divIcon`, class `story-pin`), selected one highlighted; path as dashed polyline in the `areas` pane.
- [ ] Panel: summary, "n of N", Prev/Next, photo with credit + licence link, what happened, radar sentence, sources, "Show satellite photos" button (sets basemap to `hls`).
- [ ] Selecting a point flies the map to it (`flyTo([lat, lon], zoom)` with the sidebar padding used by `onRegion`); new event resets the index to null (overview).
- [ ] `tsc -b` clean; extend `e2e/smoke.py`: open Rasuwa, click Next, assert the card title changes and a `.story-pin` exists; run it with bundled Chromium.
- [ ] Commit `feat: story pins, path and story panel`.

### Task 4: Show Rasuwa to the user, then the other stories

- [ ] Push both repos; give the link; wait for feedback on the format.
- [ ] Then one commit per event: Langtang Lirung, Meghna, Thunder Bay, Flores, Vakhsh (Task 2 steps each).
