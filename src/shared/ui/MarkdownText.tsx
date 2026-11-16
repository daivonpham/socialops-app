import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

/*
 * Text the AI wrote, shown with its Markdown: bold, italics, lists, headings, quotes, links,
 * tables. A single line break stays a line break, as the AI meant it. Raw HTML is never
 * rendered, and images show their description only, so AI text cannot load anything.
 */
const COMPONENTS: Components = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through">{children}</del>,
  h1: ({ children }) => <p className="mt-3 text-heading-4 first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-3 text-heading-4 first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-3 text-label-md first:mt-0">{children}</p>,
  h4: ({ children }) => <p className="mt-2 text-label-md first:mt-0">{children}</p>,
  h5: ({ children }) => <p className="mt-2 text-label-md first:mt-0">{children}</p>,
  h6: ({ children }) => <p className="mt-2 text-label-md first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc ps-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal ps-5 first:mt-0">{children}</ol>,
  li: ({ children }) => <li className="mt-1 first:mt-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-s-2 border-border-strong ps-3 text-text-secondary first:mt-0">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-bg-surface-muted px-1 font-mono text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-md bg-bg-surface-muted p-3 whitespace-pre-wrap first:mt-0 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-border-subtle" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link underline underline-offset-2 hover:text-link-hover focus-visible:focus-ring"
    >
      {children}
    </a>
  ),
  img: ({ alt }) => (alt ? <span>{alt}</span> : null),
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto first:mt-0">
      <table className="w-full border-collapse text-start">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-subtle px-2 py-1 text-start font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border-subtle px-2 py-1">{children}</td>,
}

const PLUGINS = [remarkGfm, remarkBreaks]

// While text is still coming in, a blinking caret follows its last line.
const CARET =
  "[&>:last-child]:after:ms-[2px] [&>:last-child]:after:inline-block [&>:last-child]:after:h-[1em] [&>:last-child]:after:w-[2px] [&>:last-child]:after:animate-pulse [&>:last-child]:after:bg-ai-500 [&>:last-child]:after:align-text-bottom [&>:last-child]:after:content-['']"

export function MarkdownText({
  children,
  streaming = false,
  className,
}: {
  children: string
  streaming?: boolean
  className?: string
}) {
  return (
    <div className={`break-words ${streaming ? CARET : ''} ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={PLUGINS} components={COMPONENTS} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  )
}
