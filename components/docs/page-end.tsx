/**
 * The docs page paints whole: its text in the same frame as the header and sidebar.
 *
 * React streams the page body as one hidden block and shows it with an inline script after the
 * block. When a frame has already painted by then, React holds that reveal until 300 ms after
 * the frame. Chrome's parser yields every 10 ms once the stylesheets are in, so a frame gets in
 * whenever the HTML up to the script takes longer than that to parse: on a slow phone for every
 * page, and for a heavy page (calendar, 450 KB) even on a fast machine. The page text, the
 * largest paint, then comes 300 to 400 ms after the first paint, and Lighthouse's simulation
 * turns that gap into seconds.
 *
 * `rel="expect"` holds the first frame until the element it names has been parsed, and that
 * element is the last one of the page body, right before the reveal script. Without the
 * element (a not-found page) the frame waits for the end of the document; a browser that does
 * not know `rel="expect"` paints as before.
 */
export const PAGE_END_ID = "docs-page-end";

/** In the docs layout: React moves a `<link>` to the head wherever it is rendered. */
export function PaintWithPage() {
  return <link rel="expect" href={`#${PAGE_END_ID}`} blocking="render" />;
}

/** The last element of a docs page's body (components/docs/docs-page.tsx puts it there). */
export function PageEnd() {
  return <span id={PAGE_END_ID} hidden />;
}
