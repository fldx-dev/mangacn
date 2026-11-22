import { FileManager } from "@/registry/blocks/file-manager-01/components/file-manager";
import {
  fileManagerFiles,
  fileManagerFolders,
  fileManagerStartFolder,
} from "@/registry/blocks/file-manager-01/components/file-manager-data";

// The page's file manager on its own; /view/file-manager-01 is the whole page with its heading.
export default function FileManager01DefaultVariant() {
  return (
    <FileManager
      folders={fileManagerFolders}
      defaultFiles={fileManagerFiles}
      defaultFolder={fileManagerStartFolder}
    />
  );
}
