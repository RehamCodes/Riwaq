// One object URL per Blob, for showing stored images (thumbnails, covers).
// Call releaseBlobUrl when the Blob is deleted.
const urls = new WeakMap<Blob, string>();

export function blobUrl(blob: Blob) {
  let url = urls.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urls.set(blob, url);
  }
  return url;
}

export function releaseBlobUrl(blob: Blob) {
  const url = urls.get(blob);
  if (url) URL.revokeObjectURL(url);
  urls.delete(blob);
}
