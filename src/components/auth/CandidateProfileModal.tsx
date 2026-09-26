import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Mail,
  Edit3,
  Check,
  Download,
  Trash2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'indigo', label: 'Indigo Core', bg: 'bg-indigo-600', border: 'border-indigo-400' },
  { id: 'purple', label: 'Purple Luxe', bg: 'bg-purple-600', border: 'border-purple-400' },
  { id: 'emerald', label: 'Emerald Pro', bg: 'bg-emerald-600', border: 'border-emerald-400' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500', border: 'border-amber-400' },
  { id: 'rose', label: 'Rose Impact', bg: 'bg-rose-600', border: 'border-rose-400' },
  { id: 'slate', label: 'Slate Minimal', bg: 'bg-slate-700', border: 'border-slate-400' }
];

export const CandidateProfileModal: React.FC = () => {
  const {
    user,
    logout,
    updateUserProfile,
    exportCandidateData,
    deleteAccount,
    isProfileModalOpen,
    setIsProfileModalOpen
  } = useAuth();

  const [preferredName, setPreferredName] = useState(user?.preferred_resume_name || user?.full_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || 'indigo');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isProfileModalOpen || !user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredName.trim()) return;

    updateUserProfile({
      preferred_resume_name: preferredName.trim(),
      full_name: preferredName.trim(),
      avatar_url: selectedAvatar
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getAvatarBg = (avatarId?: string) => {
    const preset = AVATAR_PRESETS.find((p) => p.id === avatarId);
    return preset ? preset.bg : 'bg-indigo-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-xl w-full p-8 rounded-2xl border border-indigo-500/30 bg-slate-900/95 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className={`w-14 h-14 rounded-2xl ${getAvatarBg(selectedAvatar)} text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20`}>
            {preferredName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-extrabold text-white">{preferredName}</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Active Session
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* Section 1: Display Name & Avatar Settings */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Preferred Resume Display Name
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Kaio Miranda"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
                <Edit3 className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Save Name</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <span className="font-semibold text-slate-300">Resume Display Name</span> is compiled directly into your PDF and DOCX exports. You can edit this anytime if your professional resume name differs from your email ID.
            </p>
          </div>

          {/* Avatar Color Preset Picker */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Candidate Profile Avatar Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedAvatar(preset.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    selectedAvatar === preset.id
                      ? `${preset.border} bg-slate-800 ring-2 ring-indigo-500/50`
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${preset.bg} border border-white/20`} />
                  <span className="text-[9px] font-mono text-slate-400">{preset.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Profile display name & avatar updated successfully!</span>
            </div>
          )}
        </form>

        {/* Section 2: Data Privacy & Control Center */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Data Privacy & Candidate Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export Candidate Data */}
            <button
              onClick={exportCandidateData}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Export All Candidate Data
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-indigo-500/20 text-indigo-300">JSON</span>
              </div>
              <p className="text-[11px] text-slate-400">Download a full backup of your Master Vault, target applications, and resume metrics.</p>
            </button>

            {/* Reset Vault Session */}
            <button
              onClick={() => {
                if (window.confirm('Reset Master Vault local data? Your account login will remain active.')) {
                  sessionStorage.removeItem('resume_master_vault');
                  window.location.reload();
                }
              }}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  Reset Master Vault Data
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-amber-500/20 text-amber-300">Clear</span>
              </div>
              <p className="text-[11px] text-slate-400">Clears current session vault items while preserving your candidate login.</p>
            </button>
          </div>

          {/* Account Actions: Sign Out & Delete Account */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={logout}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out of Account</span>
            </button>

            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Candidate Account</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Sub-Modal */}
        {showConfirmDelete && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-white space-y-3 animate-fade-in">
            <div className="flex items-center space-x-2 text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold">Permanently Delete Candidate Account?</h4>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              This action will permanently purge your candidate profile, Master Vault achievements, target jobs, and AI interview sessions. This cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-1">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
              >
                Confirm Account Purge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
