import React, { useState, useRef, useCallback } from 'react';
import api from '../utils/api';
import { formatBytes, getFileIcon } from '../utils/helpers';
import './UploadPage.css';

const ALLOWED_TYPES = ['application/pdf','text/plain','image/jpeg','image/png','image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword','text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const UploadPage = ({ toast, onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Allowed: PDF, TXT, DOCX, CSV, JPG, PNG, GIF, XLSX';
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'File size exceeds 50MB limit';
    }
    return null;
  };

  const handleFile = (file) => {
    const err = validateFile(file);
    if (err) { setError(err); toast.error(err); return; }
    setSelectedFile(file);
    setError('');
    setResult(null);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 90);
          setProgress(pct);
        }
      });
      setProgress(100);
      setResult(res.data);
      toast.success('File uploaded and processing triggered!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Check if backend is running.';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
    setProgress(0);
  };

  return (
    <div className="upload-page">
      <div className="upload-page-inner">
        <div className="page-header fade-in">
          <div className="section-tag">Azure Blob Storage</div>
          <h1>Upload Document</h1>
          <p>Select a document to upload to Azure Blob Storage. Processing is automatically triggered.</p>
        </div>

        {/* Drop Zone */}
        {!result && (
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''} fade-in`}
            onDragEnter={handleDrag} onDragOver={handleDrag}
            onDragLeave={handleDrag} onDrop={handleDrop}
            onClick={() => !selectedFile && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".pdf,.txt,.docx,.doc,.jpg,.jpeg,.png,.gif,.csv,.xlsx"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {!selectedFile ? (
              <div className="drop-zone-empty">
                <div className="drop-icon">
                  <svg viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
                    <path d="M32 44V24M24 32l8-8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Drop your document here</h2>
                <p>or click to browse</p>
                <div className="file-type-chips">
                  {['PDF', 'DOCX', 'TXT', 'CSV', 'JPG', 'PNG', 'XLSX'].map(t => (
                    <span key={t} className="file-chip">{t}</span>
                  ))}
                </div>
                <p className="size-limit">Max file size: 50MB</p>
              </div>
            ) : (
              <div className="selected-file">
                <div className="file-icon-large">{getFileIcon(selectedFile.type)}</div>
                <div className="file-details">
                  <h3 className="file-name">{selectedFile.name}</h3>
                  <p className="file-meta">
                    <span>{formatBytes(selectedFile.size)}</span>
                    <span className="dot">·</span>
                    <span>{selectedFile.type || 'Unknown type'}</span>
                  </p>
                </div>
                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); reset(); }}>✕</button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="upload-error fade-in">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="progress-section fade-in">
            <div className="progress-header">
              <span>Uploading to Azure Blob Storage...</span>
              <span className="mono">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-steps">
              <span className={progress >= 30 ? 'done' : ''}>Validating</span>
              <span>→</span>
              <span className={progress >= 60 ? 'done' : ''}>Uploading to Azure</span>
              <span>→</span>
              <span className={progress >= 90 ? 'done' : ''}>Triggering Function</span>
              <span>→</span>
              <span className={progress === 100 ? 'done' : ''}>Complete</span>
            </div>
          </div>
        )}

        {/* Action button */}
        {selectedFile && !result && (
          <div className="upload-actions fade-in">
            <button className="btn-upload" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <><span className="spin">⟳</span> Uploading...</>
              ) : (
                <>Upload to Azure Cloud ☁️</>
              )}
            </button>
            <button className="btn-cancel" onClick={reset} disabled={uploading}>Cancel</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="upload-result fade-in">
            <div className="result-header">
              <div className="result-success-icon">✓</div>
              <div>
                <h2>Upload Successful!</h2>
                <p>Azure Function processing has been triggered automatically.</p>
              </div>
            </div>

            <div className="result-grid">
              <div className="result-item">
                <label>File ID</label>
                <span className="mono">{result.file?.file_id}</span>
              </div>
              <div className="result-item">
                <label>File Name</label>
                <span>{result.file?.original_name}</span>
              </div>
              <div className="result-item">
                <label>File Size</label>
                <span>{formatBytes(result.file?.file_size)}</span>
              </div>
              <div className="result-item">
                <label>Blob Storage URL</label>
                <span className="mono url-truncate">{result.file?.blob_name}</span>
              </div>
              <div className="result-item">
                <label>Upload Status</label>
                <span className="badge uploaded">{result.file?.upload_status}</span>
              </div>
              <div className="result-item">
                <label>Processing Status</label>
                <span className="badge pending">{result.file?.processing_status}</span>
              </div>
            </div>

            <div className="result-pipeline">
              <div className="pipeline-step done">
                <span className="pip-icon">✓</span>
                <span>File Uploaded</span>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-step done">
                <span className="pip-icon">✓</span>
                <span>Stored in Azure Blob</span>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-step active">
                <span className="pip-icon spin">⟳</span>
                <span>Azure Function Triggered</span>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-step">
                <span className="pip-icon">⏳</span>
                <span>Processing</span>
              </div>
            </div>

            <div className="result-actions">
              <button className="btn-upload" onClick={() => onNavigate('files')}>View My Files</button>
              <button className="btn-cancel" onClick={reset}>Upload Another</button>
            </div>
          </div>
        )}

        {/* Supported formats */}
        <div className="formats-info fade-in">
          <h3>Supported File Formats</h3>
          <div className="formats-grid">
            {[
              { ext: 'PDF', desc: 'Portable Document Format' },
              { ext: 'DOCX', desc: 'Microsoft Word' },
              { ext: 'TXT', desc: 'Plain Text' },
              { ext: 'CSV', desc: 'Comma-Separated Values' },
              { ext: 'JPG/PNG', desc: 'Images (JPEG, PNG, GIF)' },
              { ext: 'XLSX', desc: 'Microsoft Excel' }
            ].map(f => (
              <div key={f.ext} className="format-item">
                <span className="format-ext">{f.ext}</span>
                <span className="format-desc">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;