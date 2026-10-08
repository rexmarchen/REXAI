import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types/resume';
import { Lock, Mail, X, LogIn, UserPlus, AlertCircle, Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(email, password);
        onUserChange(res.user);
        setSuccessMsg('Account created successfully!');
        setTimeout(onClose, 800);
      } else {
        const res = await api.login(email, password);
        onUserChange(res.user);
        setSuccessMsg('Logged in successfully!');
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    onUserChange(null);
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account and all saved resumes/analyses? This action is irreversible.')) {
      return;
    }
    try {
      await api.deleteAccount();
      onUserChange(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-400" />
              <span>User Profile</span>
            </h3>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-750 text-xs space-y-1.5">
              <div className="text-slate-400">Signed in as:</div>
              <div className="font-bold text-slate-100 text-sm">{currentUser.email}</div>
              <div className="text-[11px] text-slate-500">Member since {new Date(currentUser.created_at).toLocaleDateString()}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                Sign Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                title="Privacy right to be forgotten"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isRegister ? 'Create an Account' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isRegister
                  ? 'Sign up to enable cloud autosave and history trends.'
                  : 'Log in to access your saved resumes and score history.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Free Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isRegister
                  ? 'Already have an account? Sign in instead'
                  : "Don't have an account? Register free"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
