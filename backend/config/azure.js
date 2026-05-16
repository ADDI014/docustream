const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// ─── Allowed file types ───────────────────────────────────────────────────────
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── Get BlobServiceClient ────────────────────────────────────────────────────
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set in environment variables');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
};

// ─── Get container client ─────────────────────────────────────────────────────
const getContainerClient = async () => {
  const blobServiceClient = getBlobServiceClient();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Create container if it doesn't exist
  await containerClient.createIfNotExists();
  return containerClient;
};

// ─── Upload file to Azure Blob Storage ───────────────────────────────────────
const uploadToBlob = async (fileBuffer, originalName, mimeType, userId = 'anonymous') => {
  if (!ALLOWED_TYPES[mimeType]) {
    throw new Error(`File type '${mimeType}' is not supported`);
  }
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 50MB limit`);
  }

  const containerClient = await getContainerClient();

  // Generate unique blob name: userId/timestamp-uuid-originalname
  const ext = path.extname(originalName) || `.${ALLOWED_TYPES[mimeType]}`;
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blobName = `${userId}/${Date.now()}-${uuidv4()}${ext}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const uploadResponse = await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
    blobHTTPHeaders: {
      blobContentType: mimeType,
      blobContentDisposition: `attachment; filename="${safeName}"`
    },
    metadata: {
      originalName: encodeURIComponent(originalName),
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  });

  return {
    blobName,
    url: blockBlobClient.url,
    etag: uploadResponse.etag,
    requestId: uploadResponse.requestId
  };
};

// ─── Delete blob ──────────────────────────────────────────────────────────────
const deleteBlob = async (blobName) => {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

// ─── Download blob ────────────────────────────────────────────────────────────
const downloadBlob = async (blobName) => {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);
  return downloadResponse;
};

// ─── List blobs ───────────────────────────────────────────────────────────────
const listBlobs = async (prefix = '') => {
  const containerClient = await getContainerClient();
  const blobs = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    blobs.push({
      name: blob.name,
      size: blob.properties.contentLength,
      contentType: blob.properties.contentType,
      lastModified: blob.properties.lastModified,
      etag: blob.properties.etag
    });
  }
  return blobs;
};

// ─── Get blob properties ──────────────────────────────────────────────────────
const getBlobProperties = async (blobName) => {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const props = await blockBlobClient.getProperties();
  return props;
};

module.exports = {
  uploadToBlob,
  deleteBlob,
  downloadBlob,
  listBlobs,
  getBlobProperties,
  ALLOWED_TYPES,
  MAX_FILE_SIZE
};