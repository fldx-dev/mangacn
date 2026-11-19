// The profile page's data: what other readers see of this reader. This is sample data; replace
// `profile` with what your account store returns.

/** The public profile the form edits. */
export interface Profile {
  /** The name other readers see. Required. */
  displayName: string;
  /** The handle after "@": letters, digits and underscores. Required. */
  username: string;
  /** Up to `PROFILE_BIO_MAX` characters. */
  bio: string;
  /** Up to `PROFILE_INTERESTS_MAX` tags. */
  interests: string[];
  /** A full URL, or empty. */
  website: string;
}

export const PROFILE_BIO_MAX = 160;
export const PROFILE_INTERESTS_MAX = 8;
/** The largest photo, in bytes: 2 MB. */
export const PROFILE_PHOTO_MAX_SIZE = 2 * 1024 * 1024;

export const profile: Profile = {
  displayName: "Aiko Tanaka",
  username: "aiko_reads",
  bio: "Reading seinen on the night train since 2019.\nCurrently re-reading everything by Kei Arata.",
  interests: ["seinen", "slice of life", "mystery"],
  website: "",
};
