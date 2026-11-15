import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, MapPinIcon } from "lucide-react"

import { fileUrl, type SarEvent, type Story } from "@/lib/api"
import { pointLetter, radarSentence } from "@/lib/story"
import { cn } from "@/lib/utils"

const navBtn =
  "flex h-8 items-center gap-1 rounded-md border border-foreground/15 px-2.5 text-[13px] font-medium transition-colors hover:bg-accent disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * The event told place by place. `index` null is the overview (summary and the list of places);
 * a number is one place: photo, what happened there, what the radar shows, sources.
 */
export function StoryPanel({
  story,
  event,
  index,
  onIndex,
  onSatellite,
}: {
  story: Story
  event: SarEvent
  index: number | null
  onIndex: (i: number | null) => void
  /** Switch the basemap to the dated satellite photos (before left, after right). */
  onSatellite: () => void
}) {
  const point = index == null ? null : story.points[index]
  const last = story.points.length - 1
  return (
    <section className="flex flex-col gap-3 px-1" data-testid="story">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">The story</h2>
        {point && (
          <span className="text-xs text-muted-foreground">
            {index! + 1} of {story.points.length}
          </span>
        )}
      </div>

      {!point ? (
        <>
          <p className="text-[14px] leading-relaxed">{story.summary}</p>
          <ol className="flex flex-col gap-1">
            {story.points.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onIndex(i)}
                  className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-[13px] transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  <span className="story-pin-inline">{pointLetter(i)}</span>
                  <span className="font-medium">{p.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => onIndex(0)} className={cn(navBtn, "self-start bg-primary text-primary-foreground hover:bg-primary hover:opacity-90")}>
            Start the story <ChevronRightIcon className="size-4" />
          </button>
        </>
      ) : (
        <>
          <h3 className="flex items-start gap-2.5 text-[15px] leading-snug font-semibold" data-testid="story-title">
            <span className="story-pin-inline mt-px">{pointLetter(index!)}</span>
            {point.title}
          </h3>
          {point.photos.map((ph) => (
            <figure key={ph.file} className="flex flex-col gap-1">
              <img src={fileUrl(ph.file)} alt={ph.caption} loading="lazy" className="w-full rounded-lg border border-foreground/10" />
              <figcaption className="text-xs leading-snug text-muted-foreground">
                {ph.caption}{" "}
                <a href={ph.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Photo: {ph.credit}, {ph.licence}
                </a>
              </figcaption>
            </figure>
          ))}
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">What happened here</p>
            <p className="mt-0.5 text-[14px] leading-relaxed">{point.what_happened}</p>
          </div>
          <div className="rounded-lg bg-foreground/5 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <MapPinIcon className="size-3.5" /> What the radar shows here
            </p>
            <p className="mt-1 text-[13px] leading-relaxed">{radarSentence(point, event)}</p>
          </div>
          {event.hls?.some(Boolean) && (
            <button type="button" onClick={onSatellite} className={cn(navBtn, "self-start")}>
              <ImageIcon className="size-4" /> Show satellite photos of both dates
            </button>
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
          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => onIndex(index === 0 ? null : index! - 1)} className={navBtn}>
              <ChevronLeftIcon className="size-4" /> {index === 0 ? "Overview" : "Previous"}
            </button>
            <button type="button" disabled={index === last} onClick={() => onIndex(index! + 1)} className={navBtn}>
              Next <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
