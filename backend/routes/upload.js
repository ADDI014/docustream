const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadToBlob, ALLOWED_TYPES, MAX_FILE_SIZE } = require('../config/azure');
const { processDocument } = require('../middleware/documentProcessor');
const UploadedFile = require('../models/UploadedFile');
const ProcessingLog = require('../models/ProcessingLog');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── Multer config – store in memory ─────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, TXT, JPG, PNG, GIF, DOCX, XLSX, CSV`), false);
    }
  }
});

// ─── POST /api/upload ─────────────────────────────────────────────────────────
router.post('/', optionalAuth, upload.single('file'), async (req, res) => {
  const uploadStart = Date.now();

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided. Include a file in the "file" field.' });
  }

  const fileId = uuidv4();
  const userId = req.user ? (req.user._id || req.user.id).toString() : 'anonymous';
  const { originalname, mimetype, buffer, size } = req.file;

  try {
    // ── 1. Log upload start ────────────────────────────────────────────────────
    await ProcessingLog.create({
      log_id: uuidv4(),
      file_id: fileId,
      event_type: 'upload',
      log_message: `Upload initiated: ${originalname} (${(size / 1024).toFixed(1)} KB)`,
      metadata: { userId, mimeType: mimetype, size }
    }).catch(() => {});

    // ── 2. Upload to Azure Blob Storage ───────────────────────────────────────
    console.log(`📤 Uploading to Azure Blob Storage: ${originalname}`);
    const blobResult = await uploadToBlob(buffer, originalname, mimetype, userId);

    // ── 3. Save file record to DB ─────────────────────────────────────────────
    const fileDoc = await UploadedFile.create({
      file_id: fileId,
      user_id: req.user ? (req.user._id || req.user.id) : undefined,
      file_name: blobResult.blobName.split('/').pop(),
      original_name: originalname,
      file_type: mimetype,
      file_size: size,
      blob_url: blobResult.url,
      blob_name: blobResult.blobName,
      upload_status: 'uploaded',
      upload_time: new Date()
    }).catch((err) => {
      console.warn('⚠️  Could not save to DB:', err.message);
      return null;
    });

    // ── 4. Increment user upload count ────────────────────────────────────────
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id || req.user.id, { $inc: { upload_count: 1 } }).catch(() => {});
    }

    // ── 5. Trigger async processing (mimics Blob trigger → Azure Function) ────
    setImmediate(async () => {
      await processDocument(fileId, buffer, mimetype, originalname, fileDoc);
    });

    const uploadDuration = Date.now() - uploadStart;

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully. Processing triggered.',
      file: {
        file_id: fileId,
        original_name: originalname,
        file_type: mimetype,
        file_size: size,
        blob_url: blobResult.url,
        blob_name: blobResult.blobName,
        upload_status: 'uploaded',
        processing_status: 'pending',
        upload_time: new Date().toISOString()
      },
      upload_duration_ms: uploadDuration
    });

  } catch (err) {
    console.error('❌ Upload error:', err.message);

    await ProcessingLog.create({
      log_id: uuidv4(),
      file_id: fileId,
      event_type: 'error',
      log_message: `Upload failed: ${err.message}`,
      error_status: 'error',
      error_detail: err.stack
    }).catch(() => {});

    if (err.message.includes('not configured') || err.message.includes('connection')) {
      return res.status(503).json({
        error: 'Azure Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING in backend/.env',
        detail: err.message
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;