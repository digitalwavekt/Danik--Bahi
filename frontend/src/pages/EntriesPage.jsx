import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, Filter, Pencil, Trash2, FileImage, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { entriesAPI, societiesAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

const getId = (item) => item?._id || item?.id;

export default function EntriesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canEdit = ['super_admin', 'society_admin', 'editor'].includes(user?.role);

  const [societies, setSocieties] = useState([]);
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const societyId = searchParams.get('society') || '';
  const typeFilter = searchParams.get('type') || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';

  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  const loadEntries = useCallback(async () => {
    if (!societyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (typeFilter) params.type = typeFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [entriesRes, balRes] = await Promise.all([
        entriesAPI.list(societyId, params),
        societiesAPI.balance(societyId),
      ]);

      setEntries(entriesRes.data.entries || []);
      setTotal(entriesRes.data.total || 0);
      setBalance(balRes.data);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [societyId, typeFilter, fromDate, toDate, page]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleDelete = async (id) => {
    try {
      await entriesAPI.delete(id);
      toast.success('Entry deleted');
      setDeleteTarget(null);
      loadEntries();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
  const pages = Math.ceil(total / 30);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Ledger Entries</h1>
          <p className="text-surface-200 text-sm mt-0.5">{total} entries found</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/entries/new')} className="btn-primary flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4" />
            New Entry
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">Society</label>
            <select
              className="input-field text-sm"
              value={societyId}
              onChange={(e) => { setSearchParams({ society: e.target.value }); setPage(1); }}
            >
              <option value="">Select Society</option>
              {societies.map((s) => { const id = getId(s); return <option key={id} value={id}>{s.name}</option>; })}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">Type</label>
            <select
              className="input-field text-sm"
              value={typeFilter}
              onChange={(e) => { setSearchParams({ society: societyId, type: e.target.value }); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">From Date</label>
            <input type="date" className="input-field text-sm" value={fromDate}
              onChange={(e) => setSearchParams({ society: societyId, type: typeFilter, from: e.target.value, to: toDate })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">To Date</label>
            <input type="date" className="input-field text-sm" value={toDate}
              onChange={(e) => setSearchParams({ society: societyId, type: typeFilter, from: fromDate, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Balance Bar */}
      {balance && societyId && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-surface-200">Total Credit</p>
              <p className="font-semibold text-green-700 font-mono text-sm">{fmt(balance.total_credit)}</p>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-surface-200">Total Debit</p>
              <p className="font-semibold text-red-600 font-mono text-sm">{fmt(balance.total_debit)}</p>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${balance.balance >= 0 ? 'bg-primary-50' : 'bg-red-50'}`}>
              <Wallet className={`w-4 h-4 ${balance.balance >= 0 ? 'text-primary-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-surface-200">Net Balance</p>
              <p className={`font-bold font-mono text-sm ${balance.balance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>{fmt(balance.balance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      {!societyId ? (
        <div className="card p-10 text-center">
          <Filter className="w-10 h-10 text-surface-200 mx-auto mb-3" />
          <p className="text-surface-200">Select a society to view entries</p>
        </div>
      ) : loading ? (
        <div className="card divide-y divide-surface-100">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="p-4 animate-pulse flex items-center gap-4">
              <div className="w-20 h-4 bg-surface-100 rounded" />
              <div className="flex-1 h-4 bg-surface-100 rounded" />
              <div className="w-24 h-4 bg-surface-100 rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center">
          <Search className="w-10 h-10 text-surface-200 mx-auto mb-3" />
          <p className="text-surface-200">No entries found</p>
          {canEdit && (
            <button onClick={() => navigate('/entries/new')} className="btn-primary mt-4 text-sm">
              Add First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Heading</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Sub-Heading</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-700 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-700 uppercase tracking-wide">Bill</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {entries.map((entry) => (
                  <tr key={getId(entry)} className="hover:bg-surface-50 transition-colors group">
                    <td className="px-4 py-3 text-surface-700 whitespace-nowrap font-mono text-xs">
                      {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={entry.type === 'credit' ? 'badge-credit' : 'badge-debit'}>
                        {entry.entry_headings?.name || entry.heading_id?.name || entry.heading?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-700 max-w-xs truncate">{entry.sub_heading}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                      <span className={entry.type === 'credit' ? 'text-green-700' : 'text-red-600'}>
                        {entry.type === 'credit' ? '+' : '-'}{fmt(entry.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.bill_url ? (
                        <a href={entry.bill_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 bg-primary-50 hover:bg-primary-100 rounded text-primary-600 transition-colors">
                          <FileImage className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-surface-200 text-xs">—</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/entries/${getId(entry)}/edit`)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-100 text-surface-200 hover:text-primary-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-surface-200 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
              <p className="text-xs text-surface-200">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Entry"
          message={`Delete entry "${deleteTarget.sub_heading}" of ${fmt(deleteTarget.amount)}? This cannot be undone.`}
          onConfirm={() => handleDelete(getId(deleteTarget))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
