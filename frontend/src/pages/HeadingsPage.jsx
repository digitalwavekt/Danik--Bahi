import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { headingsAPI, societiesAPI } from '../api/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PlusCircle, Tag, ToggleLeft, ToggleRight, Trash2, X, Loader2 } from 'lucide-react';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

const mongoIdRegex = /^[a-f\d]{24}$/i;

const schema = z.object({
  society_id: z.string().min(1, 'Select a society').refine((val) => mongoIdRegex.test(val), {
    message: 'Select a valid society',
  }),
  name: z.string().min(1, 'Heading name required').max(200),
  type: z.enum(['credit', 'debit'], { required_error: 'Select type' }),
});

const getId = (item) => item?._id || item?.id;

export default function HeadingsPage() {
  const [searchParams] = useSearchParams();
  const [societies, setSocieties] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(searchParams.get('society') || '');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      society_id: '',
      name: '',
      type: 'credit',
    },
  });

  const loadSocieties = async () => {
    try {
      const r = await societiesAPI.list();
      setSocieties(r.data.societies || []);
    } catch {
      toast.error('Failed to load societies');
    }
  };

  const loadHeadings = async (societyId) => {
    if (!societyId) {
      setHeadings([]);
      return;
    }

    setLoading(true);
    try {
      const r = await headingsAPI.list(societyId);
      setHeadings(r.data.headings || []);
    } catch {
      toast.error('Failed to load headings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocieties();
  }, []);

  useEffect(() => {
    loadHeadings(selectedSociety);
  }, [selectedSociety]);

  const openCreate = () => {
    reset({
      society_id: selectedSociety || '',
      name: '',
      type: 'credit',
    });
    setValue('society_id', selectedSociety || '', { shouldValidate: true });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (saving) return;

    setSaving(true);
    try {
      await headingsAPI.create({
        society_id: data.society_id,
        societyId: data.society_id,
        name: data.name,
        type: data.type,
      });

      toast.success('Heading created');
      setShowModal(false);
      reset();

      if (data.society_id === selectedSociety) {
        await loadHeadings(selectedSociety);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleHeading = async (h) => {
    const id = getId(h);
    try {
      await headingsAPI.toggle(id);
      setHeadings((prev) =>
        prev.map((x) =>
          getId(x) === id ? { ...x, is_active: !x.is_active } : x
        )
      );
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const deleteHeading = async (id) => {
    try {
      await headingsAPI.delete(id);
      toast.success('Heading deleted');
      setDeleteTarget(null);
      setHeadings((prev) => prev.filter((h) => getId(h) !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
      setDeleteTarget(null);
    }
  };

  const creditHeadings = headings.filter((h) => h.type === 'credit');
  const debitHeadings = headings.filter((h) => h.type === 'debit');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Entry Headings</h1>
          <p className="text-surface-200 text-sm mt-0.5">Define categories for ledger entries</p>
        </div>

        <button
          onClick={openCreate}
          disabled={!selectedSociety}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <PlusCircle className="w-4 h-4" /> Add Heading
        </button>
      </div>

      <div className="card p-4 mb-6">
        <label className="text-xs font-medium text-surface-700 block mb-1">
          Select Society
        </label>

        <select
          className="input-field text-sm max-w-sm"
          value={selectedSociety}
          onChange={(e) => setSelectedSociety(e.target.value)}
        >
          <option value="">Choose a society...</option>
          {societies.map((s) => {
            const id = getId(s);
            return (
              <option key={id} value={id}>
                {s.name}
              </option>
            );
          })}
        </select>
      </div>

      {!selectedSociety ? (
        <div className="card p-12 text-center">
          <Tag className="w-10 h-10 text-surface-200 mx-auto mb-3" />
          <p className="text-surface-200">Select a society to manage its headings</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Credit Headings ({creditHeadings.length})
            </h2>

            <div className="space-y-2">
              {creditHeadings.length === 0 && (
                <div className="card p-6 text-center text-surface-200 text-sm">
                  No credit headings yet
                </div>
              )}

              {creditHeadings.map((h) => {
                const id = getId(h);
                return (
                  <div
                    key={id}
                    className={`card px-4 py-3 flex items-center justify-between group transition-opacity ${!h.is_active ? 'opacity-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-sm text-surface-900">{h.name}</span>
                      {!h.is_active && <span className="text-xs text-surface-200">(inactive)</span>}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleHeading(h)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-100 text-surface-200 hover:text-amber-600 transition-colors"
                        title={h.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {h.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-surface-200 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-3">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Debit Headings ({debitHeadings.length})
            </h2>

            <div className="space-y-2">
              {debitHeadings.length === 0 && (
                <div className="card p-6 text-center text-surface-200 text-sm">
                  No debit headings yet
                </div>
              )}

              {debitHeadings.map((h) => {
                const id = getId(h);
                return (
                  <div
                    key={id}
                    className={`card px-4 py-3 flex items-center justify-between group transition-opacity ${!h.is_active ? 'opacity-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-sm text-surface-900">{h.name}</span>
                      {!h.is_active && <span className="text-xs text-surface-200">(inactive)</span>}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleHeading(h)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-100 text-surface-200 hover:text-amber-600 transition-colors"
                      >
                        {h.is_active ? (
                          <ToggleRight className="w-4 h-4 text-red-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-surface-200 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Add Heading</h2>

              <button
                onClick={() => {
                  setShowModal(false);
                  reset();
                }}
                className="text-surface-200 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">
                  Society
                </label>

                <select
                  className={`input-field ${errors.society_id ? 'border-red-400' : ''}`}
                  {...register('society_id')}
                >
                  <option value="">Select...</option>
                  {societies.map((s) => {
                    const id = getId(s);
                    return (
                      <option key={id} value={id}>
                        {s.name}
                      </option>
                    );
                  })}
                </select>

                {errors.society_id && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {errors.society_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">
                  Heading Name <span className="text-red-500">*</span>
                </label>

                <input
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="e.g., Monthly Membership Fee"
                  {...register('name')}
                />

                {errors.name && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-surface-700 block mb-1">
                  Type <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-3">
                  <label className="flex items-center gap-2 flex-1 border border-surface-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-green-400 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      value="credit"
                      {...register('type')}
                      className="accent-green-600"
                    />
                    <span className="text-sm font-medium text-green-700">Credit</span>
                  </label>

                  <label className="flex items-center gap-2 flex-1 border border-surface-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-red-400 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                    <input
                      type="radio"
                      value="debit"
                      {...register('type')}
                      className="accent-red-600"
                    />
                    <span className="text-sm font-medium text-red-600">Debit</span>
                  </label>
                </div>

                {errors.type && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Heading"
          message={`Delete heading "${deleteTarget.name}"? This will fail if entries exist for this heading.`}
          onConfirm={() => deleteHeading(getId(deleteTarget))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}