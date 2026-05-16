const mongoose = require('mongoose');

const processingLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    required: true,
    unique: true
  },
  file_id: {
    type: String,
    ref: 'UploadedFile',
    required: true
  },
  process_id: {
    type: String
  },
  event_type: {
    type: String,
    enum: ['upload', 'trigger', 'processing', 'completion', 'error', 'deletion'],
    required: true
  },
  log_message: {
    type: String,
    required: true
  },
  error_status: {
    type: String,
    enum: ['none', 'warning', 'error', 'critical'],
    default: 'none'
  },
  error_detail: {
    type: String
  },
  execution_time: {
    type: Number, // milliseconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

processingLogSchema.index({ file_id: 1, timestamp: -1 });
processingLogSchema.index({ event_type: 1 });
processingLogSchema.index({ error_status: 1 });

module.exports = mongoose.model('ProcessingLog', processingLogSchema);