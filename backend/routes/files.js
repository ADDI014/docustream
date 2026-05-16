const express = require('express');
const { deleteBlob, downloadBlob, listBlobs } = require('../config/azure');
const UploadedFile = require('../models/UploadedFile');
const ProcessedFile = require('../models/ProcessedFile');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/files – list all files (with optional user filter) ──────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { is_deleted: false };
    if (req.user) {
      const userId = req.user._id || req.user.id;
      if (req.user.role !== 'admin') query.user_id = userId;
    }
    if (status) query.upload_status = status;
    if (type) query.file_type = { $regex: type, $options: 'i' };

    const [files, total] = await Promise.all([
      UploadedFile.find(query)
        .sort({ upload_time: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'user_name user_email'),
      UploadedFile.countDocuments(query)
    ]);

    res.json({
      files,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/files/:fileId – get single file details ────────────────────────
router.get('/:fileId', optionalAuth, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({
      file_id: req.params.fileId,
      is_deleted: false
    }).populate('user_id', 'user_name user_email');

    if (!file) return res.status(404).json({ error: 'File not found' });

    // Get processing result if available
    const processed = await ProcessedFile.findOne({ file_id: req.params.fileId });

    res.json({ file, processed: processed || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/files/:fileId/download – stream download ───────────────────────
router.get('/:fileId/download', optionalAuth, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({ file_id: req.params.fileId, is_deleted: false });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const downloadStream = await downloadBlob(file.blob_name);

    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.file_type);

    downloadStream.readableStreamBody.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/files/:fileId ─────────────────────────────────────────────
router.delete('/:fileId', protect, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({ file_id: req.params.fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const userId = req.user._id || req.user.id;
    if (file.user_id && file.user_id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete from Azure Blob
    await deleteBlob(file.blob_name);

    // Soft delete in DB
    await UploadedFile.findOneAndUpdate(
      { file_id: req.params.fileId },
      { is_deleted: true }
    );

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/files/:fileId/status – poll processing status ──────────────────
router.get('/:fileId/status', optionalAuth, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({ file_id: req.params.fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.json({
      file_id: file.file_id,
      upload_status: file.upload_status,
      processing_status: file.processing_status,
      processed_at: file.processed_at,
      metadata: file.metadata
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;