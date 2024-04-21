import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // @ts-ignore
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
  // @ts-ignore
    .onUploadComplete(async ({ metadata, file }) => {
      return { file };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
