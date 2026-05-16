import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

const AuthPage = ({ initialMode = 'login', toast, onNavigate }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [showPass, setShowPass] = useState(false);

  const validateLogin = () => {
    const e = {};
    if (!loginEmail) e.loginEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) e.loginEmail = 'Enter a valid email';
    if (!loginPassword) e.loginPassword = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateRegister = () => {
    const e = {};
    if (!regName.trim()) e.regName = 'Name is required';
    else if (regName.trim().length < 3) e.regName = 'Name must be at least 3 characters';
    if (!regEmail) e.regEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(regEmail)) e.regEmail = 'Enter a valid email';
    if (!regPassword) e.regPassword = 'Password is required';
    else if (regPassword.length < 6) e.regPassword = 'Password must be at least 6 characters';
    if (regPassword !== regConfirm) e.regConfirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back to DocuStream!');
      onNavigate('dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      toast.error(msg);
      setErrors({ loginGeneral: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      await register(regName.trim(), regEmail, regPassword);
      toast.success('Account created! Welcome to DocuStream.');
      onNavigate('dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Try again.';
      toast.error(msg);
      setErrors({ regGeneral: msg });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
  };

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-bg">
        <div className="auth-blob auth-blob1" />
        <div className="auth-blob auth-blob2" />
      </div>

      <div className="auth-container fade-in">
        {/* Logo */}
        <div className="auth-logo" onClick={() => onNavigate('home')}>
          <div className="auth-logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="var(--azure-blue)" />
              <rect x="18" y="4" width="10" height="10" rx="2" fill="var(--azure-blue)" opacity="0.6" />
              <rect x="4" y="18" width="10" height="10" rx="2" fill="var(--azure-blue)" opacity="0.6" />
              <rect x="18" y="18" width="10" height="10" rx="2" fill="var(--accent-green)" />
            </svg>
          </div>
          <span className="auth-logo-text">Docu<span>Stream</span></span>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
            <div className={`auth-tab-indicator ${mode === 'register' ? 'right' : ''}`} />
          </div>

          {/* ─── LOGIN FORM ──────────────────────────────────────────────── */}
          {mode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <div className="auth-form-header">
                <h2>Welcome back</h2>
                <p>Sign in to your DocuStream account</p>
              </div>

              {errors.loginGeneral && (
                <div className="auth-error-banner">{errors.loginGeneral}</div>
              )}

              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className={errors.loginEmail ? 'input-error' : ''}
                    autoComplete="email"
                  />
                </div>
                {errors.loginEmail && <span className="field-error">{errors.loginEmail}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className={errors.loginPassword ? 'input-error' : ''}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.loginPassword && <span className="field-error">{errors.loginPassword}</span>}
              </div>

              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <><span className="spin">⟳</span> Signing in...</> : 'Sign In →'}
              </button>

              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" className="link-btn" onClick={() => switchMode('register')}>
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ─── REGISTER FORM ─────────────────────────────────────────── */}
          {mode === 'register' && (
            <form className="auth-form" onSubmit={handleRegister} noValidate>
              <div className="auth-form-header">
                <h2>Create account</h2>
                <p>Start processing documents with Azure</p>
              </div>

              {errors.regGeneral && (
                <div className="auth-error-banner">{errors.regGeneral}</div>
              )}

              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Ankit Kumar"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className={errors.regName ? 'input-error' : ''}
                    autoComplete="name"
                  />
                </div>
                {errors.regName && <span className="field-error">{errors.regName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className={errors.regEmail ? 'input-error' : ''}
                    autoComplete="email"
                  />
                </div>
                {errors.regEmail && <span className="field-error">{errors.regEmail}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className={errors.regPassword ? 'input-error' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPass(s => !s)}
                      tabIndex={-1}
                    >
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.regPassword && <span className="field-error">{errors.regPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="reg-confirm"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      className={errors.regConfirm ? 'input-error' : ''}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.regConfirm && <span className="field-error">{errors.regConfirm}</span>}
                </div>
              </div>

              {/* Password strength */}
              {regPassword && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map(n => (
                      <div
                        key={n}
                        className={`strength-bar ${getStrength(regPassword) >= n ? `level-${getStrength(regPassword)}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="strength-label">{strengthLabel(regPassword)}</span>
                </div>
              )}

              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <><span className="spin">⟳</span> Creating account...</> : 'Create Account →'}
              </button>

              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Azure note */}
        <div className="auth-footer-note">
          <span className="azure-badge">☁ Microsoft Azure</span>
          <span>Your documents are processed securely on Azure cloud infrastructure</span>
        </div>
      </div>
    </div>
  );
};

// Password strength helpers
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabel = (pwd) => {
  const s = getStrength(pwd);
  return ['', 'Weak', 'Fair', 'Good', 'Strong'][s] || '';
};

export default AuthPage;