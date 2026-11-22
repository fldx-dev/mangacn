"use client";

import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadTrigger,
} from "@/registry/ui/file-upload/file-upload";

export default function FileUploadDefaultVariant() {
  return (
    <FileUpload
      name="pages"
      accept="image/*"
      maxFiles={5}
      maxSize={5 * 1024 * 1024}
      labels={{ dropzone: "Drop up to 5 page scans here (images, 5 MB each), or choose them." }}
      className="max-w-md"
    >
      <FileUploadDropzone>
        <FileUploadTrigger />
      </FileUploadDropzone>
      <FileUploadList />
    </FileUpload>
  );
}
