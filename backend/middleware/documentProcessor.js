/**
 * documentProcessor.js
 * 
 * Simulates the Azure Function document processing logic.
 * In production, this runs as a real Azure Function triggered by Blob Storage events.
 * Locally, we call it directly after upload for demo/testing.
 */

const { v4: uuidv4 } = require('uuid');
const ProcessedFile = require('../models/ProcessedFile');
const ProcessingLog = require('../models/ProcessingLog');
const UploadedFile = require('../models/UploadedFile');

// ─── Simulate text extraction (in prod: integrate Azure Cognitive Services) ───
const extractTextFromBuffer = (buffer, mimeType) => {
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    return buffer.toString('utf-8');
  }
  if (mimeType === 'application/pdf') {
    return '[PDF text extraction requires Azure Cognitive Services / Form Recognizer in production]';
  }
  if (mimeType.startsWith('image/')) {
    return '[Image OCR requires Azure Computer Vision in production]';
  }
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
    return '[Word document extraction requires mammoth.js or Azure Form Recognizer in production]';
  }
  return '[Binary file – text extraction not available for this format]';
};

// ─── Generate metadata ────────────────────────────────────────────────────────
const generateMetadata = (file, extractedText) => {
  const words = extractedText.trim().split(/\s+/).filter(w => w.length > 0);
  return {
    word_count: words.length,
    char_count: extractedText.length,
    line_count: extractedText.split('\n').length,
    processing_engine: 'DocuStream-AzureFunction-v1',
    azure_function_id: `func-${uuidv4().slice(0, 8)}`
  };
};

// ─── Log helper ───────────────────────────────────────────────────────────────
const writeLog = async (fileId, eventType, message, errorStatus = 'none', detail = '', execTime = 0) => {
  try {
    await ProcessingLog.create({
      log_id: uuidv4(),
      file_id: fileId,
      event_type: eventType,
      log_message: message,
      error_status: errorStatus,
      error_detail: detail,
      execution_time: execTime
    });
  } catch (_) {
    // Log write failure should not crash processing
    console.warn('⚠️  Could not write processing log (DB may be offline)');
  }
};

// ─── Main processing function (mimics Azure Blob Trigger Function) ────────────
const processDocument = async (fileId, fileBuffer, mimeType, originalName, uploadedFileDoc = null) => {
  const startTime = Date.now();
  const processId = uuidv4();

  console.log(`\n🔄 [Azure Function Trigger] Processing started for file: ${originalName}`);
  await writeLog(fileId, 'trigger', `Azure Function triggered for file: ${originalName}`);

  try {
    // Update upload status to processing
    if (uploadedFileDoc) {
      await UploadedFile.findOneAndUpdate(
        { file_id: fileId },
        { upload_status: 'processing', processing_status: 'processing' }
      ).catch(() => {});
    }

    await writeLog(fileId, 'processing', `Starting document processing: ${originalName}`);

    // ── Step 1: Validate file ────────────────────────────────────────────────
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty or invalid');
    }

    // ── Step 2: Extract text/content ─────────────────────────────────────────
    const extractedText = extractTextFromBuffer(fileBuffer, mimeType);
    const meta = generateMetadata({ originalName, mimeType }, extractedText);

    // ── Step 3: Save processed result ────────────────────────────────────────
    const processingDuration = Date.now() - startTime;

    await ProcessedFile.create({
      process_id: processId,
      file_id: fileId,
      processed_time: new Date(),
      processing_status: 'success',
      extracted_text: extractedText,
      word_count: meta.word_count,
      char_count: meta.char_count,
      processing_duration_ms: processingDuration,
      metadata: {
        file_type: mimeType,
        file_size: fileBuffer.length,
        original_name: originalName,
        processing_engine: meta.processing_engine,
        azure_function_id: meta.azure_function_id
      }
    }).catch(() => {});

    // ── Step 4: Update file status to processed ───────────────────────────────
    await UploadedFile.findOneAndUpdate(
      { file_id: fileId },
      {
        upload_status: 'processed',
        processing_status: 'completed',
        processed_at: new Date(),
        metadata: meta
      }
    ).catch(() => {});

    await writeLog(
      fileId,
      'completion',
      `Processing completed successfully in ${processingDuration}ms`,
      'none',
      '',
      processingDuration
    );

    console.log(`✅ [Azure Function] Processing complete: ${originalName} (${processingDuration}ms)`);

    return {
      success: true,
      process_id: processId,
      file_id: fileId,
      extracted_text: extractedText,
      word_count: meta.word_count,
      char_count: meta.char_count,
      processing_duration_ms: processingDuration
    };

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Azure Function] Processing failed for ${originalName}:`, err.message);

    await UploadedFile.findOneAndUpdate(
      { file_id: fileId },
      { upload_status: 'failed', processing_status: 'failed' }
    ).catch(() => {});

    await writeLog(
      fileId,
      'error',
      `Processing failed: ${err.message}`,
      'error',
      err.stack,
      duration
    );

    return {
      success: false,
      process_id: processId,
      file_id: fileId,
      error: err.message,
      processing_duration_ms: duration
    };
  }
};

module.exports = { processDocument };