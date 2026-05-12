import { useState } from 'react';
import { reportsAPI, societiesAPI } from '../api/client';
import { useEffect } from 'react';
import { BarChart3, Download, FileText, Loader2, TrendingUp, TrendingDown, Wallet, FileImage } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const getId = (item) => item?._id || item?.id;

export default function ReportsPage() {
  const [societies, setSocieties] = useState([]);
  const [societyId, setSocietyId] = useState('');
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  const fetchReport = async () => {
    if (!societyId) { toast.error('Select a society'); return; }
    setLoading(true);
    try {
      const res = await reportsAPI.summary(societyId, from, to);
      setReport(res.data);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const exportPDF = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const res = await reportsAPI.export(societyId, from, to);
      const data = res.data;

      const doc = new jsPDF();
      const society = data.society;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SAHAKARI SAMITI DAINIK BAHI', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(society.name, 105, 28, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Reg No: ${society.registration_number || 'N/A'} | ${society.address || ''}`, 105, 34, { align: 'center' });
      doc.text(`Report Period: ${from} to ${to}`, 105, 40, { align: 'center' });

      // Summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 52);
      autoTable(doc, {
        startY: 55,
        head: [['Total Credit', 'Total Debit', 'Net Balance']],
        body: [[
          `Rs. ${data.summary.total_credit.toLocaleString('en-IN')}`,
          `Rs. ${data.summary.total_debit.toLocaleString('en-IN')}`,
          `Rs. ${data.summary.balance.toLocaleString('en-IN')}`,
        ]],
        headStyles: { fillColor: [24, 78, 54] },
        styles: { fontSize: 9 },
      });

      // Entries
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Date', 'Heading', 'Sub-Heading', 'Type', 'Amount', 'Notes']],
        body: data.entries.map((e) => [
          e.date,
          e.heading,
          e.sub_heading,
          e.type.toUpperCase(),
          `Rs. ${Number(e.amount).toLocaleString('en-IN')}`,
          e.notes || '',
        ]),
        headStyles: { fillColor: [24, 78, 54] },
        styles: { fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } },
      });

      doc.save(`DainikBahi_${society.name.replace(/\s+/g, '_')}_${from}_${to}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const res = await reportsAPI.export(societyId, from, to);
      const data = res.data;

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Sahakari Samiti Dainik Bahi'],
        [data.society.name],
        [`Period: ${from} to ${to}`],
        [],
        ['Total Credit', data.summary.total_credit],
        ['Total Debit', data.summary.total_debit],
        ['Net Balance', data.summary.balance],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Entries sheet
      const entriesData = [
        ['Date', 'Heading', 'Sub-Heading', 'Type', 'Amount', 'Notes', 'Created By', 'Bill URL'],
        ...data.entries.map((e) => [
          e.date, e.heading, e.sub_heading, e.type,
          Number(e.amount), e.notes || '', e.created_by || '', e.bill_url || '',
        ]),
      ];
      const wsEntries = XLSX.utils.aoa_to_sheet(entriesData);
      XLSX.utils.book_append_sheet(wb, wsEntries, 'Entries');

      XLSX.writeFile(wb, `DainikBahi_${data.society.name.replace(/\s+/g, '_')}_${from}_${to}.xlsx`);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Reports</h1>
          <p className="text-surface-200 text-sm mt-0.5">Generate and export society ledger reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">Society</label>
            <select className="input-field text-sm" value={societyId} onChange={(e) => setSocietyId(e.target.value)}>
              <option value="">Select society...</option>
              {societies.map((s) => { const id = getId(s); return <option key={id} value={id}>{s.name}</option>; })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">From Date</label>
            <input type="date" className="input-field text-sm" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-700 block mb-1">To Date</label>
            <input type="date" className="input-field text-sm" value={to} min={from} max={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center justify-center gap-2 text-sm py-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-surface-200">Total Credit</p>
                <p className="font-bold text-green-700 font-mono">{fmt(report.total_credit)}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-surface-200">Total Debit</p>
                <p className="font-bold text-red-600 font-mono">{fmt(report.total_debit)}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.balance >= 0 ? 'bg-primary-50' : 'bg-red-50'}`}>
                <Wallet className={`w-5 h-5 ${report.balance >= 0 ? 'text-primary-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-xs text-surface-200">Net Balance</p>
                <p className={`font-bold font-mono ${report.balance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>{fmt(report.balance)}</p>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3 mb-6">
            <button onClick={exportPDF} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={exportExcel} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export Excel
            </button>
            {exporting && <Loader2 className="w-5 h-5 animate-spin text-primary-600 my-auto" />}
          </div>

          {/* Day-wise breakdown */}
          <div className="space-y-4">
            {report.days.map((day) => (
              <div key={day.date} className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-b border-surface-100">
                  <h3 className="font-semibold text-surface-900 text-sm">
                    {format(new Date(day.date), 'EEEE, dd MMMM yyyy')}
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-700 font-mono font-medium">+{fmt(day.credit)}</span>
                    <span className="text-red-600 font-mono font-medium">-{fmt(day.debit)}</span>
                  </div>
                </div>
                <div className="divide-y divide-surface-100">
                  {day.entries.map((e) => (
                    <div key={getId(e)} className="flex items-center px-4 py-3 gap-4">
                      <span className={e.type === 'credit' ? 'badge-credit' : 'badge-debit'}>
                        {e.entry_headings?.name || e.heading_id?.name || e.heading?.name || '—'}
                      </span>
                      <span className="text-sm text-surface-700 flex-1">{e.sub_heading}</span>
                      {e.bill_url && (
                        <a href={e.bill_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                          <FileImage className="w-3.5 h-3.5" /> Bill
                        </a>
                      )}
                      <span className={`font-mono font-semibold text-sm ${e.type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                        {e.type === 'credit' ? '+' : '-'}{fmt(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-surface-200 mx-auto mb-4" />
          <p className="text-surface-200">Select a society and date range to generate report</p>
        </div>
      )}
    </div>
  );
}
