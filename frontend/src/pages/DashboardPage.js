import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { formatBytes, formatDate, getFileIcon } from '../utils/helpers';
import './DashboardPage.css';

/* ─── Stat Card ────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon, color, delay }) => (
  <div className="stat-card fade-in" style={{ animationDelay: `${delay}s`, '--card-color': color }}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-body">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
    <div className="stat-card-glow" />
  </div>
);

/* ─── Mini bar chart ────────────────────────────────────────────────────────── */
const MiniBarChart = ({ data }) => {
  if (!data?.length) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="mini-bar-chart">
      {data.slice(0, 8).map((d, i) => (
        <div key={i} className="bar-item">
          <div className="bar-wrap">
            <div
              className="bar-fill"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d._id}: ${d.count} files`}
            />
          </div>
          <div className="bar-label">{simplifyMime(d._id)}</div>
          <div className="bar-count">{d.count}</div>
        </div>
      ))}
    </div>
  );
};

const simplifyMime = (mime) => {
  if (!mime) return '?';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'IMG';
  if (mime.includes('word') || mime.includes('docx')) return 'DOC';
  if (mime.includes('excel') || mime.includes('xlsx')) return 'XLS';
  if (mime.includes('csv')) return 'CSV';
  if (mime.includes('text')) return 'TXT';
  return mime.split('/')[1]?.slice(0, 4).toUpperCase() || '?';
};

/* ─── Donut chart for status breakdown ─────────────────────────────────────── */
const DonutChart = ({ processed, failed, pending, total }) => {
  if (!total) return <div className="chart-empty">No uploads yet</div>;
  const pctProcessed = Math.round((processed / total) * 100);
  const pctFailed = Math.round((failed / total) * 100);
  const pctPending = Math.max(0, 100 - pctProcessed - pctFailed);

  // SVG donut
  const r = 54;
  const circ = 2 * Math.PI * r;
  const processedDash = (pctProcessed / 100) * circ;
  const failedDash = (pctFailed / 100) * circ;
  const pendingDash = (pctPending / 100) * circ;

  const segments = [
    { dash: processedDash, offset: 0, color: 'var(--accent-green)', label: 'Processed' },
    { dash: failedDash, offset: processedDash, color: 'var(--accent-red)', label: 'Failed' },
    { dash: pendingDash, offset: processedDash + failedDash, color: 'var(--text-muted)', label: 'Pending' }
  ];

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 120 120" className="donut-svg">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="60" cy="60" r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
            strokeLinecap="round"
          />
        ))}
        <text x="60" y="56" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">{pctProcessed}%</text>
        <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Success Rate</text>
      </svg>
      <div className="donut-legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-green)' }} /><span>Processed ({processed})</span></div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-red)' }} /><span>Failed ({failed})</span></div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--text-muted)' }} /><span>Pending ({pending})</span></div>
      </div>
    </div>
  );
};

/* ─── Pipeline visualiser ───────────────────────────────────────────────────── */
const PipelineViz = () => (
  <div className="pipeline-viz">
    {[
      { icon: '👤', label: 'User Upload', color: 'var(--azure-blue-light)' },
      { icon: '☁', label: 'Azure Blob Storage', color: 'var(--azure-blue)' },
      { icon: '⚡', label: 'Blob Trigger Event', color: 'var(--accent-yellow)' },
      { icon: '⚙', label: 'Azure Function', color: 'var(--accent-green)' },
      { icon: '📊', label: 'Logs & Monitoring', color: 'var(--accent-orange)' }
    ].map((step, i, arr) => (
      <React.Fragment key={i}>
        <div className="pipe-node" style={{ '--node-color': step.color }}>
          <div className="pipe-node-icon">{step.icon}</div>
          <div className="pipe-node-label">{step.label}</div>
          <div className="pipe-node-ring" />
        </div>
        {i < arr.length - 1 && (
          <div className="pipe-arrow">
            <div className="pipe-arrow-line" />
            <div className="pipe-arrow-head">▶</div>
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ─── Main Dashboard ────────────────────────────────────────────────────────── */
const DashboardPage = ({ toast, onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, healthRes] = await Promise.allSettled([
        api.get('/stats'),
        api.get('/health')
      ]);
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
        setLastRefreshed(new Date());
      } else {
        toast.error('Backend not reachable. Start the backend server.');
      }
      if (healthRes.status === 'fulfilled') {
        setHealthStatus(healthRes.value.data);
      }
    } catch (err) {
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const overview = stats?.overview || {};

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">

        {/* ── Header ── */}
        <div className="dash-header fade-in">
          <div>
            <div className="section-tag">Monitoring Dashboard</div>
            <h1>DocuStream Overview</h1>
            <p className="dash-sub">
              Real-time cloud processing metrics powered by Microsoft Azure
              {lastRefreshed && <span className="last-refreshed"> · Updated {formatDate(lastRefreshed)}</span>}
            </p>
          </div>
          <div className="dash-header-actions">
            <div className="auto-refresh-toggle">
              <span>Auto-refresh</span>
              <button
                className={`toggle-btn ${autoRefresh ? 'on' : ''}`}
                onClick={() => setAutoRefresh(r => !r)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            <button className="btn-refresh-dash" onClick={fetchStats} title="Refresh now">
              <span className={loading ? 'spin' : ''}>⟳</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── System Health Banner ── */}
        {healthStatus && (
          <div className={`health-banner fade-in ${healthStatus.database === 'connected' ? 'healthy' : 'degraded'}`}>
            <div className="health-dot" />
            <div className="health-info">
              <strong>System Status:</strong>
              <span> API {healthStatus.status?.toUpperCase()}</span>
              <span className="health-sep">·</span>
              <span>Database: {healthStatus.database}</span>
              <span className="health-sep">·</span>
              <span>Azure Storage: {process.env.REACT_APP_AZURE_CONFIGURED === 'true' ? '✅ Connected' : '⚠ Check .env'}</span>
            </div>
            <span className="health-time">{formatDate(healthStatus.timestamp)}</span>
          </div>
        )}

        {loading ? (
          <div className="dash-loading">
            <div className="loader-ring" />
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="stat-cards-grid">
              <StatCard label="Total Files Uploaded" value={overview.total_files ?? '—'} sub="All time" icon="📁" color="var(--azure-blue)" delay={0} />
              <StatCard label="Successfully Processed" value={overview.processed_files ?? '—'} sub={`${overview.success_rate ?? 0}% success rate`} icon="✅" color="var(--accent-green)" delay={0.08} />
              <StatCard label="Failed Processing" value={overview.failed_files ?? '—'} sub="Requires attention" icon="❌" color="var(--accent-red)" delay={0.16} />
              <StatCard label="Pending / Processing" value={overview.pending_files ?? '—'} sub="In queue" icon="⏳" color="var(--accent-yellow)" delay={0.24} />
              <StatCard label="Registered Users" value={overview.total_users ?? '—'} sub="Active accounts" icon="👥" color="var(--accent-green)" delay={0.32} />
              <StatCard label="Total Log Entries" value={overview.total_logs ?? '—'} sub="Execution records" icon="📋" color="var(--accent-orange)" delay={0.40} />
            </div>

            {/* ── Charts Row ── */}
            <div className="charts-row">
              <div className="chart-card fade-in">
                <div className="chart-card-header">
                  <h3>Processing Status Breakdown</h3>
                  <span className="chart-tag">Donut Chart</span>
                </div>
                <DonutChart
                  processed={overview.processed_files || 0}
                  failed={overview.failed_files || 0}
                  pending={overview.pending_files || 0}
                  total={overview.total_files || 0}
                />
              </div>

              <div className="chart-card fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="chart-card-header">
                  <h3>Files by Type</h3>
                  <span className="chart-tag">Bar Chart</span>
                </div>
                <MiniBarChart data={stats?.file_type_breakdown} />
              </div>
            </div>

            {/* ── Azure Pipeline Visualisation ── */}
            <div className="pipeline-card fade-in">
              <div className="chart-card-header">
                <h3>Azure Processing Pipeline</h3>
                <span className="chart-tag">Event-Driven Architecture</span>
              </div>
              <PipelineViz />
              <p className="pipeline-note">
                Every upload triggers an automatic Azure Blob Storage event → Azure Function execution → document processing → log generation.
                Zero manual intervention required.
              </p>
            </div>

            {/* ── Recent Files + Recent Errors ── */}
            <div className="tables-row">
              <div className="table-card fade-in">
                <div className="table-card-header">
                  <h3>Recent Uploads</h3>
                  <button className="link-action" onClick={() => onNavigate('files')}>View all →</button>
                </div>
                {stats?.recent_files?.length ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_files.map((f, i) => (
                        <tr key={i}>
                          <td>
                            <div className="table-file">
                              <span>{getFileIcon(f.file_type)}</span>
                              <span className="table-file-name">{f.original_name}</span>
                            </div>
                          </td>
                          <td>{formatBytes(f.file_size)}</td>
                          <td><span className={`badge ${f.upload_status}`}>{f.upload_status}</span></td>
                          <td className="text-muted">{formatDate(f.upload_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="table-empty">
                    <p>No uploads yet. <button className="link-btn-inline" onClick={() => onNavigate('upload')}>Upload your first document →</button></p>
                  </div>
                )}
              </div>

              <div className="table-card fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="table-card-header">
                  <h3>Recent Errors</h3>
                  <button className="link-action" onClick={() => onNavigate('logs')}>View logs →</button>
                </div>
                {stats?.recent_errors?.length ? (
                  <div className="error-list">
                    {stats.recent_errors.map((e, i) => (
                      <div key={i} className="error-item">
                        <div className="error-icon">⚠</div>
                        <div className="error-body">
                          <p className="error-msg">{e.log_message}</p>
                          <span className="error-time text-muted">{formatDate(e.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="table-empty">
                    <div className="no-errors-icon">✅</div>
                    <p>No errors recorded. System running smoothly.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Azure Services Info ── */}
            <div className="services-card fade-in">
              <div className="chart-card-header">
                <h3>Azure Services Used</h3>
                <span className="chart-tag">Cloud Infrastructure</span>
              </div>
              <div className="services-grid">
                {[
                  { name: 'Azure Blob Storage', role: 'Document storage & event source', icon: '🗄', status: 'active' },
                  { name: 'Azure Functions', role: 'Serverless processing trigger', icon: '⚡', status: 'active' },
                  { name: 'Azure Monitor', role: 'Logs & metrics', icon: '📊', status: 'active' },
                  { name: 'Azure Active Directory', role: 'Identity management (future)', icon: '🔐', status: 'planned' },
                  { name: 'Azure Cognitive Services', role: 'OCR & AI analysis (future)', icon: '🧠', status: 'planned' },
                  { name: 'Azure Cosmos DB', role: 'Scalable database (future)', icon: '🌐', status: 'planned' }
                ].map((svc, i) => (
                  <div key={i} className={`service-item ${svc.status}`}>
                    <div className="service-icon">{svc.icon}</div>
                    <div className="service-info">
                      <div className="service-name">{svc.name}</div>
                      <div className="service-role">{svc.role}</div>
                    </div>
                    <div className={`service-status-dot ${svc.status}`} title={svc.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="quick-actions fade-in">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-btn primary" onClick={() => onNavigate('upload')}>
                  <span className="qa-icon">📤</span>
                  <span className="qa-label">Upload Document</span>
                  <span className="qa-desc">Add new document to Azure Blob Storage</span>
                </button>
                <button className="quick-action-btn" onClick={() => onNavigate('files')}>
                  <span className="qa-icon">📁</span>
                  <span className="qa-label">Browse Files</span>
                  <span className="qa-desc">View all uploaded documents</span>
                </button>
                <button className="quick-action-btn" onClick={() => onNavigate('logs')}>
                  <span className="qa-icon">📋</span>
                  <span className="qa-label">View Logs</span>
                  <span className="qa-desc">Execution logs & processing history</span>
                </button>
                <button className="quick-action-btn" onClick={fetchStats}>
                  <span className="qa-icon">🔄</span>
                  <span className="qa-label">Refresh Stats</span>
                  <span className="qa-desc">Reload all dashboard metrics</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;