import api from './api';

/**
 * Step 1: Get a signed upload signature from our backend.
 */
const getUploadSignature = async () => {
  const res = await api.get('/upload/signature');
  return res.data; // { timestamp, signature, apiKey, cloudName, folder }
};

/**
 * Step 2: Upload a single file to Cloudinary using the backend's signature.
 * Returns the secure Cloudinary URL.
 */
const uploadImage = async (file, signatureData) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const data = await response.json();
  return data.secure_url;
};

/**
 * Main export: Upload multiple files.
 * Fetches signature once, then uploads all files in parallel.
 * Returns an array of secure Cloudinary URLs.
 */
export const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];
  const signatureData = await getUploadSignature();
  const urls = await Promise.all(files.map((file) => uploadImage(file, signatureData)));
  return urls;
};
