# Event stories: design

Approved in conversation on 2026-11-15. Spans `sars-backend` (story files, API) and
`sars-frontend` (pins, path, story panel).

## Intent

A visitor looking at an event cannot tell where the disaster happened or what the scattered
change colours have to do with it. The radar marks every change alike, the map has no place
names, and some events (a mud flood in a gorge) are thinner than the pixels. Each event should
tell its story: a few real places in order, each with a photo, what happened there, and what the
radar measured at that spot.

## Goals

- 3-6 story points per event, each at real coordinates, in narrative order.
- Pins on the map; an optional drawn path (river the mud followed, fault line).
- Clicking a pin, or Prev/Next in the panel, flies to the point and shows its card.
- Card: photo(s), what happened, what the radar shows there, sources.
- The story is the first thing in the side panel when an event opens.

## Non-goals

- No story editor in the app; stories are hand-written files.
- No translation (English only for now).
- No new radar processing: stories sit on top of existing event data.

## Anti-goals (would make this a failure even if it works)

- Implying a radar signal where there is none. If the radar shows nothing at a point, the card
  says so and why (radar shadow in a gorge, change below the threshold, feature thinner than a pixel).
- Copyrighted news photos copied into the app.
- Facts without a source, or one death toll quoted as certain when sources disagree.

## Constraints

- The processing machine has ~1.8 GB of memory and a slow network; nothing here may need heavy jobs.
- `pipeline run` rewrites `event.json`; stories must survive that.
- Photos must be free to reuse: NASA/USGS (public domain), Wikimedia Commons and UN agencies under
  a free licence, credited. Otherwise link out.

## Approaches considered

1. **Story block inside `event.json`.** Simple to serve, but every reprocess overwrites it. Rejected.
2. **Stories in the frontend source.** No backend change, but splits an event's content across two
   repos and the API no longer describes an event fully. Rejected.
3. **`story.json` beside `event.json`, merged by the API (chosen).** Hand-edited, survives
   reprocessing, one place per event, photos stored next to it and served by the existing
   `/files` mount.

## Design

### Story file: `data/events/<id>/story.json`

```json
{
  "summary": "Two or three plain sentences.",
  "path": { "label": "Path of the debris flow", "points": [[lat, lon], ...] },
  "points": [
    {
      "id": "rasuwagadhi",
      "title": "Rasuwagadhi border crossing",
      "lat": 28.2757, "lon": 85.3783,
      "zoom": 14,
      "what_happened": "Plain account of what happened here.",
      "photos": [
        { "file": "photos/x.jpg", "caption": "...", "credit": "...", "licence": "CC BY-SA 4.0",
          "source_url": "https://..." }
      ],
      "sources": [ { "label": "ICIMOD", "url": "https://..." } ]
    }
  ]
}
```

`path` and `photos` are optional. Photo `file` is relative to the event folder.

### Backend

- `schemas.py`: `Story`, `StoryPoint`, `StoryPhoto`, `StorySource`, `StoryPath`; `Event.story: Story | None`.
- `service._load`: if `story.json` exists, validate and attach it, rewriting photo files to
  `/files/events/<id>/...` URLs. A malformed story is an error at load, not silently dropped.
- Each point gets a `radar` reading computed at load from the event's own arrays (the existing
  probe logic): before dB, after dB, change, class, and the share of pixels flagged as changed
  within 300 m. That is what the card states, so it cannot drift from the data.
- Tests: story is attached; photo URLs rewritten; radar reading matches `probe`; a point outside
  the box or in radar shadow reports "no radar here"; an event without a story still loads.

### Frontend

- `api.ts`: story types.
- `lib/story.ts`: turns a point's radar reading into one honest sentence (changed / unchanged /
  no radar / too small to see).
- `components/story-panel.tsx`: summary, "n of N", Prev/Next, the point card (photo with credit,
  satellite before/after thumbnails from the HLS dates, what happened, what the radar shows,
  sources). Rendered first in the sidebar.
- `components/change-map.tsx`: story pins (lettered A, B, C so they are not confused with the
  numbered areas), the path as a dashed line, both in the unclipped pane.
- `App.tsx`: selected story point state; selecting flies the map to it.
- Satellite before/after: the existing dated HLS basemap, switched on automatically for the
  point view via a "Show satellite photo" button on the card rather than new image files.

### Content

Rasuwa first, as the format test. Then Langtang Lirung, Meghna, Thunder Bay, Flores, Vakhsh.
Each fact in a story carries a source; conflicting figures are given as a range.

## Left to the builder

Visual styling of pins and the card; exact wording of the radar sentences; zoom levels.
