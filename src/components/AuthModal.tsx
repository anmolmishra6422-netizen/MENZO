import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, Mail, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!open) return null;

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not enabled in the Firebase Console yet. Enable Authentication > Sign-in method > Email/Password for project gen-lang-client-0301042032, or continue with Google Sign-In below.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Incorrect email or password. Please check your credentials.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google Sign-In window was closed before completion.';
    }
    return err?.message || 'Authentication failed. Please try again.';
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (name.trim().length < 2) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name, email, password);
        setInfoMsg('Account created! Please check your email inbox and click the verification link before placing orders.');
      } else {
        await resetPassword(email);
        setInfoMsg('Password reset email sent. Check your inbox to set a new password.');
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md border border-neutral-200 p-6 sm:p-8 relative shadow-2xl">
        <button
          type="button"
          aria-label="Close sign in"
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-950"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">Customer Portal</p>
        <h2 className="font-display text-3xl font-semibold text-neutral-950 mb-6">
          {mode === 'login' ? 'Sign in to MENZO' : mode === 'register' ? 'Create Account' : 'Reset Password'}
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Primary Google Sign-In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full py-3 border border-neutral-950 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <span>Continue with Google</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-neutral-400">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Arjun Sharma"
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-neutral-950"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-950 underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-neutral-950"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-neutral-950 text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Customer Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-600">
          {mode === 'login' ? (
            <>
              New to MENZO?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="font-semibold text-neutral-950 underline underline-offset-4"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="font-semibold text-neutral-950 underline underline-offset-4"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
