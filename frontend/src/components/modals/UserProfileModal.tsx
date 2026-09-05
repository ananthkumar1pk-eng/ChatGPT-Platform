"use client";

import React, { useState } from "react";
import { User as UserIcon, LogOut, Check, X, Shield, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiClient } from "@/lib/api";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await ApiClient.patch<any>("/api/user/profile", { full_name: fullName });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Profile</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Avatar Hero */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md ring-4 ring-emerald-500/10">
              {user.full_name ? user.full_name[0] : user.email[0]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name || "ChatGPT User"}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active Member (Tier: Unlimited)
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                <span>{saved ? "Saved" : isUpdating ? "Updating..." : "Update Profile"}</span>
              </button>
            </div>
          </form>

          {/* Account Meta */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Auth Provider</span>
              <span className="font-mono uppercase text-slate-800 dark:text-slate-200">{user.auth_provider}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> User ID</span>
              <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{user.id.slice(0, 12)}...</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="text-rose-500 hover:text-rose-600 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out of account
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
