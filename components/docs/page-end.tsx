/**
 * Every page paints whole: its text in the same frame as the header and sidebar.
 *
 * React streams the page body as one hidden block and shows it with an inline script after the
 * block. When a frame has already painted by then, React holds that reveal until 300 ms after
 * the frame. Chrome's parser yields every 10 ms once the stylesheets are in, so a frame gets in
 * whenever the HTML up to the script takes longer than that to parse: on a slow phone for every
 * docs page, and for a heavy one (calendar, 450 KB) even on a fast machine. The page text, the
 * largest paint, then comes 300 to 400 ms after the first paint, and Lighthouse's simulation
 * turns that gap into seconds. Worse, an app that hydrates inside the gap renders the whole
 * body again on the client instead of hydrating it.
 *
 * `rel="expect"` holds the first frame until the element it names has been parsed. It names an
 * id no element has, so the frame waits for the end of the document: the reveal script has run
 * by then. (Naming a marker at the end of the body was tried first: Chrome lets the frame go at
 * the marker's start tag, a moment before the script behind it, and one cold load in eleven on
 * a slower machine still painted early.) The cost is a first paint that waits for the whole
 * document, 50 to 110 ms on a slow phone and longer when the server sends the page in parts.
 * A browser that does not know `rel="expect"` paints as before.
 *
 * Every route needs it: the docs body, a page block on `/view` and a variant stage all stream
 * inside a Suspense boundary. The link goes out through the root layout's metadata, which Next
 * renders in the head outside the body's React tree. Rendered as an element anywhere above the
 * page, it would be a new sibling, and a new sibling changes every `useId` below it and so every
 * outline the pen draws; inside a Suspense fallback React drops it.
 */
export const DOCUMENT_END_ID = "docs-document-end";

/**
 * For the root layout's `metadata.icons.other`: Next renders an icon entry as a `<link>` with
 * every field but `url` as an attribute, so `blocking` reaches the tag (`IconDescriptor` does not
 * list it; a named object is not checked for extra fields).
 */
export const PAINT_WITH_PAGE = {
  rel: "expect",
  url: `#${DOCUMENT_END_ID}`,
  blocking: "render",
};
