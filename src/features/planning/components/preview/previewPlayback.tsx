import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { VideoPreviewHandle } from '@/shared/ui'

type PreviewPlayback = {
  /** A preview video is on screen and can be played from outside it. */
  available: boolean
  playing: boolean
  toggle: () => void
  /** Called by the preview's player: its controls, or null once it is gone. */
  bind: (handle: VideoPreviewHandle | null) => void
  report: (playing: boolean) => void
}

const PreviewPlaybackContext = createContext<PreviewPlayback | null>(null)

/**
 * Lets the composer's file card play and pause the video of the post preview. Only the preview
 * plays; the card shows whether it is playing.
 */
export function PreviewPlaybackProvider({ children }: { children: ReactNode }) {
  const handle = useRef<VideoPreviewHandle | null>(null)
  const [available, setAvailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const bind = useCallback((next: VideoPreviewHandle | null) => {
    handle.current = next
    setAvailable(next !== null)
    if (!next) setPlaying(false)
  }, [])
  const value = useMemo<PreviewPlayback>(
    () => ({
      available,
      playing,
      toggle: () => handle.current?.togglePlayback(),
      bind,
      report: setPlaying,
    }),
    [available, playing, bind],
  )
  return <PreviewPlaybackContext.Provider value={value}>{children}</PreviewPlaybackContext.Provider>
}

/** The shared playback, or null outside the composer (e.g. a published post's details). */
export function usePreviewPlayback(): PreviewPlayback | null {
  return useContext(PreviewPlaybackContext)
}
