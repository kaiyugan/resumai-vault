import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, LogIn, UserPlus, CheckCircle, Mail, User, ShieldCheck } from 'lucide-react';
import { parseGoogleJwt } from '../../utils/googleAuth';

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, register, loginWithGoogle } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [showGoogleEmailInput, setShowGoogleEmailInput] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleName, setGoogleName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasClientId, setHasClientId] = useState<boolean>(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '660414317015-r17otka41l27rpdp94l1np8v9c6dptch.apps.googleusercontent.com';

  useEffect(() => {
    setHasClientId(Boolean(GOOGLE_CLIENT_ID));

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              const payload = parseGoogleJwt(response.credential);
              if (payload && payload.email) {
                loginWithGoogle(payload.email, payload.name || '', payload.picture);
              }
            }
          },
          auto_select: false,
          itp_support: true
        });

        // Render official Google Sign-In button container
        const container = document.getElementById('googleNativeBtnContainer');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 340,
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.warn('Google Identity Services initialization:', err);
      }
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUpMode) {
        await register(email, fullName, password);
      } else {
        await login(email, password, fullName || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      setErrorMessage('Please enter your actual Google account email address.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(googleEmail.trim(), googleName.trim() || undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    setErrorMessage('');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowGoogleEmailInput(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-indigo-500/30 bg-slate-900/95 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isSignUpMode ? 'Create Candidate Profile' : 'Sign In to ResumAI Vault'}
          </h2>
          <p className="text-xs text-slate-400">
            Access your independent Master Vault, target applications, and tailored resumes securely.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {!showGoogleEmailInput ? (
          <>
            {/* Native Google GIS Button Container */}
            <div id="googleNativeBtnContainer" className="w-full flex justify-center"></div>

            {/* Custom Google 1-Click Trigger Button */}
            {!hasClientId && (
              <button
                type="button"
                onClick={triggerGoogleSignIn}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Sign-In</span>
              </button>
            )}

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-[10px] font-mono text-slate-500 uppercase">Or Email Sign In</span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUpMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSignUpMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUpMode ? 'Create Candidate Profile' : 'Sign In to My Account'}</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setErrorMessage('');
                  setIsSignUpMode(!isSignUpMode);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          </>
        ) : (
          /* Google Account Verification & Client ID Guide */
          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Google Device Account Selection</span>
              </div>
              <p className="text-[11px] text-slate-300">
                To pull accounts logged in on your device automatically, add your Google OAuth Web Client ID as <code className="font-mono text-indigo-300">VITE_GOOGLE_CLIENT_ID</code> in Vercel.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Google Account Email *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Display Name (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Kaio Miranda"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleEmailInput(false);
                  setErrorMessage('');
                }}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Sign-In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
