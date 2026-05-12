import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="font-semibold text-surface-900">{title}</h2>
        </div>
        <p className="text-sm text-surface-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="btn-danger flex-1 text-sm flex items-center justify-center gap-1">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
