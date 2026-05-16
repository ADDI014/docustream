import React from 'react';
import './HomePage.css';

const features = [
  { icon: '☁️', title: 'Azure Blob Storage', desc: 'Files stored securely in Microsoft Azure cloud with 99.9% uptime and global redundancy.' },
  { icon: '⚡', title: 'Serverless Functions', desc: 'Azure Functions triggered automatically on upload — zero server management required.' },
  { icon: '🔄', title: 'Event-Driven', desc: 'Blob upload events fire the processing pipeline instantly without manual intervention.' },
  { icon: '📊', title: 'Real-Time Monitoring', desc: 'Live execution logs, processing metrics, and error tracking on the monitoring dashboard.' },
  { icon: '🔒', title: 'Secure by Design', desc: 'JWT authentication, file validation, and controlled cloud access at every layer.' },
  { icon: '📈', title: 'Auto Scaling', desc: 'Azure cloud scales automatically to handle high document loads without config changes.' }
];

const steps = [
  { n: '01', title: 'Upload Document', desc: 'Drag & drop or browse to select PDF, DOCX, TXT, CSV, or image files.' },
  { n: '02', title: 'Blob Storage', desc: 'File is securely stored in your Azure Blob Storage container instantly.' },
  { n: '03', title: 'Event Triggered', desc: 'Blob upload event automatically fires the Azure Function trigger.' },
  { n: '04', title: 'Processing', desc: 'Azure Function validates, extracts content, and generates metadata.' },
  { n: '05', title: 'Logs & Monitoring', desc: 'Every step is logged. View results in the dashboard.' }
];

const HomePage = ({ onNavigate }) => (
  <div className="home-page">
    {/* Hero */}
    <section className="hero">
      <div className="hero-bg-blobs">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Powered by Microsoft Azure
        </div>
        <h1 className="hero-title">
          Cloud-Native
          <br />
          <span className="gradient-text">Document Processing</span>
          <br />
          at Scale
        </h1>
        <p className="hero-desc">
          DocuStream automates document upload and processing workflows using Azure Blob Storage,
          Azure Functions, and serverless event-driven architecture — no servers to manage.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => onNavigate('upload')}>
            Upload Document
            <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/></svg>
          </button>
          <button className="btn-hero-secondary" onClick={() => onNavigate('dashboard')}>
            View Dashboard
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat"><span className="stat-val">Azure</span><span className="stat-label">Cloud Platform</span></div>
          <div className="stat-div" />
          <div className="stat"><span className="stat-val">Serverless</span><span className="stat-label">Architecture</span></div>
          <div className="stat-div" />
          <div className="stat"><span className="stat-val">Event-Driven</span><span className="stat-label">Workflow</span></div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="features-section">
      <div className="section-inner">
        <div className="section-tag">Architecture</div>
        <h2 className="section-title">Built on Microsoft Azure</h2>
        <p className="section-sub">Every component leverages Azure cloud services for maximum reliability and scale.</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="workflow-section">
      <div className="section-inner">
        <div className="section-tag">Workflow</div>
        <h2 className="section-title">How DocuStream Works</h2>
        <p className="section-sub">A fully automated pipeline from upload to processed output.</p>
        <div className="steps-container">
          {steps.map((s, i) => (
            <div key={i} className="step-item">
              <div className="step-num">{s.n}</div>
              <div className="step-connector" style={{ display: i === steps.length - 1 ? 'none' : '' }} />
              <div className="step-content">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="cta-section">
      <div className="cta-card">
        <h2>Ready to process your documents?</h2>
        <p>Upload your first document and watch the Azure-powered pipeline work in real time.</p>
        <div className="cta-actions">
          <button className="btn-hero-primary" onClick={() => onNavigate('upload')}>Get Started</button>
          <button className="btn-hero-secondary" onClick={() => onNavigate('register')}>Create Account</button>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="footer">
      <p>DocuStream – Cloud-Native Document Processing System using Microsoft Azure</p>
      <p className="footer-sub">B.Tech Computer Science &amp; Engineering | IKG Punjab Technical University</p>
    </footer>
  </div>
);

export default HomePage;