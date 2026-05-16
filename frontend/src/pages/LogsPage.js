import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { formatDate, formatDuration } from '../utils/helpers';
import './LogsPage.css';

/* ─── Log row component ─────────────────────────────────────────────────────── */
const LOG_ICONS = {
  upload: '📤',
  trigger: '⚡',
  processing: '⚙',
  completion: '✅',
  error: '❌',
  deletion: '🗑'
};

const ERROR_COLORS = {
  none: '',
  warning: 'log-warning',
  error: 'log-error',
  critical: 'log-critical'
};

const EVENT_COLORS = {
  upload: 'evt-upload',
  trigger: 'evt-trigger',
  processing: 'evt-processing',
  completion: 'evt-completion',
  error: 'evt-error',
  deletion: 'evt-deletion'
};

const LogRow = ({ log, isExpanded, onToggle }) => (
  <div className={`log-row ${ERROR_COLORS[log.error_status] || ''} ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
    <div className="log-row-main">
      <div className="log-time">{formatDate(log.timestamp)}</div>
      <div className={`log-event-badge ${EVENT_COLORS[log.event_type]}`}>
        {LOG_ICONS[log.event_type]} {log.event_type}
      </div>
      <div className="log-message">{log.log_message}</div>
      {log.execution_time > 0 && (
        <div className="log-exec-time">{formatDuration(log.execution_time)}</div>
      )}
      {log.error_status !== 'none' && (
        <div className={`log-severity ${log.error_status}`}>{log.error_status}</div>
      )}
      <div className="log-expand-icon">{isExpanded ? '▲' : '▼'}</div>
    </div>

    {isExpanded && (
      <div className="log-row-detail" onClick={e => e.stopPropagation()}>
        <div className="log-detail-grid">
          <div className="log-detail-item">
            <label>Log ID</label>
            <span className="mono">{log.log_id}</span>
          </div>
          <div className="log-detail-item">
            <label>File ID</label>
            <span className="mono">{log.file_id}</span>
          </div>
          <div className="log-detail-item">
            <label>Event Type</label>
            <span>{log.event_type}</span>
          </div>
          <div className="log-detail-item">
            <label>Error Status</label>
            <span className={log.error_status !== 'none' ? log.error_status : ''}>{log.error_status}</span>
          </div>
          <div className="log-detail-item">
            <label>Execution Time</label>
            <span>{formatDuration(log.execution_time) || '—'}</span>
          </div>
          <div className="log-detail-item">
            <label>Timestamp</label>
            <span>{new Date(log.timestamp).toISOString()}</span>
          </div>
        </div>
        {log.error_detail && (
          <div className="log-stack">
            <label>Error Detail</label>
            <pre>{log.error_detail}</pre>
          </div>
        )}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="log-metadata">
            <label>Metadata</label>
            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
          </div>
        )}
      </div>
    )}
  </div>
);

/* ─── Main Logs Page ────────────────────────────────────────────────────────── */
const LogsPage = ({ toast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters
  const [filterEvent, setFilterEvent] = useState('');
  const [filterError, setFilterError] = useState('');
  const [filterFileId, setFilterFileId] = useState('');
  const [fileIdInput, setFileIdInput] = useState('');

  const logsEndRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 30 });
      if (filterEvent) params.append('event_type', filterEvent);
      if (filterError) params.append('error_status', filterError);
      if (filterFileId) params.append('file_id', filterFileId);

      const res = await api.get(`/logs?${params}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      if (err.response?.status === 401) {
        toast.info('Sign in to view execution logs.');
      } else {
        toast.error('Could not load logs. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterEvent, filterError, filterFileId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const resetFilters = () => {
    setFilterEvent('');
    setFilterError('');
    setFilterFileId('');
    setFileIdInput('');
    setCurrentPage(1);
  };

  const applyFileIdFilter = () => {
    setFilterFileId(fileIdInput.trim());
    setCurrentPage(1);
  };

  const eventCounts = logs.reduce((acc, l) => {
    acc[l.event_type] = (acc[l.event_type] || 0) + 1;
    return acc;
  }, {});

  const errorCount = logs.filter(l => l.error_status !== 'none').length;

  return (
    <div className="logs-page">
      <div className="logs-inner">

        {/* ── Header ── */}
        <div className="page-header fade-in">
          <div className="section-tag">Azure Function Execution</div>
          <h1>Processing Logs</h1>
          <p>Real-time execution logs from document upload, Azure Function triggers, and processing operations.</p>
        </div>

        {/* ── Summary Strip ── */}
        <div className="log-summary fade-in">
          <div className="summary-item">
            <span className="summary-val">{pagination.total ?? logs.length}</span>
            <span className="summary-label">Total Logs</span>
          </div>
          {Object.entries(eventCounts).map(([type, count]) => (
            <div key={type} className="summary-item">
              <span className="summary-val">{count}</span>
              <span className={`summary-label evt-tag ${EVENT_COLORS[type]}`}>{LOG_ICONS[type]} {type}</span>
            </div>
          ))}
          {errorCount > 0 && (
            <div className="summary-item error-summary">
              <span className="summary-val">{errorCount}</span>
              <span className="summary-label">Errors this page</span>
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="logs-controls fade-in">
          <div className="controls-left">
            <div className="filter-group">
              <label>Event Type</label>
              <select value={filterEvent} onChange={e => { setFilterEvent(e.target.value); setCurrentPage(1); }}>
                <option value="">All events</option>
                <option value="upload">📤 Upload</option>
                <option value="trigger">⚡ Trigger</option>
                <option value="processing">⚙ Processing</option>
                <option value="completion">✅ Completion</option>
                <option value="error">❌ Error</option>
                <option value="deletion">🗑 Deletion</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Error Level</label>
              <select value={filterError} onChange={e => { setFilterError(e.target.value); setCurrentPage(1); }}>
                <option value="">All levels</option>
                <option value="none">No error</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="filter-group file-id-filter">
              <label>File ID</label>
              <div className="file-id-input-wrap">
                <input
                  type="text"
                  placeholder="Filter by file ID..."
                  value={fileIdInput}
                  onChange={e => setFileIdInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyFileIdFilter()}
                />
                <button onClick={applyFileIdFilter} className="btn-apply">→</button>
              </div>
            </div>
          </div>

          <div className="controls-right">
            <div className="auto-refresh-toggle">
              <span>Live</span>
              <button
                className={`toggle-btn ${autoRefresh ? 'on' : ''}`}
                onClick={() => setAutoRefresh(r => !r)}
              >
                <span className="toggle-thumb" />
              </button>
              {autoRefresh && <span className="live-dot" />}
            </div>

            {(filterEvent || filterError || filterFileId) && (
              <button className="btn-clear-filters" onClick={resetFilters}>✕ Clear filters</button>
            )}

            <button className="btn-refresh" onClick={fetchLogs}>
              <span className={loading ? 'spin' : ''}>⟳</span> Refresh
            </button>
          </div>
        </div>

        {/* ── Log Table ── */}
        <div className="logs-table-wrap fade-in">
          {/* Column headers */}
          <div className="log-header-row">
            <div className="log-time-h">Timestamp</div>
            <div className="log-event-h">Event</div>
            <div className="log-msg-h">Message</div>
            <div className="log-exec-h">Duration</div>
            <div className="log-sev-h">Severity</div>
            <div className="log-exp-h" />
          </div>

          {loading ? (
            <div className="logs-loading">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="log-skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="skel skel-time" />
                  <div className="skel skel-evt" />
                  <div className="skel skel-msg" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="logs-empty">
              <div className="logs-empty-icon">📋</div>
              <h3>No logs found</h3>
              <p>
                {filterEvent || filterError || filterFileId
                  ? 'No logs match your filters. Try clearing them.'
                  : 'Upload a document to generate execution logs.'}
              </p>
              {(filterEvent || filterError || filterFileId) && (
                <button className="btn-clear-filters" onClick={resetFilters}>Clear filters</button>
              )}
            </div>
          ) : (
            <div className="log-rows">
              {logs.map(log => (
                <LogRow
                  key={log._id || log.log_id}
                  log={log}
                  isExpanded={expandedLog === (log._id || log.log_id)}
                  onToggle={() => setExpandedLog(prev =>
                    prev === (log._id || log.log_id) ? null : (log._id || log.log_id)
                  )}
                />
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className="logs-pagination fade-in">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >«</button>
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >‹ Prev</button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const start = Math.max(1, currentPage - 2);
                const page = start + i;
                if (page > pagination.pages) return null;
                return (
                  <button
                    key={page}
                    className={`page-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              className="page-btn"
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(p => p + 1)}
            >Next ›</button>
            <button
              className="page-btn"
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(pagination.pages)}
            >»</button>

            <span className="page-info-text">
              Page {currentPage} of {pagination.pages} · {pagination.total} logs total
            </span>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="logs-legend fade-in">
          <h4>Log Event Types</h4>
          <div className="legend-grid">
            {[
              { type: 'upload', desc: 'Document uploaded by user to Azure Blob Storage' },
              { type: 'trigger', desc: 'Blob event triggered Azure Function automatically' },
              { type: 'processing', desc: 'Azure Function executing document processing logic' },
              { type: 'completion', desc: 'Processing completed successfully with output generated' },
              { type: 'error', desc: 'Processing failed — check error_detail for stack trace' },
              { type: 'deletion', desc: 'File deleted from Blob Storage and database' }
            ].map(item => (
              <div key={item.type} className="legend-entry">
                <span className={`log-event-badge ${EVENT_COLORS[item.type]}`}>
                  {LOG_ICONS[item.type]} {item.type}
                </span>
                <span className="legend-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;