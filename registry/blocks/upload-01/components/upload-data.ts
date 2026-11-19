// The upload page's data: the series a creator can upload to, each with its next chapter. This is
// sample data; replace `uploadSeries` with what your store returns.

/** A series the chapter can belong to. */
export interface UploadSeries {
  /** The select's value. */
  id: string;
  /** The name the select shows. */
  title: string;
  /** The number the chapter field starts at when this series is picked. */
  nextChapter: number;
}

/** The most pages one chapter takes. */
export const UPLOAD_MAX_FILES = 40;
/** The largest page, in bytes: 10 MB. */
export const UPLOAD_MAX_SIZE = 10 * 1024 * 1024;

export const uploadSeries: UploadSeries[] = [
  { id: "night-train", title: "The Night Train Diaries", nextChapter: 13 },
  { id: "paper-moon", title: "Paper Moon Bakery", nextChapter: 28 },
  { id: "last-ronin", title: "Last Ronin of Kyoto", nextChapter: 7 },
];
