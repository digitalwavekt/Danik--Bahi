import { useEffect, useState } from 'react';
import { usersAPI, societiesAPI } from '../api/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ShieldOff, ShieldCheck, Loader2, Users, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

const getId = (item) => item?._id || item?.id;

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  role: z.enum(['society_admin', 'editor', 'viewer', 'auditor']),
  society_ids: z.array(z.string()).optional(),
});

const ROLE_COLORS = {
  super_admin: 'bg-purple-50 text-purple-700',
  society_admin: 'bg-blue-50 text-blue-700',
  editor: 'bg-amber-50 text-amber-700',
  viewer: 'bg-surface-100 text-surface-700',
  auditor: 'bg-teal-50 text-teal-700',
};

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([usersAPI.list(), societiesAPI.list()]);
      setUsers(uRes.data.users || []);
      setSocieties(sRes.data.societies || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (data) => {
    if (creating) return;
    setCreating(true);
    try {
      await usersAPI.create(data);
      toast.success('User created');
      setShowModal(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally { setCreating(false); }
  };

  const toggleStatus = async (u) => {
    try {
      await usersAPI.toggleStatus(getId(u));
      toast.success(u.is_active ? 'User blocked' : 'User activated');
      load();
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (id) => {
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Cannot delete'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Manage Users</h1>
          <p className="text-surface-200 text-sm mt-0.5">{users.length} sub-admins</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> Add User
        </button>
      </div>

      {loading ? (
        <div className="card divide-y divide-surface-100">
          {[1,2,3].map((i) => <div key={i} className="p-4 animate-pulse h-16 bg-surface-50" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-surface-200 mx-auto mb-3" />
          <p className="text-surface-200">No users yet. Add your first sub-admin.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Societies</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-700 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((u) => (
                <tr key={getId(u)} className="hover:bg-surface-50 group">
                  <td className="px-4 py-3 font-medium text-surface-900">{u.name}</td>
                  <td className="px-4 py-3 text-surface-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || ''}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-200 text-xs">
                    {u.user_society_access?.length > 0
                      ? u.user_society_access.map((a) => a.societies?.name || a.society_id?.name || a.society?.name).filter(Boolean).join(', ')
                      : 'None'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleStatus(u)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-100 text-surface-200 hover:text-amber-600 transition-colors"
                        title={u.is_active ? 'Block user' : 'Activate user'}>
                        {u.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-surface-200 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Add Sub-Admin</h2>
              <button onClick={() => { setShowModal(false); reset(); }} className="text-surface-200 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreate)} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Full Name</label>
                <input className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Ramesh Kumar" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Email</label>
                <input type="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="user@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Password</label>
                <input type="password" className={`input-field ${errors.password ? 'border-red-400' : ''}`} placeholder="Min 8 chars, 1 uppercase, 1 number" {...register('password')} />
                {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Role</label>
                <select className={`input-field ${errors.role ? 'border-red-400' : ''}`} {...register('role')}>
                  <option value="">Select role...</option>
                  {me?.role === 'super_admin' && <option value="society_admin">Society Admin</option>}
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="auditor">Auditor</option>
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-0.5">{errors.role.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Society Access</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-surface-200 rounded-lg p-2">
                  {societies.map((s) => {
                    const id = getId(s);
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary-700">
                        <input type="checkbox" value={id} {...register('society_ids')} className="accent-primary-600" />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Delete user "${deleteTarget.name}"? Their entries will remain but they will lose all access.`}
          onConfirm={() => deleteUser(getId(deleteTarget))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
