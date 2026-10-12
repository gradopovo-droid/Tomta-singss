const json = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, {
      success: false,
      error: "Use GET"
    });
  }

  const q = String(req.query?.q ?? "").trim();

  if (!q || q.length > 120) {
    return json(res, 400, {
      success: false,
      error: "Use /api/search?q=song-name"
    });
  }

  try {
    const endpoint = new URL(
      "https://saavn.sumit.co/api/search/songs"
    );
    endpoint.searchParams.set("query", q);

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return json(res, 502, {
        success: false,
        error: "Song search provider unavailable",
        providerStatus: response.status
      });
    }

    const data = await response.json();
    const raw = data?.data?.results
      ?? data?.results
      ?? data?.data
      ?? [];

    const songs = (Array.isArray(raw) ? raw : []).map(song => ({
      id: song.id ?? null,
      title: song.name ?? song.title ?? "Unknown",
      artists:
        song.artists?.primary?.map(a => a.name).join(", ")
        ?? song.primaryArtists
        ?? song.singers
        ?? "Unknown",
      album: song.album?.name ?? song.album ?? null,
      duration: song.duration ?? null,
      image: song.image?.[2]?.url
        ?? song.image?.[1]?.url
        ?? song.image?.[0]?.url
        ?? song.image
        ?? null,
      url: song.url ?? song.perma_url ?? null
    }));

    return json(res, 200, {
      success: true,
      query: q,
      count: songs.length,
      results: songs
    });
  } catch (err) {
    return json(res, 502, {
      success: false,
      error: "Song search failed",
      detail: err.message
    });
  }
}
