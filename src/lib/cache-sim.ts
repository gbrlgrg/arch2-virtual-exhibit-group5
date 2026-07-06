// ---------------------------------------------------------------------------
// Cache simulation model
// ---------------------------------------------------------------------------
// We model a tiny, direct-mapped L1 cache to keep the visualization legible.
//
// Address layout (12-bit address space):
//   ┌────────── TAG (7 bits) ──────────┬── INDEX (3 bits) ──┬─ OFFSET (2 bits) ─┐
//   The OFFSET selects a byte inside a 4-byte block.
//   The INDEX selects one of the 8 cache rows (2^3).
//   The TAG is what we compare against the tag stored in that row.
// ---------------------------------------------------------------------------

export const ADDRESS_BITS = 12
export const OFFSET_BITS = 2
export const INDEX_BITS = 3
export const TAG_BITS = ADDRESS_BITS - INDEX_BITS - OFFSET_BITS // 7

export const CACHE_ROWS = 1 << INDEX_BITS // 8 rows

export const HIT_LATENCY_NS = 2
export const MISS_LATENCY_NS = 100

export type CacheRow = {
  index: number
  valid: boolean
  tag: number | null
}

export type AddressBreakdown = {
  /** Original numeric value of the parsed address. */
  value: number
  /** Normalized hex string, e.g. "0x1A4". */
  hex: string
  /** Full binary string padded to ADDRESS_BITS, e.g. "000110100100". */
  binary: string
  /** Binary grouped into nibbles for display, e.g. "0001 1010 0100". */
  binaryGrouped: string
  tag: number
  index: number
  offset: number
  tagBits: string
  indexBits: string
  offsetBits: string
}

/** Create a fresh, empty (cold) cache. */
export function createEmptyCache(): CacheRow[] {
  return Array.from({ length: CACHE_ROWS }, (_, index) => ({
    index,
    valid: false,
    tag: null,
  }))
}

/**
 * Parse a user-entered address (hex like "0x1A4" / "1A4", or decimal-ish).
 * Returns null when the input cannot be parsed as a valid address.
 */
export function parseAddress(input: string): AddressBreakdown | null {
  const cleaned = input.trim().toLowerCase().replace(/^0x/, '')
  if (cleaned.length === 0) return null
  if (!/^[0-9a-f]+$/.test(cleaned)) return null

  const value = Number.parseInt(cleaned, 16)
  if (Number.isNaN(value) || value < 0) return null

  // Clamp into the addressable range so the visualization stays consistent.
  const masked = value & ((1 << ADDRESS_BITS) - 1)

  const binary = masked.toString(2).padStart(ADDRESS_BITS, '0')
  const tagBits = binary.slice(0, TAG_BITS)
  const indexBits = binary.slice(TAG_BITS, TAG_BITS + INDEX_BITS)
  const offsetBits = binary.slice(TAG_BITS + INDEX_BITS)

  return {
    value: masked,
    hex: '0x' + masked.toString(16).toUpperCase(),
    binary,
    binaryGrouped: binary.replace(/(.{4})/g, '$1 ').trim(),
    tag: Number.parseInt(tagBits, 2),
    index: Number.parseInt(indexBits, 2),
    offset: Number.parseInt(offsetBits, 2),
    tagBits,
    indexBits,
    offsetBits,
  }
}

export type LookupResult = {
  outcome: 'hit' | 'miss'
  latency: number
  /** The cache state AFTER the lookup (a miss loads the block). */
  cache: CacheRow[]
}

/**
 * Perform a direct-mapped lookup against the given cache.
 * On a miss the block is loaded into the cache (write-allocate).
 * `force` lets the UI demonstrate a guaranteed hit or miss.
 */
export function lookup(
  cache: CacheRow[],
  addr: AddressBreakdown,
  force: 'auto' | 'hit' | 'miss' = 'auto',
): LookupResult {
  const row = cache[addr.index]
  const naturalHit = row.valid && row.tag === addr.tag

  let outcome: 'hit' | 'miss'
  if (force === 'hit') outcome = 'hit'
  else if (force === 'miss') outcome = 'miss'
  else outcome = naturalHit ? 'hit' : 'miss'

  const next = cache.map((r) => ({ ...r }))

  if (outcome === 'hit') {
    // Ensure the row reflects a hit so the highlighted cell is meaningful.
    next[addr.index] = { index: addr.index, valid: true, tag: addr.tag }
  } else {
    // Miss: fetch from RAM and load the block into the row.
    next[addr.index] = { index: addr.index, valid: true, tag: addr.tag }
  }

  return {
    outcome,
    latency: outcome === 'hit' ? HIT_LATENCY_NS : MISS_LATENCY_NS,
    cache: next,
  }
}
