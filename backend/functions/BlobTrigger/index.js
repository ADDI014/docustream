/**
 * DocuStream – Azure Blob Trigger Function
 * 
 * This function is automatically triggered whenever a new document is uploaded
 * to the Azure Blob Storage container "documents".
 * 
 * Trigger: BlobTrigger on "documents/{name}"
 * 
 * To deploy:
 *   az functionapp create --resource-group docustream-rg --name docustream-func --runtime node --runtime-version 18 --functions-version 4 --storage-account docustreamstore
 *   func azure functionapp publish docustream-func
 */

const { v4: uuidv4 } = require('uuid');

// ─── Function definition (function.json style for v3, or exported config for v4) ─
module.exports = async function (context, myBlob) {
  const startTime = Date.now();
  const blobName = context.bindingData.name;
  const blobSize = myBlob.length;

  context.log(`\n🔔 [Azure Blob Trigger] New document detected: ${blobName}`);
  context.log(`   Size: ${(blobSize / 1024).toFixed(2)} KB`);
  context.log(`   Trigger Time: ${new Date().toISOString()}`);

  try {
    // ── Step 1: Detect file type ────────────────────────────────────────────────
    const ext = blobName.split('.').pop().toLowerCase();
    const mimeMap = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      csv: 'text/csv',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    context.log(`   File type detected: ${mimeType}`);

    // ── Step 2: Validate file ──────────────────────────────────────────────────
    if (blobSize === 0) {
      throw new Error('File is empty');
    }
    if (blobSize > 50 * 1024 * 1024) {
      throw new Error('File exceeds 50MB limit');
    }

    // ── Step 3: Extract text content ──────────────────────────────────────────
    let extractedText = '';
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      extractedText = myBlob.toString('utf-8');
    } else {
      extractedText = `[${ext.toUpperCase()} content – integrate Azure Cognitive Services for text extraction]`;
    }

    const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // ── Step 4: Generate metadata ──────────────────────────────────────────────
    const processingResult = {
      process_id: uuidv4(),
      blob_name: blobName,
      file_type: mimeType,
      file_size: blobSize,
      extracted_text: extractedText.slice(0, 5000), // cap at 5000 chars for output
      word_count: wordCount,
      char_count: extractedText.length,
      processing_status: 'success',
      processing_engine: 'DocuStream-AzureFunction-v1',
      processed_at: new Date().toISOString(),
      processing_duration_ms: Date.now() - startTime
    };

    context.log(`✅ [Azure Function] Processing complete:`);
    context.log(`   Words extracted: ${wordCount}`);
    context.log(`   Duration: ${processingResult.processing_duration_ms}ms`);

    // Output binding – write result to output blob (optional)
    // context.bindings.outputBlob = JSON.stringify(processingResult);

    context.done();
  } catch (err) {
    context.log.error(`❌ [Azure Function] Processing failed: ${err.message}`);
    context.done(err);
  }
};