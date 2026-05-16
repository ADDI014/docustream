const express = require('express');
const UploadedFile = require('../models/UploadedFile');
const ProcessingLog = require('../models/ProcessingLog');
const ProcessedFile = require('../models/ProcessedFile');
const User = require('../models/User');

const router = express.Router();

// ─── GET /api/stats – dashboard statistics ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [
      totalFiles,
      processedFiles,
      failedFiles,
      totalUsers,
      totalLogs,
      recentFiles,
      fileTypeBreakdown,
      recentErrors
    ] = await Promise.all([
      UploadedFile.countDocuments({ is_deleted: false }),
      UploadedFile.countDocuments({ upload_status: 'processed', is_deleted: false }),
      UploadedFile.countDocuments({ upload_status: 'failed', is_deleted: false }),
      User.countDocuments({ is_active: true }).catch(() => 0),
      ProcessingLog.countDocuments(),
      UploadedFile.find({ is_deleted: false })
        .sort({ upload_time: -1 })
        .limit(5)
        .select('original_name file_type file_size upload_status processing_status upload_time'),
      UploadedFile.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$file_type', count: { $sum: 1 }, total_size: { $sum: '$file_size' } } },
        { $sort: { count: -1 } }
      ]).catch(() => []),
      ProcessingLog.find({ error_status: { $in: ['error', 'critical'] } })
        .sort({ timestamp: -1 })
        .limit(5)
        .catch(() => [])
    ]);

    const pendingFiles = totalFiles - processedFiles - failedFiles;
    const successRate = totalFiles > 0 ? ((processedFiles / totalFiles) * 100).toFixed(1) : 0;

    res.json({
      overview: {
        total_files: totalFiles,
        processed_files: processedFiles,
        failed_files: failedFiles,
        pending_files: Math.max(0, pendingFiles),
        total_users: totalUsers,
        total_logs: totalLogs,
        success_rate: parseFloat(successRate)
      },
      recent_files: recentFiles,
      file_type_breakdown: fileTypeBreakdown,
      recent_errors: recentErrors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;