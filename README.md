# My Licensed Music API (Vercel + Blob)

This project stores audio files that you own or are authorized to distribute, searches uploaded filenames, and returns a download route suitable for your own app/bot.

## 1. Deploy
1. Upload these files to a GitHub repository and import it into Vercel.
2. In Vercel, open Storage / Blob and create or connect a Blob store to this project.
3. In Project Settings → Environment Variables, set `UPLOAD_ADMIN_KEY` to a long random secret.
4. Redeploy.

## 2. Upload
Open your deployed domain at `/` (example `https://YOUR-PROJECT.vercel.app/`), enter the admin key and choose an audio file. Only upload audio you own or are licensed to distribute. Browser upload uses Vercel Blob client uploads, not a large file POST through the serverless function.

## 3. API routes
- `GET /api/search?q=kesariya` — searches stored filenames.
- `GET /api/download?id=EXACT_BLOB_PATHNAME` — checks that the file exists in this project's Blob store and redirects to its public audio URL.
- `POST /api/upload` — upload-token endpoint used by the browser upload page. It requires `x-admin-key`.

Search result example:
```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "id": "track-abc.mp3",
      "title": "track-abc",
      "filename": "track-abc.mp3",
      "size": 123456,
      "contentType": "audio/mpeg",
      "downloadUrl": "/api/download?id=track-abc.mp3"
    }
  ]
}
```

## 4. Baileys
Use the `downloadUrl` from a search result, resolve it against your API domain, and send it as an audio message. For larger files, your bot should download/stream from the URL and respect WhatsApp's media size limits.

Example:
```js
const apiBase = "https://YOUR-PROJECT.vercel.app";
const searchRes = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}`);
const search = await searchRes.json();
if (!search.success || !search.results.length) throw new Error("No matching audio");
const track = search.results[0];
const downloadUrl = new URL(track.downloadUrl, apiBase).toString();
await sock.sendMessage(jid, {
  audio: { url: downloadUrl },
  mimetype: "audio/mpeg",
  fileName: track.filename.endsWith(".mp3") ? track.filename : `${track.title}.mp3`
});
```

## Notes
- Vercel Blob is persistent storage; the Vercel function filesystem is not.
- This project searches filenames, not commercial streaming catalogues.
- The API cannot make unauthorized songs legal. Use files you own or have permission to redistribute.
- Public Blob URLs are public. Do not upload private recordings or confidential audio.
