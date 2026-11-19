// The file manager's data: a manga project's folders and the files in them. This is sample data;
// replace `fileManagerFolders` and `fileManagerFiles` with what your storage lists.

/** A folder; its `id` is unique in the whole tree. */
export interface FileManagerFolder {
  id: string;
  name: string;
  /** The folders inside it. */
  children?: FileManagerFolder[];
}

/** A file in a folder. */
export interface FileManagerFile {
  /** Unique across all files. */
  id: string;
  /** The `id` of the folder it is in. */
  folderId: string;
  /** The name with its extension; the extension gives the kind and the icon. */
  name: string;
  /** In bytes. */
  size: number;
  /** When it last changed, as an ISO date. */
  modified: string;
}

/** Series → volume → chapter, then the covers and the scripts: 20 folders. */
export const fileManagerFolders: FileManagerFolder[] = [
  {
    id: "nt",
    name: "The Night Train Diaries",
    children: [
      {
        id: "nt/v1",
        name: "Volume 1",
        children: [
          { id: "nt/v1/c1", name: "Chapter 1" },
          { id: "nt/v1/c2", name: "Chapter 2" },
          { id: "nt/v1/c3", name: "Chapter 3" },
        ],
      },
      {
        id: "nt/v2",
        name: "Volume 2",
        children: [
          { id: "nt/v2/c4", name: "Chapter 4" },
          { id: "nt/v2/c5", name: "Chapter 5" },
          { id: "nt/v2/c6", name: "Chapter 6" },
        ],
      },
    ],
  },
  {
    id: "pm",
    name: "Paper Moon Bakery",
    children: [
      {
        id: "pm/v1",
        name: "Volume 1",
        children: [
          { id: "pm/v1/c1", name: "Chapter 1" },
          { id: "pm/v1/c2", name: "Chapter 2" },
        ],
      },
      { id: "pm/v2", name: "Volume 2", children: [{ id: "pm/v2/c3", name: "Chapter 3" }] },
    ],
  },
  {
    id: "lr",
    name: "Last Ronin of Kyoto",
    children: [
      { id: "lr/v1", name: "Volume 1", children: [{ id: "lr/v1/c1", name: "Chapter 1" }] },
    ],
  },
  { id: "covers", name: "Covers" },
  { id: "scripts", name: "Scripts" },
];

/** The folder open at first. */
export const fileManagerStartFolder = "nt/v1/c1";

/** 40 files: chapter pages, working files, covers and scripts. */
export const fileManagerFiles: FileManagerFile[] = [
  {
    id: "nt/v1/c1/night-train-ch01-p01.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p01.png",
    size: 3201332,
    modified: "2026-09-02T10:07:00Z",
  },
  {
    id: "nt/v1/c1/night-train-ch01-p02.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p02.png",
    size: 3499106,
    modified: "2026-09-02T11:14:00Z",
  },
  {
    id: "nt/v1/c1/night-train-ch01-p03.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p03.png",
    size: 2146496,
    modified: "2026-09-02T12:21:00Z",
  },
  {
    id: "nt/v1/c1/night-train-ch01-p04.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p04.png",
    size: 3376246,
    modified: "2026-09-02T13:28:00Z",
  },
  {
    id: "nt/v1/c1/night-train-ch01-p05.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p05.png",
    size: 3971511,
    modified: "2026-09-02T14:35:00Z",
  },
  {
    id: "nt/v1/c1/night-train-ch01-p06.png",
    folderId: "nt/v1/c1",
    name: "night-train-ch01-p06.png",
    size: 2000048,
    modified: "2026-09-02T15:42:00Z",
  },
  {
    id: "nt/v1/c2/night-train-ch02-p01.png",
    folderId: "nt/v1/c2",
    name: "night-train-ch02-p01.png",
    size: 3662680,
    modified: "2026-09-09T10:07:00Z",
  },
  {
    id: "nt/v1/c2/night-train-ch02-p02.png",
    folderId: "nt/v1/c2",
    name: "night-train-ch02-p02.png",
    size: 2136556,
    modified: "2026-09-09T11:14:00Z",
  },
  {
    id: "nt/v1/c2/night-train-ch02-p03.png",
    folderId: "nt/v1/c2",
    name: "night-train-ch02-p03.png",
    size: 2223973,
    modified: "2026-09-09T12:21:00Z",
  },
  {
    id: "nt/v1/c3/night-train-ch03-p01.png",
    folderId: "nt/v1/c3",
    name: "night-train-ch03-p01.png",
    size: 2091261,
    modified: "2026-09-16T10:07:00Z",
  },
  {
    id: "nt/v1/c3/night-train-ch03-p02.png",
    folderId: "nt/v1/c3",
    name: "night-train-ch03-p02.png",
    size: 2779262,
    modified: "2026-09-16T11:14:00Z",
  },
  {
    id: "nt/v1/c3/night-train-ch03-p03.png",
    folderId: "nt/v1/c3",
    name: "night-train-ch03-p03.png",
    size: 4263724,
    modified: "2026-09-16T12:21:00Z",
  },
  {
    id: "nt/v2/c4/night-train-ch04-p01.png",
    folderId: "nt/v2/c4",
    name: "night-train-ch04-p01.png",
    size: 2051524,
    modified: "2026-09-30T10:07:00Z",
  },
  {
    id: "nt/v2/c4/night-train-ch04-p02.png",
    folderId: "nt/v2/c4",
    name: "night-train-ch04-p02.png",
    size: 2038032,
    modified: "2026-09-30T11:14:00Z",
  },
  {
    id: "nt/v2/c4/night-train-ch04-p03.png",
    folderId: "nt/v2/c4",
    name: "night-train-ch04-p03.png",
    size: 3058522,
    modified: "2026-09-30T12:21:00Z",
  },
  {
    id: "nt/v2/c4/night-train-ch04-p04.png",
    folderId: "nt/v2/c4",
    name: "night-train-ch04-p04.png",
    size: 2447601,
    modified: "2026-09-30T13:28:00Z",
  },
  {
    id: "nt/v2/c5/night-train-ch05-p01.png",
    folderId: "nt/v2/c5",
    name: "night-train-ch05-p01.png",
    size: 4237943,
    modified: "2026-10-07T10:07:00Z",
  },
  {
    id: "nt/v2/c5/night-train-ch05-p02.png",
    folderId: "nt/v2/c5",
    name: "night-train-ch05-p02.png",
    size: 4192626,
    modified: "2026-10-07T11:14:00Z",
  },
  {
    id: "nt/v2/c6/night-train-ch06-p01.png",
    folderId: "nt/v2/c6",
    name: "night-train-ch06-p01.png",
    size: 2275712,
    modified: "2026-10-12T10:07:00Z",
  },
  {
    id: "nt/v2/c6/night-train-ch06-p02.png",
    folderId: "nt/v2/c6",
    name: "night-train-ch06-p02.png",
    size: 3404999,
    modified: "2026-10-12T11:14:00Z",
  },
  {
    id: "pm/v1/c1/paper-moon-ch01-p01.png",
    folderId: "pm/v1/c1",
    name: "paper-moon-ch01-p01.png",
    size: 4140160,
    modified: "2026-08-18T10:07:00Z",
  },
  {
    id: "pm/v1/c1/paper-moon-ch01-p02.png",
    folderId: "pm/v1/c1",
    name: "paper-moon-ch01-p02.png",
    size: 4209786,
    modified: "2026-08-18T11:14:00Z",
  },
  {
    id: "pm/v1/c1/paper-moon-ch01-p03.png",
    folderId: "pm/v1/c1",
    name: "paper-moon-ch01-p03.png",
    size: 2707448,
    modified: "2026-08-18T12:21:00Z",
  },
  {
    id: "pm/v1/c1/paper-moon-ch01-p04.png",
    folderId: "pm/v1/c1",
    name: "paper-moon-ch01-p04.png",
    size: 4073323,
    modified: "2026-08-18T13:28:00Z",
  },
  {
    id: "pm/v1/c2/paper-moon-ch02-p01.png",
    folderId: "pm/v1/c2",
    name: "paper-moon-ch02-p01.png",
    size: 3161017,
    modified: "2026-08-25T10:07:00Z",
  },
  {
    id: "pm/v1/c2/paper-moon-ch02-p02.png",
    folderId: "pm/v1/c2",
    name: "paper-moon-ch02-p02.png",
    size: 4299680,
    modified: "2026-08-25T11:14:00Z",
  },
  {
    id: "lr/v1/c1/last-ronin-ch01-p01.png",
    folderId: "lr/v1/c1",
    name: "last-ronin-ch01-p01.png",
    size: 3360357,
    modified: "2026-10-01T10:07:00Z",
  },
  {
    id: "lr/v1/c1/last-ronin-ch01-p02.png",
    folderId: "lr/v1/c1",
    name: "last-ronin-ch01-p02.png",
    size: 2884976,
    modified: "2026-10-01T11:14:00Z",
  },
  {
    id: "nt/v2/c5/night-train-ch05-thumbnails.clip",
    folderId: "nt/v2/c5",
    name: "night-train-ch05-thumbnails.clip",
    size: 18432000,
    modified: "2026-10-05T22:40:00Z",
  },
  {
    id: "lr/v1/c1/last-ronin-ch01-layout.psd",
    folderId: "lr/v1/c1",
    name: "last-ronin-ch01-layout.psd",
    size: 42105344,
    modified: "2026-09-28T21:15:00Z",
  },
  {
    id: "covers/night-train-vol1-cover.png",
    folderId: "covers",
    name: "night-train-vol1-cover.png",
    size: 6291456,
    modified: "2026-08-30T16:00:00Z",
  },
  {
    id: "covers/night-train-vol2-cover.png",
    folderId: "covers",
    name: "night-train-vol2-cover.png",
    size: 6502400,
    modified: "2026-10-10T16:00:00Z",
  },
  {
    id: "covers/paper-moon-vol1-cover.jpg",
    folderId: "covers",
    name: "paper-moon-vol1-cover.jpg",
    size: 3145728,
    modified: "2026-08-12T16:00:00Z",
  },
  {
    id: "covers/paper-moon-vol2-cover-draft.png",
    folderId: "covers",
    name: "paper-moon-vol2-cover-draft.png",
    size: 5242880,
    modified: "2026-10-14T16:00:00Z",
  },
  {
    id: "covers/last-ronin-vol1-cover.png",
    folderId: "covers",
    name: "last-ronin-vol1-cover.png",
    size: 5767168,
    modified: "2026-09-25T16:00:00Z",
  },
  {
    id: "scripts/night-train-ch01-05.pdf",
    folderId: "scripts",
    name: "night-train-ch01-05.pdf",
    size: 1258291,
    modified: "2026-08-28T11:30:00Z",
  },
  {
    id: "scripts/night-train-ch06.docx",
    folderId: "scripts",
    name: "night-train-ch06.docx",
    size: 48640,
    modified: "2026-10-03T11:30:00Z",
  },
  {
    id: "scripts/paper-moon-outline.md",
    folderId: "scripts",
    name: "paper-moon-outline.md",
    size: 9216,
    modified: "2026-08-10T11:30:00Z",
  },
  {
    id: "scripts/last-ronin-pitch.pdf",
    folderId: "scripts",
    name: "last-ronin-pitch.pdf",
    size: 2097152,
    modified: "2026-09-20T11:30:00Z",
  },
  {
    id: "scripts/reference-photos.zip",
    folderId: "scripts",
    name: "reference-photos.zip",
    size: 73400320,
    modified: "2026-09-12T11:30:00Z",
  },
];
