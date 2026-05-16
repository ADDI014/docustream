const mongoose = require('mongoose');

const processedFileSchema = new mongoose.Schema({
  process_id: {
    type: String,
    required: true,
    unique: true
  },
  file_id: {
    type: String,
    required: true
  },
  original_file_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadedFile'
  },
  processed_time: {
    type: Date,
    default: Date.now
  },
  processing_status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  extracted_text: {
    type: String,
    default: ''
  },
  word_count: {
    type: Number,
    default: 0
  },
  char_count: {
    type: Number,
    default: 0
  },
  output_location: {
    type: String
  },
  processing_duration_ms: {
    type: Number,
    default: 0
  },
  metadata: {
    file_type: String,
    file_size: Number,
    original_name: String,
    processing_engine: { type: String, default: 'AzureFunction-v1' },
    azure_function_id: String
  }
}, {
  timestamps: true
});

processedFileSchema.index({ file_id: 1 });
processedFileSchema.index({ processed_time: -1 });

module.exports = mongoose.model('ProcessedFile', processedFileSchema);

