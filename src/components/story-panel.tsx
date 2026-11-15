import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, XIcon } from "lucide-react"
import * as React from "react"

import { formatDate, type SarEvent, type Story, type StoryPoint } from "@/lib/api"
import { radarSentence } from "@/lib/story"
import { cn } from "@/lib/utils"

const navBtn =
  "flex h-10 items-center gap-1.5 rounded-lg px-4 text-[14px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"

/** Web-mercator tile holding a point, for a dated NASA photo thumbnail. */
function photoTile(lat: number, lon: number, z: number, date: string, layer: string) {
  const n = 2 ** z
  const x = Math.floor(((lon + 180) / 360) * n)
  const rad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n)
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level12/${z}/${y}/${x}.png`
}

/** Satellite photos of the place on both dates, side by side. Hidden when NASA has no clear
 * scene (the image fails or is empty), rather than showing a broken picture. */
function PhotoPair({ point, event }: { point: StoryPoint; event: SarEvent }) {
  const [failed, setFailed] = React.useState(false)
  const [pre, post] = event.hls ?? [null, null]
  React.useEffect(() => setFailed(false), [point.id])
  if (!pre || !post || failed) return null
  const z = point.zoom >= 12 ? 11 : 10
  const sides: [string, { date: string; layer: string }][] = [
    ["Before", pre],
    ["After", post],
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {sides.map(([name, h]) => (
        <figure key={name} className="relative overflow-hidden rounded-lg bg-muted">
          <img
            src={photoTile(point.lat, point.lon, z, h.date, h.layer)}
            alt={`Satellite photo, ${name.toLowerCase()}: ${formatDate(h.date)}`}
            className="aspect-square w-full object-cover"
            onError={() => setFailed(true)}
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
            {name} · {formatDate(h.date)}
          </figcaption>
        </figure>
      ))}
      <p className="col-span-2 text-[11px] text-muted-foreground">
        Satellite photos: NASA HLS (Landsat / Sentinel-2). Clouds can hide the ground.
      </p>
    </div>
  )
}

/**
 * The event as a guided tour, in a card over the map. `index` null is the opening card (what
 * happened, and a Start button); a number is one step: the map has already flown there and
 * switched to the layers the step needs.
 */
export function StoryCard({
  story,
  event,
  index,
  onIndex,
  onClose,
}: {
  story: Story
  event: SarEvent
  index: number | null
  onIndex: (i: number | null) => void
  onClose: () => void
}) {
  const point = index == null ? null : story.points[index]
  const last = story.points.length - 1
  const scroller = React.useRef<HTMLDivElement>(null)
  // A step about the whole scene has no single spot to measure.
  const isPlace = !!point && (point.area != null || point.zoom >= 11)
  React.useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [index])
  return (
    <section
      data-testid="story"
      aria-label="The story of this event"
      className="pointer-events-auto absolute top-14 right-3 z-20 flex max-h-[calc(100svh-15rem)] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl max-md:max-h-[46svh]"
    >
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#c2410c] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
          The story
        </span>
        {point && (
          <span className="flex items-center gap-1" aria-label={`Step ${index! + 1} of ${story.points.length}`}>
            {story.points.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Go to step ${i + 1}: ${p.title}`}
                onClick={() => onIndex(i)}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-[#c2410c]" : "w-2.5 bg-foreground/20 hover:bg-foreground/40")}
              />
            ))}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the story"
          className="-mr-2 ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {!point ? (
        <>
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-balance">{event.title}</h2>
          <p className="text-[15px] leading-relaxed">{story.summary}</p>
          <button
            type="button"
            onClick={() => onIndex(0)}
            className={cn(navBtn, "h-12 justify-center bg-[#c2410c] text-[15px] text-white hover:bg-[#9a3412]")}
          >
            <PlayIcon className="size-4 fill-current" /> Show me, step by step
          </button>
          <p className="text-xs text-muted-foreground">
            {story.points.length} steps. The map moves and changes by itself as you go.
          </p>
        </>
      ) : (
        <>
          {point.headline && (
            <p className="text-[22px] leading-tight font-bold tracking-tight text-balance text-[#c2410c]" data-testid="story-headline">
              {point.headline}
            </p>
          )}
          <h3 className="text-[15px] leading-snug font-semibold" data-testid="story-title">
            {point.title}
          </h3>
          <PhotoPair point={point} event={event} />
          <p className="text-[14px] leading-relaxed">{point.what_happened}</p>
          {isPlace && point.show?.radar_opacity !== 0 && (
            <div className="rounded-lg bg-foreground/5 px-3 py-2.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Measured here by the radar
              </p>
              <p className="mt-1 text-[13px] leading-relaxed">{radarSentence(point, event)}</p>
            </div>
          )}
          {point.sources.length > 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sources:{" "}
              {point.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && " · "}
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {s.label}
                  </a>
                </span>
              ))}
            </p>
          )}
        </>
      )}
      </div>
      {point && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-card px-5 py-3">
            <button
              type="button"
              onClick={() => onIndex(index === 0 ? null : index! - 1)}
              className={cn(navBtn, "border border-foreground/15 hover:bg-accent")}
            >
              <ChevronLeftIcon className="size-4" /> Back
            </button>
            {index === last ? (
              <button type="button" onClick={onClose} className={cn(navBtn, "bg-foreground text-background hover:opacity-90")}>
                Explore the map
              </button>
            ) : (
              <button type="button" onClick={() => onIndex(index! + 1)} className={cn(navBtn, "bg-[#c2410c] text-white hover:bg-[#9a3412]")}>
                Next <ChevronRightIcon className="size-4" />
              </button>
            )}
          </div>
      )}
    </section>
  )
}
