import { list } from "@vercel/blob";

const json = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { success: false, error: "Use GET" });
  }
  const id = String(req.query?.id ?? "");
  if (!id || id.length > 500 || /[\r\n]/.test(id)) {
    return json(res, 400, { success: false, error: "Valid track id required" });
  }

  try {
    // Only redirect to a blob that exists in this project's own Blob store.
    let found = null;
    let cursor;
    do {
      const page = await list({ cursor, limit: 1000 });
      found = page.blobs.find(blob => blob.pathname === id) || null;
      cursor = page.hasMore && !found ? page.cursor : undefined;
    } while (cursor && !found);

    if (!found) return json(res, 404, { success: false, error: "Track not found" });

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", found.contentType || "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${(found.pathname.split("/").pop() || "track.mp3").replace(/["\\\r\n]/g, "_")}"`);
    return res.redirect(302, found.downloadUrl);
  } catch {
    return json(res, 500, { success: false, error: "Download lookup failed. Check Vercel Blob connection." });
  }
}