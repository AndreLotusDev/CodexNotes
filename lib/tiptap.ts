import { TipTapDoc } from "@/lib/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderText(node: TipTapDoc) {
  let text = escapeHtml(node.text ?? "");

  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") text = `<strong>${text}</strong>`;
    if (mark.type === "italic") text = `<em>${text}</em>`;
    if (mark.type === "underline") text = `<u>${text}</u>`;
    if (mark.type === "strike") text = `<s>${text}</s>`;
    if (mark.type === "code") text = `<code>${text}</code>`;
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      const safeHref = /^https?:\/\//.test(href) ? escapeHtml(href) : "#";
      text = `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  }

  return text;
}

function renderChildren(node: TipTapDoc) {
  return (node.content ?? []).map(renderNode).join("");
}

function renderNode(node: TipTapDoc): string {
  switch (node.type) {
    case "doc":
      return renderChildren(node);
    case "paragraph":
      return `<p>${renderChildren(node) || "<br />"}</p>`;
    case "text":
      return renderText(node);
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      const tag = level >= 1 && level <= 3 ? `h${level}` : "h1";
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case "bulletList":
      return `<ul>${renderChildren(node)}</ul>`;
    case "orderedList":
      return `<ol>${renderChildren(node)}</ol>`;
    case "listItem":
      return `<li>${renderChildren(node)}</li>`;
    case "blockquote":
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${renderChildren(node)}</code></pre>`;
    case "horizontalRule":
      return "<hr />";
    case "hardBreak":
      return "<br />";
    default:
      return renderChildren(node);
  }
}

export function renderTipTapToSanitizedHtml(doc: TipTapDoc) {
  return renderNode(doc);
}
