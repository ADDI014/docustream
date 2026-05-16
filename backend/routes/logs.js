const express = require('express');
const ProcessingLog = require('../models/ProcessingLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/logs – get all logs (admin or by file_id) ──────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { file_id, event_type, error_status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (file_id) query.file_id = file_id;
    if (event_type) query.event_type = event_type;
    if (error_status) query.error_status = error_status;

    const [logs, total] = await Promise.all([
      ProcessingLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ProcessingLog.countDocuments(query)
    ]);

    res.json({
      logs,
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

// ─── GET /api/logs/:fileId – logs for specific file ──────────────────────────
router.get('/:fileId', async (req, res) => {
  try {
    const logs = await ProcessingLog.find({ file_id: req.params.fileId })
      .sort({ timestamp: 1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;