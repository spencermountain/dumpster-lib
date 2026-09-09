export type DumpsterFormat = 'text' | 'sm' | 'md' | 'lg' | 'xl' | 'html' | 'markdown' | 'json'

export type NsfwReason =
  | 'Sexuality'
  | 'Drug-use'
  | 'Weapons'
  | 'Violence'
  | 'Profanity'
  | 'Obscenity'

export type NamespaceMap = Record<number, boolean>
export type NamespaceRule = number | boolean | null | NamespaceMap

export type NsfwReasonMap = Partial<Record<NsfwReason, boolean>> & {
  [reason: string]: boolean | undefined
}
export type SkipNsfwRule = boolean | NsfwReasonMap

export interface DumpsterOptions<Format extends DumpsterFormat = DumpsterFormat> {
  /** Path to an uncompressed MediaWiki XML dump. */
  file: string
  /** Page output shape. @default 'json' */
  format?: Format
  project?: string
  lang?: string
  /** Namespace inclusion rule. @default 0 */
  namespace?: NamespaceRule
  /** @default true */
  skip_redirect?: boolean
  /** @default false */
  skip_disambig?: boolean
  /** A global switch or per-reason skip map. @default false */
  skip_nsfw?: SkipNsfwRule
  /** @default false */
  skip_stub?: boolean
  /** Worker thread count. Defaults to the CPU count minus one. */
  workers?: number
  /** Pages parsed before a worker hands over a batch. @default 100 */
  batchPageCount?: number
  /** Batches held before workers are paused. Defaults to one per worker. */
  queueLimit?: number | null
  /** Milliseconds between status frames; zero disables them. @default 5000 */
  heartbeat?: number
}

export interface DumpsterPageBase {
  title: string
  pageID: string
  encoded_title: string
  isRedirect: boolean
  isDisambig: boolean
  isStub: boolean
  isNsfw: boolean
  nsfwReason: NsfwReason | null
  revisionID: string
  timestamp: string
  ns: number
}

export interface TextPageData {
  text: string
}

export interface SmallPageData {
  type?: string | null
  summary: string
  categories: string[]
  infobox: unknown
}

export interface MediumPageData extends SmallPageData {
  templates: Array<Record<string, unknown>>
  links: unknown[]
  intro: string
}

export interface HtmlPageData {
  html: string
}

export interface MarkdownPageData {
  markdown: string
}

export interface JsonPageData {
  [key: string]: unknown
}

export type PageDataFor<Format extends DumpsterFormat> = Format extends 'text'
  ? TextPageData
  : Format extends 'sm'
    ? SmallPageData
    : Format extends 'md'
      ? MediumPageData
      : Format extends 'html'
        ? HtmlPageData
        : Format extends 'markdown'
          ? MarkdownPageData
          : Format extends 'xl'
            ? JsonPageData & TextPageData
            : JsonPageData

export type DumpsterPage<Format extends DumpsterFormat = DumpsterFormat> = DumpsterPageBase &
  PageDataFor<Format>

export interface DumpsterErrorType {
  message: string
  count: number
  title?: string
}

export interface DumpsterStats {
  processed: number
  skipped: number
  written: number
  errors: number
  skipped_namespace: number
  skipped_redirect: number
  skipped_disambig: number
  skipped_nsfw: number
  skipped_stub: number
  skipped_empty: number
  workers: number
  batches: number
  maxQueue: number
  parked: number
  took: number
  bytes: number
  fileSize: number
  maxRss: number
  errorTypes: DumpsterErrorType[]
}

export type BatchListener<Format extends DumpsterFormat = DumpsterFormat> = (
  pages: Array<DumpsterPage<Format>>
) => void | PromiseLike<unknown>
export type EndListener = (stats: DumpsterStats) => void | PromiseLike<unknown>
export type ErrorListener = (error: Error) => void

export interface DumpsterPool<Format extends DumpsterFormat = DumpsterFormat> {
  readonly done: Promise<DumpsterStats>

  on(event: 'batch', listener: BatchListener<Format>): this
  on(event: 'end', listener: EndListener): this
  on(event: 'error', listener: ErrorListener): this
  on(event: string | symbol, listener: (...args: any[]) => unknown): this

  once(event: 'batch', listener: BatchListener<Format>): this
  once(event: 'end', listener: EndListener): this
  once(event: 'error', listener: ErrorListener): this
  once(event: string | symbol, listener: (...args: any[]) => unknown): this

  off(event: 'batch', listener: BatchListener<Format>): this
  off(event: 'end', listener: EndListener): this
  off(event: 'error', listener: ErrorListener): this
  off(event: string | symbol, listener: (...args: any[]) => unknown): this
}

declare function dumpster<Format extends DumpsterFormat = 'json'>(
  options: DumpsterOptions<Format>
): DumpsterPool<Format>

export default dumpster
