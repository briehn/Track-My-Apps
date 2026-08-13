import { parseDocument } from "htmlparser2";

const BLOCK_TAGS = new Set([
  "article",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "pre",
  "section",
]);
const IGNORED_TAGS = new Set(["script", "style", "noscript"]);

type ImportedHtmlNode = ReturnType<typeof parseDocument>["children"][number];

function hasEncodedHtmlTag(value: string) {
  return /&(?:amp;)?lt;\s*\/?\s*[a-z][a-z0-9:-]*(?:\s|&(?:amp;)?gt;)/i.test(value);
}

function decodeEncodedMarkupLayer(value: string) {
  const entities: Record<string, string> = {
    "#39": "'",
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value.replace(/&(amp|lt|gt|quot|apos|#39);/gi, (entity) => {
    return entities[entity.slice(1, -1).toLocaleLowerCase()] ?? entity;
  });
}

function unwrapEncodedMarkup(value: string) {
  let normalizedValue = value;

  for (let depth = 0; depth < 2 && hasEncodedHtmlTag(normalizedValue); depth += 1) {
    normalizedValue = decodeEncodedMarkupLayer(normalizedValue);
  }

  return normalizedValue;
}

function normalizePlainText(value: string) {
  const lines = value.replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => {
    const leadingWhitespace = /^\s*/.exec(line)?.[0] ?? "";
    const normalizedContent = line.slice(leadingWhitespace.length).replace(/\s+/g, " ").trim();

    return normalizedContent ? `${leadingWhitespace ? "  " : ""}${normalizedContent}` : "";
  });

  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeImportedHtmlToPlainText(content: string) {
  const document = parseDocument(unwrapEncodedMarkup(content), { decodeEntities: true });
  let output = "";

  const appendBreak = (count = 1) => {
    if (!output.endsWith("\n".repeat(count))) {
      output = output.replace(/\n+$/, "") + "\n".repeat(count);
    }
  };

  const visit = (nodes: ImportedHtmlNode[], listDepth = 0): void => {
    for (const node of nodes) {
      if (node.type === "text") {
        output += node.data;
        continue;
      }

      if (node.type !== "tag") {
        continue;
      }

      const tagName = node.name.toLocaleLowerCase();
      if (IGNORED_TAGS.has(tagName)) {
        continue;
      }
      if (tagName === "br") {
        appendBreak();
        continue;
      }
      if (tagName === "ul" || tagName === "ol") {
        const listBreakCount = listDepth > 0 ? 1 : 2;
        appendBreak(listBreakCount);
        visit(node.children, listDepth + 1);
        appendBreak(listBreakCount);
        continue;
      }
      if (tagName === "li") {
        appendBreak();
        output += `${"  ".repeat(Math.max(0, listDepth - 1))}- `;
        visit(node.children, listDepth);
        appendBreak();
        continue;
      }
      if (BLOCK_TAGS.has(tagName)) {
        appendBreak(2);
        visit(node.children, listDepth);
        appendBreak(2);
        continue;
      }

      visit(node.children, listDepth);
    }
  };

  visit(document.children);
  return normalizePlainText(output);
}
