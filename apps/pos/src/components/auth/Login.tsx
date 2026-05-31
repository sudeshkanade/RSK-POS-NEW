'use client';

import React, { useState, useId, useRef, useEffect } from 'react';

interface LoginProps {
  onLogin: (user: { name: string; role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CASHIER'; id: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'username' | 'password' | null>(null);
  const sessionId = useId();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        onLogin({
          id: data.user.id,
          name: data.user.name,
          role: data.user.role as 'ADMIN' | 'MANAGER' | 'STAFF' | 'CASHIER',
        });
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Connection error. Check that the app server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#080808',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '48px',
        backgroundColor: '#111111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            backgroundColor: '#10b981',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 900,
            color: '#000',
            letterSpacing: '-2px',
            boxShadow: '0 20px 40px rgba(16,185,129,0.25)',
          }}>
            R
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: '-1.5px',
            textTransform: 'uppercase',
            color: '#ffffff',
            margin: 0,
            lineHeight: 1,
          }}>
            RestroOS
          </h1>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#3f3f46',
            marginTop: 8,
            marginBottom: 0,
          }}>
            Staff Terminal Login
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: focused === 'username' ? '#10b981' : '#3f3f46',
              transition: 'color 0.2s',
            }}>
              Username
            </label>
            <input
              id="login-username"
              ref={usernameRef}
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
              style={{
                backgroundColor: '#1a1a1a',
                border: `1.5px solid ${focused === 'username' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: focused === 'password' ? '#10b981' : '#3f3f46',
              transition: 'color 0.2s',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: `1.5px solid ${focused === 'password' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  padding: '14px 52px 14px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#52525b',
                  padding: 0,
                  lineHeight: 1,
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 11,
              fontWeight: 700,
              color: '#f43f5e',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading || !username.trim() || !password}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '15px',
              backgroundColor: loading || !username.trim() || !password ? '#18402e' : '#10b981',
              color: loading || !username.trim() || !password ? '#2d7a5a' : '#000',
              border: 'none',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: loading || !username.trim() || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading || !username.trim() || !password ? 'none' : '0 10px 30px rgba(16,185,129,0.25)',
            }}
          >
            {loading ? 'Authorizing...' : '✓ Authorize Entry'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 700,
          color: '#27272a',
          textTransform: 'uppercase',
          letterSpacing: '3px',
        }}>
          Secure Terminal · {sessionId.replace(/:/g, '').substring(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
};
