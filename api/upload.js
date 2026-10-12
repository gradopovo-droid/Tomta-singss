import { handleUpload } from "@vercel/blob/client";

const json = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { success: false, error: "Use POST" });
  }

  // The browser sends the admin key in clientPayload. Validate it before
  // issuing a Blob upload token.
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!process.env.UPLOAD_ADMIN_KEY || clientPayload !== process.env.UPLOAD_ADMIN_KEY) {
          throw new Error("Invalid admin key");
        }
        const safeName = String(pathname || "track.mp3").split("/").pop();
        if (!/\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(safeName)) {
          throw new Error("Only audio files are allowed");
        }
        return {
          allowedContentTypes: [
            "audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac",
            "audio/ogg", "audio/wav", "audio/flac", "application/octet-stream"
          ],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async () => {}
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    return json(res, 400, {
      success: false,
      error: err?.message || "Upload token could not be created"
    });
  }
}