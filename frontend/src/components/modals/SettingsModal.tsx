"use client";

import React, { useState, useEffect } from "react";
import { Settings, Key, Sliders, Cpu, Save, X, Check, ShieldCheck } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { UserSettings } from "@/types/auth";
import { useChat } from "@/context/ChatContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { models } = useChat();
  const [activeTab, setActiveTab] = useState<"general" | "keys" | "prompt">("general");

  const [settingsData, setSettingsData] = useState<UserSettings>({
    default_model: "llama-3.3-70b-versatile",
    default_provider: "groq",
    system_prompt: "",
    temperature: "0.7",
    theme: "dark",
    custom_api_keys_status: {
      groq: false,
      openai: false,
      gemini: false,
      anthropic: false,
      openrouter: false,
    },
  });

  const [apiKeysInput, setApiKeysInput] = useState<{
    groq?: string;
    openai?: string;
    gemini?: string;
    anthropic?: string;
    openrouter?: string;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await ApiClient.get<UserSettings>("/api/user/settings");
      setSettingsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload: any = {
        default_model: settingsData.default_model,
        default_provider: settingsData.default_provider,
        system_prompt: settingsData.system_prompt,
        temperature: settingsData.temperature,
        theme: settingsData.theme,
      };

      if (Object.keys(apiKeysInput).length > 0) {
        payload.custom_api_keys = apiKeysInput;
      }

      const updated = await ApiClient.patch<UserSettings>("/api/user/settings", payload);
      setSettingsData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Application Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "general"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" /> General & Parameters
          </button>
          <button
            onClick={() => setActiveTab("prompt")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "prompt"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4" /> System Instructions
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "keys"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" /> Hosted API Keys
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "general" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Hosted Model
                </label>
                <select
                  value={settingsData.default_model}
                  onChange={(e) => {
                    const modelId = e.target.value;
                    const found = models.find((m) => m.id === modelId);
                    setSettingsData({
                      ...settingsData,
                      default_model: modelId,
                      default_provider: found?.provider || "groq",
                    });
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Temperature ({settingsData.temperature})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {parseFloat(settingsData.temperature) < 0.4 ? "Precise / Factual" : "Creative & Fluent"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={settingsData.temperature}
                  onChange={(e) => setSettingsData({ ...settingsData, temperature: e.target.value })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Custom System Instructions
              </label>
              <p className="text-[11px] text-slate-400">
                Define the persona, tone, style guidelines, and constraints for all assistant responses.
              </p>
              <textarea
                rows={6}
                value={settingsData.system_prompt || ""}
                onChange={(e) => setSettingsData({ ...settingsData, system_prompt: e.target.value })}
                placeholder="E.g., You are a seasoned senior software engineer. Always provide clean TypeScript code and concise explanations."
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-xs"
              />
            </div>
          )}

          {activeTab === "keys" && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Your custom API keys are securely stored on your account. You can use free Groq keys for ultra-fast Llama 3.3, or OpenAI/Gemini/Anthropic keys.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Groq API Key (Free)</label>
                  {settingsData.custom_api_keys_status?.groq && (
                    <span className="text-emerald-500 text-[10px] font-mono">✓ Configured</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="gsk_..."
                  onChange={(e) => setApiKeysInput({ ...apiKeysInput, groq: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">OpenAI API Key</label>
                  {settingsData.custom_api_keys_status?.openai && (
                    <span className="text-emerald-500 text-[10px] font-mono">✓ Configured</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="sk-..."
                  onChange={(e) => setApiKeysInput({ ...apiKeysInput, openai: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Google Gemini API Key</label>
                  {settingsData.custom_api_keys_status?.gemini && (
                    <span className="text-emerald-500 text-[10px] font-mono">✓ Configured</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  onChange={(e) => setApiKeysInput({ ...apiKeysInput, gemini: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
              <Check className="w-4 h-4" /> Settings updated successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">Press Save to apply changes</span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
