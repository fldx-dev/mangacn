import { FileImageIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { type TreeNode, TreeView } from "@/registry/ui/tree-view/tree-view";

const folder = <FolderIcon />;
const page = <FileImageIcon />;
const text = <FileTextIcon />;

// A manga project's files.
const items: TreeNode[] = [
  {
    id: "chapter-01",
    label: "chapter-01",
    icon: folder,
    children: [
      {
        id: "chapter-01/pencils",
        label: "pencils",
        icon: folder,
        children: [
          { id: "chapter-01/pencils/page-01.psd", label: "page-01.psd", icon: page },
          { id: "chapter-01/pencils/page-02.psd", label: "page-02.psd", icon: page },
        ],
      },
      {
        id: "chapter-01/inks",
        label: "inks",
        icon: folder,
        children: [{ id: "chapter-01/inks/page-01.tif", label: "page-01.tif", icon: page }],
      },
      { id: "chapter-01/script.md", label: "script.md", icon: text },
    ],
  },
  {
    id: "chapter-02",
    label: "chapter-02",
    icon: folder,
    children: [{ id: "chapter-02/thumbnails.pdf", label: "thumbnails.pdf", icon: page }],
  },
  {
    id: "character-sheets",
    label: "character-sheets",
    icon: folder,
    children: [
      { id: "character-sheets/hero.png", label: "hero.png", icon: page },
      { id: "character-sheets/rival.png", label: "rival.png", icon: page },
    ],
  },
  {
    id: "series-bible-with-a-very-long-name.md",
    label: "series-bible-with-a-very-long-name-for-every-arc.md",
    icon: text,
  },
];

export default function TreeViewDefaultDemo() {
  return (
    <TreeView
      items={items}
      defaultExpanded={["chapter-01", "chapter-01/pencils"]}
      defaultSelected="chapter-01/pencils/page-02.psd"
      aria-label="Project files"
      className="max-w-72"
    />
  );
}
