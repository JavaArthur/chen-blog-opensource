import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export async function renderPostMarkdownToHtml(markdown: string): Promise<string> {
  return (
    await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(markdown)
  ).toString()
}
