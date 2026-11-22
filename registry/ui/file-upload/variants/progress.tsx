"use client";

import * as React from "react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadList,
  FileUploadTrigger,
} from "@/registry/ui/file-upload/file-upload";

type Upload = { progress: number; failed?: string };

// The upload is simulated here, in the variant only: file-upload sends nothing itself. An app posts
// each file and passes its progress to FileUploadItem the same way.
function seed(): [File[], Map<File, Upload>] {
  const make = (name: string, kb: number) =>
    new File([new Uint8Array(kb * 1024)], name, { type: "image/png", lastModified: 0 });
  const files = [make("chapter-12-p01.png", 840), make("chapter-12-p02.png", 912)];
  const failed = make("chapter-12-cover-final-final-v3.png", 2300);
  return [
    [...files, failed],
    new Map([
      [files[0], { progress: 100 }],
      [files[1], { progress: 40 }],
      [failed, { progress: 0, failed: "The server refused the file. Try again." }],
    ]),
  ];
}

export default function FileUploadProgressVariant() {
  const [initial] = React.useState(seed);
  const [files, setFiles] = React.useState<File[]>(initial[0]);
  const [uploads, setUploads] = React.useState<Map<File, Upload>>(initial[1]);

  // Files added after the first render "upload" ten percent at a time; the seeded rows stay put.
  React.useEffect(() => {
    const timer = setInterval(() => {
      setUploads((current) => {
        let changed = false;
        const next = new Map(current);
        for (const [file, upload] of current) {
          if (upload.failed || upload.progress >= 100) continue;
          if (initial[0].includes(file)) continue;
          next.set(file, { progress: Math.min(100, upload.progress + 10) });
          changed = true;
        }
        return changed ? next : current;
      });
    }, 400);
    return () => clearInterval(timer);
  }, [initial]);

  const onValueChange = (next: File[]) => {
    setFiles(next);
    setUploads((current) => {
      const map = new Map<File, Upload>();
      for (const file of next) map.set(file, current.get(file) ?? { progress: 0 });
      return map;
    });
  };

  return (
    <FileUpload value={files} onValueChange={onValueChange} accept="image/*" className="max-w-md">
      <FileUploadDropzone>
        <FileUploadTrigger />
      </FileUploadDropzone>
      <FileUploadList>
        {files.map((file) => {
          const upload = uploads.get(file) ?? { progress: 0 };
          const status = upload.failed ? "error" : upload.progress >= 100 ? "done" : "uploading";
          return (
            <FileUploadItem
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              progress={upload.progress}
              status={status}
              error={upload.failed}
            />
          );
        })}
      </FileUploadList>
    </FileUpload>
  );
}
