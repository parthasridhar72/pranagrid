import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Lock, Unlock, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { encryptPayloadAES, computeSHA256 } from '../services/crypto';

interface CryptoAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CryptoAuditModal: React.FC<CryptoAuditModalProps> = ({ isOpen, onClose }) => {
  const [testPayload, setTestPayload] = useState(
    JSON.stringify({
      facility: 'PHC Bhor',
      district: 'Pune',
      state: 'Maharashtra',
      patientId: 'ABHA-IN-27041-0091',
      diagnosis: 'Severe Viper Envenomation (20-min whole blood clotting test failed)',
      drugAdministered: 'Polyvalent Antivenom 10 vials IV infusion',
      batchNumber: 'ASV-2026-B812',
      doctorAadhaarToken: 'DSC-IN-MOHFW-MH-27041-9812',
    }, null, 2)
  );

  const [cipherText, setCipherText] = useState('');
  const [ivBase64, setIvBase64] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runLiveEncryption();
    }
  }, [isOpen]);

  const runLiveEncryption = async () => {
    setIsEncrypting(true);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await encryptPayloadAES(parsed);
      const hash = await computeSHA256(testPayload);
      setCipherText(res.cipherTextBase64);
      setIvBase64(res.ivBase64);
      setSha256Hash(hash);
    } catch (e) {
      console.warn('Live encryption preview parse error:', e);
    } finally {
      setIsEncrypting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              National Health Data Cryptographic Audit & Verification
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span>Cryptographic Standard:</span>
            <span className="text-emerald-400 font-bold">W3C Web Crypto API (SubtleCrypto)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Symmetric Cipher:</span>
            <span className="text-cyan-400">AES-GCM 256-bit (authenticated encryption)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Integrity Digest:</span>
            <span className="text-indigo-400">SHA-256 Tamper-Proof Hash Chaining</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Digital Signature:</span>
            <span className="text-amber-400">ECDSA P-256 MoHFW Root Authority</span>
          </div>
        </div>

        {/* Live Ciphertext Demo */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Sample PHI Telemetry Payload:</span>
            <button
              onClick={runLiveEncryption}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isEncrypting ? 'animate-spin' : ''}`} />
              <span>Re-encrypt with fresh 96-bit IV</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-[11px] text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div>
            <label className="text-slate-400 block mb-1">
              Encrypted Telemetry Payload (AES-256 Ciphertext):
            </label>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-cyan-400 break-all select-all max-h-20 overflow-y-auto">
              {cipherText || 'Generating...'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block">Unique Nonce / IV:</span>
              <span className="text-indigo-300 truncate block">{ivBase64}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block">SHA-256 Digest:</span>
              <span className="text-slate-300 truncate block">{sha256Hash}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
