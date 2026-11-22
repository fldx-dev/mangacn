"use client";

import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadTrigger,
} from "@/registry/ui/file-upload/file-upload";

export default function FileUploadAvatarVariant() {
  return (
    <form className="w-full max-w-sm">
      <Field>
        <FieldLabel htmlFor="file-upload-avatar">Profile picture</FieldLabel>
        <FileUpload
          name="avatar"
          accept="image/png,image/jpeg"
          multiple={false}
          maxSize={1024 * 1024}
          labels={{ dropzone: "Drop one picture here, or choose it." }}
        >
          <FileUploadDropzone className="py-6">
            <FileUploadTrigger
              id="file-upload-avatar"
              aria-describedby="file-upload-avatar-description"
            />
          </FileUploadDropzone>
          <FileUploadList />
        </FileUpload>
        <FieldDescription id="file-upload-avatar-description">
          A PNG or JPEG up to 1 MB. A new picture replaces the old one.
        </FieldDescription>
      </Field>
    </form>
  );
}
