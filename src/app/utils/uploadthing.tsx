import { generateReactHelpers } from "@uploadthing/react/hooks";
import { OurFileRouter } from "../api/uploadthing/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
