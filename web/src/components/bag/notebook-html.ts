// Notebook content is HTML from a contentEditable editor. Only simple
// formatting is kept; everything else (scripts, styles, event handlers,
// links, images…) is dropped before it is shown again.
const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "H3",
  "P",
  "DIV",
  "BR",
  "UL",
  "OL",
  "LI",
  "SPAN",
  "FONT",
]);
const DROPPED_WITH_CONTENT = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "SVG",
  "MATH",
]);

export const PAGE_CHIP_CLASS =
  "mx-0.5 inline-block cursor-pointer rounded-md bg-amber-100 px-1.5 text-[13px] leading-6 font-medium text-amber-800 hover:bg-amber-200";

// A "p. 12" chip that jumps the book to that page when clicked.
export function pageChipHtml(page: number) {
  return `<span data-page="${page}" contenteditable="false" class="${PAGE_CHIP_CLASS}">p. ${page}</span>`;
}

function clean(parent: Element) {
  for (const child of [...parent.children]) {
    // SVG/MathML tag names are lowercase, so compare in upper case.
    const tag = child.tagName.toUpperCase();
    if (DROPPED_WITH_CONTENT.has(tag)) {
      child.remove();
      continue;
    }
    clean(child);
    if (!ALLOWED_TAGS.has(tag)) {
      // Keep the text, drop the tag.
      child.replaceWith(...child.childNodes);
      continue;
    }
    const page = child.getAttribute("data-page");
    const color = child.getAttribute("color");
    for (const { name } of [...child.attributes]) child.removeAttribute(name);
    // Text color from the color picker: only a plain #rrggbb value is kept.
    if (tag === "FONT" && color && /^#[0-9a-f]{6}$/i.test(color)) {
      child.setAttribute("color", color);
    }
    if (tag === "SPAN" && page && /^\d{1,5}$/.test(page)) {
      child.setAttribute("data-page", page);
      child.setAttribute("contenteditable", "false");
      child.setAttribute("class", PAGE_CHIP_CLASS);
    }
  }
}

export function sanitizeNotebookHtml(html: string) {
  // DOMParser builds an inert document: nothing in it runs.
  const doc = new DOMParser().parseFromString(html, "text/html");
  clean(doc.body);
  return doc.body.innerHTML;
}
