// Where uploaded photos and videos are kept.
//  - Your computer, cPanel or a VPS: the backend's uploads/ folder (served at /uploads/...).
//  - Vercel: files cannot be saved on the server there, so they go to Vercel Blob
//    (used automatically when the BLOB_READ_WRITE_TOKEN environment variable is set).
const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Save a file and return the address to store in the database.
 * @param {string} relPath  e.g. '2026/11/iphone-ab12c.jpg'
 */
async function saveUpload(relPath, buf, contentType) {
  if (useBlob()) {
    const { put } = require('@vercel/blob');
    const blob = await put(`uploads/${relPath}`, buf, {
      access: 'public',
      contentType,
      addRandomSuffix: false, // the file name already ends with a random token
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  }
  const file = path.join(UPLOAD_ROOT, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return `/uploads/${relPath}`;
}

module.exports = { saveUpload, useBlob, UPLOAD_ROOT };
