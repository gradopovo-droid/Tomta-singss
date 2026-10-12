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
  const q = String(req.query?.q ?? "").trim().toLowerCase();
  if (!q || q.length > 120) {
    return json(res, 400, { success: false, error: "Add a search query: ?q=song name" });
  }

  try {
    const results = [];
    let cursor;
    do {
      const page = await list({ cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const filename = decodeURIComponent(blob.pathname.split("/").pop() || blob.pathname);
        if (filename.toLowerCase().includes(q)) {
          results.push({
            id: blob.pathname,
            title: filename.replace(/\.[^.]+$/, ""),
            filename,
            size: blob.size,
            contentType: blob.contentType || "audio/mpeg",
            downloadUrl: `/api/download?id=${encodeURIComponent(blob.pathname)}`
          });
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && results.length < 100);

    return json(res, 200, { success: true, count: results.length, results: results.slice(0, 100) });
  } catch (err) {
    return json(res, 500, {
      success: false,
      error: "Could not search storage. Check that Vercel Blob is connected.",
      detail: process.env.NODE_ENV === "development" ? err?.message : undefined
    });
  }
}