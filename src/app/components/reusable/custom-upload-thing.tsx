// Note: `useUploadThing` is IMPORTED FROM YOUR CODEBASE using the `generateReactHelpers` function
import { useUploadThing } from "@/app/utils/uploadthing";
import { Button } from "@nextui-org/react";
import { useDropzone } from "@uploadthing/react/hooks";
import { useCallback, useState } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";

export default function CustomUploadThing() {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, permittedFileInfo } = useUploadThing("imageUploader", {
    onClientUploadComplete: (file) => {
      console.log("->", file);
    },
    onUploadError: () => {
      alert("error occurred while uploading");
    },
    // onUploadBegin: () => {
    //   alert("upload has begun");
    // },
  });

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo?.config)
    : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <div>
        {files.length > 0 && (
          <Button
            color="primary"
            variant="shadow"
            onClick={() => startUpload(files)}
          >
            Upload {files.length} files
          </Button>
        )}
      </div>
      Drop files here!
    </div>
  );
}
