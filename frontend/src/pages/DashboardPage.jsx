import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Building2, PlusCircle, FileText } from 'lucide-react';
import { societiesAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const getId = (item) => item?._id || item?.id;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await societiesAPI.list();
      const socs = res.data.societies || [];
      setSocieties(socs);

      // Fetch balance for each society
      const balanceMap = {};
      await Promise.all(
        socs.map(async (s) => {
          try {
            const id = getId(s);
            const b = await societiesAPI.balance(id);
            balanceMap[id] = b.data;
          } catch {}
        })
      );
      setBalances(balanceMap);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const totalCredit = Object.values(balances).reduce((sum, b) => sum + (b?.total_credit || 0), 0);
  const totalDebit = Object.values(balances).reduce((sum, b) => sum + (b?.total_debit || 0), 0);
  const netBalance = totalCredit - totalDebit;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const today = format(new Date(), 'EEEE, dd MMMM yyyy');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-surface-200 text-sm">{today}</p>
        <h1 className="font-display text-2xl font-bold text-surface-900 mt-1">
          Namaste, {user?.name?.split(' ')[0]} 🙏
        </h1>
        <p className="text-surface-200 mt-0.5 text-sm">Here's your ledger overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-surface-200 font-medium">Total Credit</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-green-700 font-mono">{loading ? '—' : fmt(totalCredit)}</p>
          <p className="text-xs text-surface-200 mt-1">Across all societies</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-surface-200 font-medium">Total Debit</span>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-red-600 font-mono">{loading ? '—' : fmt(totalDebit)}</p>
          <p className="text-xs text-surface-200 mt-1">Across all societies</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-surface-200 font-medium">Net Balance</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-primary-50' : 'bg-red-50'}`}>
              <Wallet className={`w-4 h-4 ${netBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-semibold font-mono ${netBalance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
            {loading ? '—' : fmt(netBalance)}
          </p>
          <p className="text-xs text-surface-200 mt-1">{societies.length} societies total</p>
        </div>
      </div>

      {/* Quick Actions */}
      {['super_admin', 'society_admin', 'editor'].includes(user?.role) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wide">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/entries/new')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Entry
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              View Reports
            </button>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => navigate('/societies/new')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Building2 className="w-4 h-4" />
                Add Society
              </button>
            )}
          </div>
        </div>
      )}

      {/* Society Cards */}
      <div>
        <h2 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wide">
          Societies ({societies.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-surface-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-surface-100 rounded w-3/4 mb-4" />
                <div className="flex gap-4">
                  <div className="h-8 bg-surface-100 rounded w-24" />
                  <div className="h-8 bg-surface-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : societies.length === 0 ? (
          <div className="card p-10 text-center">
            <Building2 className="w-10 h-10 text-surface-200 mx-auto mb-3" />
            <p className="text-surface-200">No societies yet</p>
            {user?.role === 'super_admin' && (
              <button onClick={() => navigate('/societies/new')} className="btn-primary mt-4 text-sm">
                Create First Society
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {societies.map((s) => {
              const id = getId(s);
              const bal = balances[id];
              const balance = (bal?.total_credit || 0) - (bal?.total_debit || 0);
              return (
                <div
                  key={id}
                  className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/entries?society=${id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-surface-900">{s.name}</h3>
                      {s.registration_number && (
                        <p className="text-xs text-surface-200 mt-0.5">Reg: {s.registration_number}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-100 text-surface-200'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-surface-100">
                    <div>
                      <p className="text-xs text-surface-200">Credit</p>
                      <p className="text-sm font-semibold text-green-700 font-mono">{fmt(bal?.total_credit || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-200">Debit</p>
                      <p className="text-sm font-semibold text-red-600 font-mono">{fmt(bal?.total_debit || 0)}</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-xs text-surface-200">Balance</p>
                      <p className={`text-sm font-bold font-mono ${balance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                        {fmt(balance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
