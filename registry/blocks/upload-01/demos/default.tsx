import { uploadSeries } from "@/registry/blocks/upload-01/components/upload-data";
import { UploadForm } from "@/registry/blocks/upload-01/components/upload-form";

// The page's form on its own; /view/upload-01 is the whole page with its heading.
export default function Upload01DefaultDemo() {
  return <UploadForm series={uploadSeries} className="max-w-[48rem]" />;
}
