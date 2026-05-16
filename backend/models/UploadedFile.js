const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  file_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous uploads
  },
  file_name: {
    type: String,
    required: true
  },
  original_name: {
    type: String,
    required: true
  },
  file_type: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  blob_url: {
    type: String,
    required: true
  },
  blob_name: {
    type: String,
    required: true
  },
  upload_status: {
    type: String,
    enum: ['uploading', 'uploaded', 'processing', 'processed', 'failed'],
    default: 'uploading'
  },
  processing_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  upload_time: {
    type: Date,
    default: Date.now
  },
  processed_at: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
uploadedFileSchema.index({ user_id: 1, upload_time: -1 });
uploadedFileSchema.index({ upload_status: 1 });
uploadedFileSchema.index({ file_id: 1 });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);