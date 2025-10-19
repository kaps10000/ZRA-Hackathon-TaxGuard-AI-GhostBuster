import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, Shield, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const generateSecurePassword = (
  length: number,
  useUppercase: boolean,
  useLowercase: boolean,
  useNumbers: boolean,
  useSymbols: boolean
): string => {
  let chars = '';
  if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers) chars += '0123456789';
  if (useSymbols) chars += '!@#$%^&*()_+[]{}|;:,.<>?';

  if (chars.length === 0) return '';

  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
};

const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score >= 80) return { score, label: 'Very Strong', color: 'text-green-400' };
  if (score >= 60) return { score, label: 'Strong', color: 'text-blue-400' };
  if (score >= 40) return { score, label: 'Moderate', color: 'text-yellow-400' };
  return { score, label: 'Weak', color: 'text-red-400' };
};

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose }) => {
  const [length, setLength] = useState(16);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (length < 8) {
      return;
    }
    if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
      return;
    }
    const newPassword = generateSecurePassword(length, useUppercase, useLowercase, useNumbers, useSymbols);
    setPassword(newPassword);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password');
    }
  };

  const strength = password ? calculatePasswordStrength(password) : { score: 0, label: '', color: '' };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Password Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generated Password Display */}
          {password && (
            <div className="space-y-3">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-slate-100 font-mono text-lg break-all flex-1">
                    {password}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Password Strength */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Password Strength</span>
                    <span className={`font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        strength.score >= 80
                          ? 'bg-green-500'
                          : strength.score >= 60
                          ? 'bg-blue-500'
                          : strength.score >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Length Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Password Length
              </label>
              <span className="text-lg font-bold text-blue-400">{length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>8</span>
              <span>32</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Character Types</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Uppercase (A-Z)', value: useUppercase, setter: setUseUppercase },
                { label: 'Lowercase (a-z)', value: useLowercase, setter: setUseLowercase },
                { label: 'Numbers (0-9)', value: useNumbers, setter: setUseNumbers },
                { label: 'Symbols (!@#$)', value: useSymbols, setter: setUseSymbols }
              ].map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    option.value
                      ? 'bg-blue-500/10 border-blue-500/30 text-slate-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={option.value}
                    onChange={(e) => option.setter(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Warning */}
          {length < 8 && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">
                Password length must be at least 8 characters for security.
              </p>
            </div>
          )}

          {!useUppercase && !useLowercase && !useNumbers && !useSymbols && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">
                Please select at least one character type.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={length < 8 || (!useUppercase && !useLowercase && !useNumbers && !useSymbols)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:shadow-none"
            >
              <RefreshCw className="w-5 h-5" />
              Generate New
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-all duration-200 border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;