
export default async function handler(req, res) {
  const q = req.query.q?.trim();
  const clientId = process.env.JAMENDO_CLIENT_ID;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Song name missing"
    });
  }

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: "JAMENDO_CLIENT_ID environment variable missing"
    });
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      namesearch: q,
      limit: "10",
      audioformat: "mp32",
      order: "popularity_total"
    });

    const response = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?${params}`
    );

    const data = await response.json();

    if (!response.ok || data.headers?.status === "failed") {
      return res.status(502).json({
        success: false,
        error: "Jamendo API request failed"
      });
    }

    const results = (data.results || []).map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artist_name,
      image: track.album_image || track.image,
      duration: track.duration,
      audio: track.audio || null,
      download: track.audiodownload || null,
      source: "Jamendo"
    }));

    return res.status(200).json({
      success: true,
      query: q,
      count: results.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Audio search failed"
    });
  }
}
