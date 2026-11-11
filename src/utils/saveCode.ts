import type { AppState, Tournament } from '../types'

const PLAIN_PREFIX = 'MHW1-'
const GZIP_PREFIX = 'MHW1G-'

export interface SavePayload {
  current: Tournament | null
  history: Tournament[]
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer])
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toBlob(bytes).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toBlob(bytes).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function encodeSaveCode(state: Pick<AppState, 'current' | 'history'>): Promise<string> {
  const payload = { v: 1, current: state.current, history: state.history }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))

  if (typeof CompressionStream !== 'undefined') {
    try {
      return GZIP_PREFIX + bytesToBase64(await gzip(bytes))
    } catch {
      // fall back to an uncompressed code
    }
  }

  return PLAIN_PREFIX + bytesToBase64(bytes)
}

export async function decodeSaveCode(input: string): Promise<SavePayload> {
  const code = input.trim().replace(/\s+/g, '')
  const compressed = code.startsWith(GZIP_PREFIX)
  const prefix = compressed ? GZIP_PREFIX : PLAIN_PREFIX
  const body = code.startsWith(prefix) ? code.slice(prefix.length) : code
  if (!body) throw new Error('Save code is empty.')

  let base64 = body.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='

  let bytes: Uint8Array
  try {
    bytes = base64ToBytes(base64)
    if (compressed) bytes = await gunzip(bytes)
  } catch {
    throw new Error('Invalid save code.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('Invalid save code.')
  }

  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid save code.')
  const data = parsed as { v?: number; current?: unknown; history?: unknown }
  if (data.v !== 1) throw new Error('Unsupported save code version.')

  const current = data.current as Tournament | null
  if (
    !current ||
    typeof current !== 'object' ||
    !Array.isArray(current.participants) ||
    !Array.isArray(current.matches) ||
    !current.config
  ) {
    throw new Error('Save code does not contain a valid tournament.')
  }

  const history = Array.isArray(data.history) ? (data.history as Tournament[]) : []
  return { current, history }
}
