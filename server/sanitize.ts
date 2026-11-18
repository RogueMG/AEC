// Product descriptions are stored as HTML, so every save is cleaned here: only the formatting
// the editor offers survives, every attribute is dropped, and anything executable is removed
// with its contents. Uses the Workers runtime's built-in HTMLRewriter.

const ALLOWED = new Set(["p", "h3", "ul", "ol", "li", "strong", "b", "em", "i", "br"]);
// Removed together with everything inside them.
const DROPPED = new Set([
  "script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math",
  "form", "input", "button", "textarea", "select", "link", "meta", "base", "head", "title",
]);
// <b>/<i> are kept as their semantic equivalents.
const RENAMED: Record<string, string> = { b: "strong", i: "em" };

export async function sanitizeDescription(html: string): Promise<string> {
  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (DROPPED.has(tag)) {
          element.remove();
          return;
        }
        if (!ALLOWED.has(tag)) {
          element.removeAndKeepContent();
          return;
        }
        for (const [name] of [...element.attributes]) element.removeAttribute(name);
        if (RENAMED[tag]) element.tagName = RENAMED[tag];
      },
    })
    .onDocument({
      comments(comment) {
        comment.remove();
      },
    });

  const cleaned = await rewriter.transform(new Response(html, { headers: { "Content-Type": "text/html" } })).text();
  // Drop empty paragraphs the editor leaves behind.
  return cleaned.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, "").trim();
}
