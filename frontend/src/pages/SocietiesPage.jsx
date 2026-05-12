import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { societiesAPI } from '../api/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PlusCircle, Building2, Pencil, X, Loader2, MapPin, Hash } from 'lucide-react';

const getId = (item) => item?._id || item?.id;

const schema = z.object({
  name: z.string().min(2, 'Name required').max(200),
  registration_number: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

export default function SocietiesPage() {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async () => {
    setLoading(true);
    try {
      const res = await societiesAPI.list();
      setSocieties(res.data.societies || []);
    } catch { toast.error('Failed to load societies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset(); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setValue('name', s.name);
    setValue('registration_number', s.registration_number || '');
    setValue('address', s.address || '');
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (saving) return;
    setSaving(true);
    try {
      if (editing) {
        await societiesAPI.update(getId(editing), data);
        toast.success('Society updated');
      } else {
        await societiesAPI.create(data);
        toast.success('Society created');
      }
      setShowModal(false);
      reset();
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Societies</h1>
          <p className="text-surface-200 text-sm mt-0.5">{societies.length} registered societies</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> Add Society
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-surface-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-surface-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : societies.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-surface-200 mx-auto mb-3" />
          <p className="text-surface-200 mb-4">No societies yet</p>
          <button onClick={openCreate} className="btn-primary text-sm">Create First Society</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {societies.map((s) => (
            <div key={getId(s)} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">{s.name}</h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-100 text-surface-200'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(s)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-200 hover:text-primary-600 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-sm">
                {s.registration_number && (
                  <div className="flex items-center gap-2 text-surface-200">
                    <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Reg: {s.registration_number}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2 text-surface-200">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-surface-100 flex gap-2">
                <button
                  onClick={() => navigate(`/entries?society=${getId(s)}`)}
                  className="btn-secondary text-xs py-1.5 flex-1"
                >
                  View Entries
                </button>
                <button
                  onClick={() => navigate(`/headings?society=${getId(s)}`)}
                  className="btn-secondary text-xs py-1.5 flex-1"
                >
                  Headings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">{editing ? 'Edit Society' : 'New Society'}</h2>
              <button onClick={() => { setShowModal(false); reset(); setEditing(null); }} className="text-surface-200 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Society Name <span className="text-red-500">*</span></label>
                <input className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g., Shri Ram Sahakari Samiti" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Registration Number</label>
                <input className="input-field" placeholder="e.g., SAH/RAJ/2021/1234" {...register('registration_number')} />
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">Address</label>
                <textarea rows={2} className="input-field resize-none" placeholder="Full address..." {...register('address')} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); reset(); setEditing(null); }} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
