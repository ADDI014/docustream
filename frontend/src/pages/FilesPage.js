import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatBytes, formatDate, getFileIcon } from '../utils/helpers';
import './FilesPage.css';

const FilesPage = ({ toast }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/files?${params}`);
      setFiles(res.data.files || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error('Failed to load files. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const viewFile = async (file) => {
    setSelectedFile(file);
    setProcessedData(null);
    try {
      const res = await api.get(`/files/${file.file_id}`);
      setProcessedData(res.data.processed);
    } catch (_) {}
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.original_name}"? This cannot be undone.`)) return;
    setDeleting(file.file_id);
    try {
      await api.delete(`/files/${file.file_id}`);
      toast.success('File deleted successfully');
      fetchFiles();
      if (selectedFile?.file_id === file.file_id) setSelectedFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const pollStatus = async (fileId) => {
    try {
      const res = await api.get(`/files/${fileId}/status`);
      setFiles(prev => prev.map(f =>
        f.file_id === fileId ? { ...f, upload_status: res.data.upload_status, processing_status: res.data.processing_status } : f
      ));
      if (selectedFile?.file_id === fileId) {
        setSelectedFile(prev => ({ ...prev, upload_status: res.data.upload_status, processing_status: res.data.processing_status }));
      }
      toast.info(`Status: ${res.data.upload_status} / ${res.data.processing_status}`);
    } catch (_) {}
  };

  return (
    <div className="files-page">
      <div className="files-inner">
        {/* Header */}
        <div className="page-header fade-in">
          <div className="section-tag">Azure Blob Storage</div>
          <h1>My Files</h1>
          <p>All documents uploaded to your Azure Blob Storage container.</p>
        </div>

        {/* Controls */}
        <div className="files-controls fade-in">
          <div className="filter-group">
            <label>Filter by status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button className="btn-refresh" onClick={fetchFiles} title="Refresh">
            <span className={loading ? 'spin' : ''}>⟳</span> Refresh
          </button>
        </div>

        <div className="files-layout">
          {/* File list */}
          <div className="files-list">
            {loading ? (
              <div className="loading-state">
                <div className="loader" />
                <p>Loading files from Azure Blob Storage...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-icon">📂</div>
                <h3>No documents found</h3>
                <p>Upload your first document to get started.</p>
              </div>
            ) : (
              <>
                {files.map(file => (
                  <div
                    key={file.file_id || file._id}
                    className={`file-card ${selectedFile?.file_id === file.file_id ? 'selected' : ''} fade-in`}
                    onClick={() => viewFile(file)}
                  >
                    <div className="file-card-icon">{getFileIcon(file.file_type)}</div>
                    <div className="file-card-info">
                      <h4 className="file-card-name">{file.original_name}</h4>
                      <div className="file-card-meta">
                        <span>{formatBytes(file.file_size)}</span>
                        <span className="dot">·</span>
                        <span>{formatDate(file.upload_time)}</span>
                      </div>
                    </div>
                    <div className="file-card-status">
                      <span className={`badge ${file.upload_status}`}>{file.upload_status}</span>
                    </div>
                    <div className="file-card-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" title="Refresh status" onClick={() => pollStatus(file.file_id)}>⟳</button>
                      <button
                        className="btn-icon danger"
                        title="Delete"
                        disabled={deleting === file.file_id}
                        onClick={() => deleteFile(file)}
                      >
                        {deleting === file.file_id ? '...' : '🗑'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
                    <span className="page-info">{currentPage} / {pagination.pages}</span>
                    <button disabled={currentPage === pagination.pages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedFile && (
            <div className="file-detail fade-in">
              <div className="detail-header">
                <div className="detail-icon">{getFileIcon(selectedFile.file_type)}</div>
                <div>
                  <h3>{selectedFile.original_name}</h3>
                  <span className={`badge ${selectedFile.upload_status}`}>{selectedFile.upload_status}</span>
                </div>
                <button className="btn-close" onClick={() => setSelectedFile(null)}>✕</button>
              </div>

              <div className="detail-section">
                <h4>File Information</h4>
                <div className="detail-rows">
                  <div className="detail-row"><span>File ID</span><span className="mono">{selectedFile.file_id?.slice(0, 16)}...</span></div>
                  <div className="detail-row"><span>Size</span><span>{formatBytes(selectedFile.file_size)}</span></div>
                  <div className="detail-row"><span>Type</span><span>{selectedFile.file_type}</span></div>
                  <div className="detail-row"><span>Uploaded</span><span>{formatDate(selectedFile.upload_time)}</span></div>
                  <div className="detail-row"><span>Upload Status</span><span className={`badge ${selectedFile.upload_status}`}>{selectedFile.upload_status}</span></div>
                  <div className="detail-row"><span>Processing</span><span className={`badge ${selectedFile.processing_status}`}>{selectedFile.processing_status}</span></div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Azure Blob Storage</h4>
                <div className="blob-url-box">
                  <span className="mono">{selectedFile.blob_name}</span>
                </div>
              </div>

              {processedData && (
                <div className="detail-section">
                  <h4>Processing Results</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Words</span><span>{processedData.word_count?.toLocaleString()}</span></div>
                    <div className="detail-row"><span>Characters</span><span>{processedData.char_count?.toLocaleString()}</span></div>
                    <div className="detail-row"><span>Duration</span><span>{processedData.processing_duration_ms}ms</span></div>
                    <div className="detail-row"><span>Engine</span><span className="mono">{processedData.metadata?.processing_engine}</span></div>
                  </div>
                  {processedData.extracted_text && (
                    <div className="extracted-text">
                      <h5>Extracted Text Preview</h5>
                      <pre>{processedData.extracted_text.slice(0, 500)}{processedData.extracted_text.length > 500 ? '...' : ''}</pre>
                    </div>
                  )}
                </div>
              )}

              <div className="detail-actions">
                <button className="btn-refresh" onClick={() => pollStatus(selectedFile.file_id)}>⟳ Refresh Status</button>
                <button className="btn-danger" onClick={() => deleteFile(selectedFile)}>Delete File</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilesPage;