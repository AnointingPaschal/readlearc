/**
 * Markdown → HTML converter
 * Handles ## headings, **bold**, *italic*, lists, blockquotes, code, links
 */
export function mdToHtml(md: string): string {
  if (!md) return "";

  // Code blocks first (protect from other transforms)
  const codeBlocks: string[] = [];
  let s = md.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(`<pre><code>${escape(code.trim())}</code></pre>`);
    return `%%CODE_BLOCK_${codeBlocks.length - 1}%%`;
  });

  // Inline code
  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<code>${escape(c)}</code>`);

  // Process line by line
  const lines  = s.split("\n");
  const out: string[] = [];
  let inList = false; let listType = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (/^###### /.test(line)) { flushList(); out.push(`<h6>${inline(line.slice(7))}</h6>`); continue; }
    if (/^##### /  .test(line)) { flushList(); out.push(`<h5>${inline(line.slice(6))}</h5>`); continue; }
    if (/^#### /   .test(line)) { flushList(); out.push(`<h4>${inline(line.slice(5))}</h4>`); continue; }
    if (/^### /    .test(line)) { flushList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (/^## /     .test(line)) { flushList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (/^# /      .test(line)) { flushList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { flushList(); out.push("<hr/>"); continue; }

    // Blockquote
    if (/^> /.test(line)) { flushList(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      if (!inList || listType !== "ul") { if (inList) out.push(`</${listType}>`); out.push("<ul>"); inList = true; listType = "ul"; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      if (!inList || listType !== "ol") { if (inList) out.push(`</${listType}>`); out.push("<ol>"); inList = true; listType = "ol"; }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    // Empty line — just flush list, spacing via CSS
    if (line.trim() === "") { flushList(); continue; }

    // Regular paragraph line
    flushList();
    // Merge consecutive text lines into one paragraph
    const para: string[] = [inline(line)];
    while (i+1 < lines.length && lines[i+1].trim() !== "" && !/^[#\->*+\d]/.test(lines[i+1])) {
      i++; para.push(inline(lines[i]));
    }
    out.push(`<p>${para.join(" ")}</p>`);
  }
  flushList();

  function flushList() {
    if (inList) { out.push(`</${listType}>`); inList = false; listType = ""; }
  }

  // Restore code blocks
  let result = out.join("\n");
  codeBlocks.forEach((cb, i) => { result = result.replace(`%%CODE_BLOCK_${i}%%`, cb); });

  // Clean up excessive br tags
  result = result.replace(/(<br\/>){3,}/g, "<br/><br/>");

  return result;
}

function inline(s: string): string {
  return s
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g,    "<strong>$1</strong>")
    .replace(/__(.*?)__/g,        "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,        "<em>$1</em>")
    .replace(/_(.*?)_/g,          "<em>$1</em>")
    .replace(/~~(.*?)~~/g,        "<s>$1</s>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,  '<a href="$2">$1</a>');
}

function escape(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/** Detect if a string is HTML or Markdown */
export function isHtml(content: string): boolean {
  const t = content.trim();
  return t.startsWith("<") || /<(h[1-6]|p|div|span|strong|em|ul|ol|li|blockquote|pre|table)[^>]*>/i.test(t);
}

/** Convert content to HTML regardless of input format */
export function toHtml(content: string): string {
  if (!content) return "";
  return isHtml(content) ? content : mdToHtml(content);
}
