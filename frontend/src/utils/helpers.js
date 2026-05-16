export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatDuration = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('xlsx')) return '📊';
  if (mimeType.includes('csv')) return '📋';
  if (mimeType.includes('text')) return '📃';
  return '📄';
};

export const getStatusColor = (status) => {
  const map = {
    uploaded: '#2196f3',
    processing: '#ffd60a',
    processed: '#00d4aa',
    failed: '#ff4444',
    pending: '#8ba3c4'
  };
  return map[status] || '#8ba3c4';
};