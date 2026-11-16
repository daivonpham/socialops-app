/** The strip of frames the cover picker shows, read once per video and kept while composing. */
export type VideoFrames = { duration: number; frames: string[] }

const FRAME_COUNT = 10
const FRAME_HEIGHT = 96

type Entry = { frames: Promise<VideoFrames | null>; ready?: VideoFrames }

/** By the video's id in the composer. */
const entries = new Map<string, Entry>()
/** The picked file on this device; reading it needs no network, even once it is uploaded. */
const localUrls = new Map<string, string>()

function waitFor(video: HTMLVideoElement, event: 'loadeddata' | 'seeked'): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener(event, done)
      video.removeEventListener('error', fail)
      resolve()
    }
    const fail = () => {
      video.removeEventListener(event, done)
      video.removeEventListener('error', fail)
      reject(new Error('Video could not be read'))
    }
    video.addEventListener(event, done)
    video.addEventListener('error', fail)
  })
}

async function readFrames(url: string): Promise<VideoFrames> {
  const reader = document.createElement('video')
  // Stored videos allow it through the bucket's CORS.
  if (!url.startsWith('blob:')) reader.crossOrigin = 'anonymous'
  reader.muted = true
  reader.playsInline = true
  reader.preload = 'auto'
  reader.src = url
  try {
    await waitFor(reader, 'loadeddata')
    const duration = Number.isFinite(reader.duration) ? reader.duration : 0
    if (!duration) throw new Error('Video has no length')
    const canvas = document.createElement('canvas')
    canvas.height = FRAME_HEIGHT
    canvas.width = Math.max(
      1,
      Math.round((reader.videoWidth / (reader.videoHeight || 1)) * FRAME_HEIGHT),
    )
    const context = canvas.getContext('2d')
    const frames: string[] = []
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const seeked = waitFor(reader, 'seeked')
      reader.currentTime = ((index + 0.5) / FRAME_COUNT) * duration
      await seeked
      context?.drawImage(reader, 0, 0, canvas.width, canvas.height)
      frames.push(canvas.toDataURL('image/jpeg', 0.6))
    }
    return { duration, frames }
  } finally {
    reader.removeAttribute('src')
    reader.load()
  }
}

function start(id: string, url: string): Entry {
  const entry: Entry = { frames: Promise.resolve(null) }
  entry.frames = readFrames(url).then(
    (result) => {
      entry.ready = result
      return result
    },
    () => {
      // Read again next time, e.g. after a network blip. The video may have a new id by now.
      for (const [key, value] of entries) if (value === entry) entries.delete(key)
      return null
    },
  )
  entries.set(id, entry)
  return entry
}

/** Starts reading a video just picked on this device, while it uploads. */
export function prepareVideoFrames(id: string, localUrl: string): void {
  localUrls.set(id, localUrl)
  if (!entries.has(id)) start(id, localUrl)
}

/** The frames of a video: read already, being read, or read now. */
export function videoFrames(id: string, url: string): Promise<VideoFrames | null> {
  const entry = entries.get(id)
  if (entry) return entry.frames
  return start(id, localUrls.get(id) ?? url).frames
}

/** The frames if they are read already, to show them without waiting. */
export function readyVideoFrames(id: string): VideoFrames | undefined {
  return entries.get(id)?.ready
}

/** The picked file of a video, when it was picked on this device. */
export function localVideoUrl(id: string): string | undefined {
  return localUrls.get(id)
}

/** Keeps what was read when the video gets a new id, e.g. once it is uploaded. */
export function moveVideoFrames(from: string, to: string): void {
  if (from === to) return
  const entry = entries.get(from)
  const localUrl = localUrls.get(from)
  forgetVideoFrames(from)
  if (entry) entries.set(to, entry)
  if (localUrl) localUrls.set(to, localUrl)
}

export function forgetVideoFrames(id: string): void {
  entries.delete(id)
  localUrls.delete(id)
}

/** Leaving the composer: its picked files are gone. */
export function clearVideoFrames(): void {
  entries.clear()
  localUrls.clear()
}
