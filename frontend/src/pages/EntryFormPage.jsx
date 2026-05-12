import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, X, Loader2, Image } from 'lucide-react';
import { entriesAPI, societiesAPI, headingsAPI } from '../api/client';
import { format } from 'date-fns';

const getId = (item) => item?._id || item?.id;

const schema = z.object({
  society_id: z.string().min(1, 'Select a society'),
  heading_id: z.string().min(1, 'Select a heading'),
  sub_heading: z.string().max(300).optional().or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be positive'),
  entry_date: z.string().min(1, 'Date required'),
  notes: z.string().max(1000).optional(),
});

export default function EntryFormPage() {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const isEdit = !!entryId;

  const [societies, setSocieties] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [bill, setBill] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [existingBillUrl, setExistingBillUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEdit);
  const fileRef = useRef();

  const today = format(new Date(), 'yyyy-MM-dd');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { society_id: '', heading_id: '', sub_heading: '', entry_date: today, notes: '' },
  });

  const selectedSociety = watch('society_id');

  // Load societies
  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  // Load headings when society changes
  useEffect(() => {
    if (selectedSociety) {
      headingsAPI.list(selectedSociety).then((r) => setHeadings(r.data.headings || [])).catch(() => toast.error('Failed to load headings'));
      if (!isEdit) setValue('heading_id', '');
    } else {
      setHeadings([]);
    }
  }, [selectedSociety]);

  // Load entry for edit
  useEffect(() => {
    if (!isEdit) return;
    entriesAPI.get(entryId).then((r) => {
      const e = r.data.entry;
      setValue('society_id', getId(e.society_id) || e.society_id || e.societyId || '');
      setValue('sub_heading', e.sub_heading);
      setValue('amount', e.amount);
      setValue('entry_date', e.entry_date);
      setValue('notes', e.notes || '');
      if (e.bill_url) setExistingBillUrl(e.bill_url);
      // heading_id loaded after headings fetch
      setTimeout(() => setValue('heading_id', getId(e.heading_id) || e.heading_id || e.headingId || ''), 300);
      setInitialLoad(false);
    }).catch(() => { toast.error('Failed to load entry'); navigate(-1); });
  }, [entryId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB'); return; }
    setBill(file);
    setBillPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, v); });
      formData.append('societyId', data.society_id);
      formData.append('headingId', data.heading_id);
      if (!formData.has('sub_heading')) formData.append('sub_heading', '');
      if (bill) formData.append('bill', bill);

      if (isEdit) {
        await entriesAPI.update(entryId, formData);
        toast.success('Entry updated');
      } else {
        await entriesAPI.create(formData);
        toast.success('Entry added');
      }
      navigate('/entries?society=' + data.society_id);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>;
  }

  const creditHeadings = headings.filter((h) => h.type === 'credit');
  const debitHeadings = headings.filter((h) => h.type === 'debit');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-200 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-surface-900 mb-6">
        {isEdit ? 'Edit Entry' : 'New Ledger Entry'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Society */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Society <span className="text-red-500">*</span></label>
          <select className={`input-field ${errors.society_id ? 'border-red-400' : ''}`} {...register('society_id')}>
            <option value="">Select society...</option>
            {societies.map((s) => { const id = getId(s); return <option key={id} value={id}>{s.name}</option>; })}
          </select>
          {errors.society_id && <p className="mt-1 text-xs text-red-500">{errors.society_id.message}</p>}
        </div>

        {/* Heading */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Entry Heading <span className="text-red-500">*</span></label>
          <select className={`input-field ${errors.heading_id ? 'border-red-400' : ''}`} {...register('heading_id')} disabled={!selectedSociety}>
            <option value="">Select heading...</option>
            {creditHeadings.length > 0 && (
              <optgroup label="─── CREDIT ───">
                {creditHeadings.map((h) => { const id = getId(h); return <option key={id} value={id}>{h.name}</option>; })}
              </optgroup>
            )}
            {debitHeadings.length > 0 && (
              <optgroup label="─── DEBIT ───">
                {debitHeadings.map((h) => { const id = getId(h); return <option key={id} value={id}>{h.name}</option>; })}
              </optgroup>
            )}
          </select>
          {!selectedSociety && <p className="mt-1 text-xs text-surface-200">Select a society first</p>}
          {errors.heading_id && <p className="mt-1 text-xs text-red-500">{errors.heading_id.message}</p>}
        </div>

        {/* Sub Heading */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Sub-Heading / Description <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={`input-field ${errors.sub_heading ? 'border-red-400' : ''}`}
            placeholder="e.g., Monthly membership fee from Ramesh Kumar"
            {...register('sub_heading')}
          />
          {errors.sub_heading && <p className="mt-1 text-xs text-red-500">{errors.sub_heading.message}</p>}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={`input-field ${errors.amount ? 'border-red-400' : ''}`}
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              max={today}
              className={`input-field ${errors.entry_date ? 'border-red-400' : ''}`}
              {...register('entry_date')}
            />
            {errors.entry_date && <p className="mt-1 text-xs text-red-500">{errors.entry_date.message}</p>}
            <p className="mt-1 text-xs text-surface-200">Past dates allowed. Future dates not permitted.</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Notes <span className="text-surface-200 font-normal">(optional)</span></label>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="Additional notes..."
            {...register('notes')}
          />
        </div>

        {/* Bill Upload */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Upload Bill <span className="text-surface-200 font-normal">(optional, max 5MB)</span></label>

          {existingBillUrl && !billPreview && (
            <div className="mb-2">
              <a href={existingBillUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-primary-600 hover:underline">
                <Image className="w-3.5 h-3.5" /> View existing bill
              </a>
            </div>
          )}

          {billPreview ? (
            <div className="relative inline-block">
              {bill?.type === 'application/pdf' ? (
                <div className="flex items-center gap-2 bg-surface-100 px-3 py-2 rounded-lg text-sm">
                  <Image className="w-4 h-4 text-primary-600" />
                  {bill.name}
                </div>
              ) : (
                <img src={billPreview} alt="Bill preview" className="h-24 w-auto rounded-lg border border-surface-200 object-cover" />
              )}
              <button type="button" onClick={() => { setBill(null); setBillPreview(null); fileRef.current.value = ''; }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-surface-200 hover:border-primary-400 rounded-lg text-sm text-surface-200 hover:text-primary-600 transition-colors w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Click to upload image or PDF
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
