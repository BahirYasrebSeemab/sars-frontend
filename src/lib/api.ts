import * as React from "react"

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export interface Granule {
  id: string
  datetime: string
  polarization: string
  track: number | null
  frame: number | null
  orbit_direction: string | null
  product_version: string | null
  /** NISAR release maturity (BETA / PROVISIONAL / VALIDATED), its id, orbit data and frame coverage. */
  maturity?: string | null
  crid?: string | null
  orbit_quality?: string | null
  frame_coverage?: string | null
}

export interface EventSummary {
  id: string
  title: string
  hazard: string
  synthetic: boolean
  pre_date: string
  post_date: string
  changed_pct: number
}

export interface Region {
  n: number
  cls: "decrease" | "increase" | "volume" | "rough_water"
  km2: number
  lat: number
  lon: number
  d_hh?: number | null
  d_hv?: number | null
  /** Large and shifted alike in HH and HV: possibly an acquisition artefact, not ground change. */
  suspect?: boolean
  /** Area of concentrated change: share of all changed land, km² per class, box and outline. */
  share_pct?: number | null
  breakdown?: Partial<Record<"decrease" | "increase" | "volume", number>> | null
  box?: [[number, number], [number, number]] | null
  /** Land (ground on at least one date) inside the outline, and the share of it that changed. */
  extent_km2?: number | null
  density_pct?: number | null
  /** Outline rings as [lat, lon] pairs, drawn as map lines. */
  rings?: [number, number][][] | null
}

export interface SarEvent {
  id: string
  title: string
  hazard: string
  location: string
  description: string
  synthetic: boolean
  product: string
  threshold_db: number
  threshold_auto: boolean
  cross_pol: boolean
  display_db: [number, number] | null
  bounds: [[number, number], [number, number]]
  pre: Granule
  post: Granule
  stats: {
    aoi_km2: number
    masked_km2: number
    decrease_km2: number
    open_water_km2: number
    water_line_db?: number | null
    increase_km2: number
    increase_double_bounce_km2: number | null
    increase_volume_km2: number | null
    increase_rough_water_km2: number | null
    changed_pct: number
    subtle_threshold_db?: number | null
    subtle_increase_km2?: number | null
    subtle_decrease_km2?: number | null
    mean_change_db: number
    noise_sigma_db: number
    histogram: { db: number; pixels: number }[]
  }
  regions: Region[]
  suspects?: Region[]
  area_rule?: {
    window_km: number
    density_x_mean: number
    scene_density_pct: number
    threshold_density_pct: number
    min_km2: number
    coverage_pct: number
    total_km2: number
  } | null
  /** Nearest NASA HLS optical scene per radar date, or null when none within ±8 days. */
  hls: ({ date: string; layer: string } | null)[] | null
  layers: {
    before: string
    after: string
    change: string
    /** Landscape-scale (~300 m) coherent change beyond its own threshold. */
    subtle?: string
    // Dual-pol false colour (red HH, green HV, blue HH/HV), only when the mode has HV
    before_rgb?: string
    after_rgb?: string
  }
}

/** Minimal GET hook — two read-only endpoints don't need a query library. */
export function useApi<T>(path: string | null) {
  const [state, setState] = React.useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  })

  React.useEffect(() => {
    if (!path) return
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true }))
    fetch(`${API_URL}/api/v1${path}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? r.statusText)
        return r.json() as Promise<T>
      })
      .then((data) => setState({ data, loading: false }))
      .catch((e: Error) => e.name !== "AbortError" && setState({ error: e.message, loading: false }))
    return () => ctrl.abort()
  }, [path])

  return state
}

export const fileUrl = (path: string) => `${API_URL}${path}`

export interface Probe {
  lat: number
  lon: number
  pre_db: number | null
  post_db: number | null
  delta_db: number | null
  flag: "decrease" | "increase" | "volume" | "rough_water" | null
  hv_pre_db?: number | null
  hv_post_db?: number | null
}

export async function fetchProbe(eventId: string, lat: number, lon: number): Promise<Probe> {
  const r = await fetch(`${API_URL}/api/v1/events/${eventId}/probe?lat=${lat}&lon=${lon}`)
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? r.statusText)
  return r.json() as Promise<Probe>
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}
