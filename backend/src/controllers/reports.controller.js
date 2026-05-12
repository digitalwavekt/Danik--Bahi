import Society from '../models/Society.js';
import LedgerEntry from '../models/LedgerEntry.js';

async function getReportEntries(societyId, from, to) {
  return LedgerEntry.find({ society_id: societyId, is_deleted: false, entry_date: { $gte: from, $lte: to } })
    .populate('heading_id', 'name type')
    .populate('created_by', 'name')
    .sort({ entry_date: 1 });
}

export async function getSummaryReport(req, res) {
  const { societyId } = req.params;
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates are required' });

  const entries = await getReportEntries(societyId, from, to);
  const byDate = {};
  let totalCredit = 0;
  let totalDebit = 0;
  for (const entry of entries) {
    const date = entry.entry_date;
    byDate[date] ||= { date, credit: 0, debit: 0, entries: [] };
    if (entry.type === 'credit') { byDate[date].credit += Number(entry.amount); totalCredit += Number(entry.amount); }
    else { byDate[date].debit += Number(entry.amount); totalDebit += Number(entry.amount); }
    byDate[date].entries.push(entry);
  }
  return res.json({ from, to, total_credit: totalCredit, total_debit: totalDebit, balance: totalCredit - totalDebit, days: Object.values(byDate), entries });
}

export async function exportReport(req, res) {
  const { societyId } = req.params;
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates are required' });

  const [society, entries] = await Promise.all([Society.findById(societyId).select('name registration_number address'), getReportEntries(societyId, from, to)]);
  let totalCredit = 0;
  let totalDebit = 0;
  for (const e of entries) e.type === 'credit' ? totalCredit += Number(e.amount) : totalDebit += Number(e.amount);

  return res.json({
    society,
    period: { from, to },
    summary: { total_credit: totalCredit, total_debit: totalDebit, balance: totalCredit - totalDebit },
    entries: entries.map((e) => ({ date: e.entry_date, heading: e.heading_id?.name, sub_heading: e.sub_heading, type: e.type, amount: Number(e.amount), notes: e.notes, bill_url: e.bill_url, created_by: e.created_by?.name })),
  });
}
