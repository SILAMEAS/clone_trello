import { createNextRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
import { UTApi } from "uploadthing/server";

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
});

async function deleteImage(request: Request) {

  let data = await request.json();
  const utapi = new UTApi();

  const body = data as string | string[]
  if (!body.length) return Response.json({ message: "url required" });

  const paths: string[] = []

  if (Array.isArray(body)) {
    for (const url of body) {
      const path = url.substring(url.lastIndexOf("/") + 1);
      paths.push(path)
    }
  } else {
    const path = body.substring(body.lastIndexOf("/") + 1);
    paths.push(path)
  }
  await utapi.deleteFiles(paths)
  return Response.json({ message: "ok" });
}

export const DELETE = deleteImage