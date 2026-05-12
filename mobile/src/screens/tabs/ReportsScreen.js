import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { reportsAPI, societiesAPI } from '../../api/client';

export default function ReportsScreen() {
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState('');
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  const fetchReport = async () => {
    if (!selectedSociety) { Alert.alert('Select a society first'); return; }
    setLoading(true);
    try {
      const res = await reportsAPI.summary(selectedSociety, from, to);
      setReport(res.data);
    } catch { Alert.alert('Error', 'Failed to generate report'); }
    finally { setLoading(false); }
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Reports</Text>

      {/* Society chips */}
      <View style={s.chipRow}>
        {societies.map((soc) => (
          <TouchableOpacity
            key={soc.id}
            style={[s.chip, selectedSociety === soc.id && s.chipActive]}
            onPress={() => setSelectedSociety(soc.id)}
          >
            <Text style={[s.chipText, selectedSociety === soc.id && s.chipTextActive]}>{soc.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date range */}
      <View style={s.dateRow}>
        <View style={s.dateField}>
          <Text style={s.label}>From</Text>
          <TextInput style={s.input} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor="#c4c2c0" />
        </View>
        <View style={s.dateField}>
          <Text style={s.label}>To</Text>
          <TextInput style={s.input} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor="#c4c2c0" />
        </View>
      </View>

      <TouchableOpacity style={s.generateBtn} onPress={fetchReport} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.generateBtnText}>Generate Report</Text>}
      </TouchableOpacity>

      {report && (
        <>
          {/* Summary */}
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <View style={[s.summaryItem, { borderLeftColor: '#22c55e' }]}>
                <Text style={s.summaryLabel}>Total Credit</Text>
                <Text style={[s.summaryValue, { color: '#15803d' }]}>{fmt(report.total_credit)}</Text>
              </View>
              <View style={[s.summaryItem, { borderLeftColor: '#ef4444' }]}>
                <Text style={s.summaryLabel}>Total Debit</Text>
                <Text style={[s.summaryValue, { color: '#dc2626' }]}>{fmt(report.total_debit)}</Text>
              </View>
            </View>
            <View style={s.balanceRow}>
              <Text style={s.balanceLabel}>Net Balance</Text>
              <Text style={[s.balanceValue, { color: report.balance >= 0 ? '#1d5f3c' : '#dc2626' }]}>
                {fmt(report.balance)}
              </Text>
            </View>
          </View>

          {/* Day-wise breakdown */}
          {report.days.map((day) => (
            <View key={day.date} style={s.dayCard}>
              <View style={s.dayHeader}>
                <Text style={s.dayDate}>{format(new Date(day.date), 'dd MMMM yyyy, EEEE')}</Text>
                <View style={s.dayTotals}>
                  <Text style={{ color: '#15803d', fontSize: 12, fontWeight: '600' }}>+{fmt(day.credit)}</Text>
                  <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}> -{fmt(day.debit)}</Text>
                </View>
              </View>
              {day.entries.map((e) => (
                <View key={e.id} style={s.dayEntry}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dayEntryHeading}>{e.entry_headings?.name}</Text>
                    <Text style={s.dayEntrySub}>{e.sub_heading}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.dayEntryAmount, e.type === 'credit' ? { color: '#15803d' } : { color: '#dc2626' }]}>
                      {e.type === 'credit' ? '+' : '-'}{fmt(e.amount)}
                    </Text>
                    {e.bill_url && <Ionicons name="document-attach-outline" size={14} color="#24784a" />}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1c1917', marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#24784a', borderColor: '#24784a' },
  chipText: { fontSize: 12, color: '#44403c' },
  chipTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dateField: { flex: 1 },
  label: { fontSize: 12, fontWeight: '500', color: '#44403c', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, padding: 10, fontSize: 13, color: '#1c1917', backgroundColor: '#fff' },
  generateBtn: { backgroundColor: '#24784a', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  summaryBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, elevation: 1 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryItem: { flex: 1, borderLeftWidth: 3, paddingLeft: 10 },
  summaryLabel: { fontSize: 11, color: '#78716c' },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 10 },
  balanceLabel: { fontSize: 13, color: '#44403c', fontWeight: '500' },
  balanceValue: { fontSize: 18, fontWeight: '700' },
  dayCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f0f9f4' },
  dayDate: { fontSize: 12, fontWeight: '600', color: '#1c1917' },
  dayTotals: { flexDirection: 'row' },
  dayEntry: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f5f5f4' },
  dayEntryHeading: { fontSize: 11, color: '#78716c' },
  dayEntrySub: { fontSize: 13, color: '#1c1917', marginTop: 1 },
  dayEntryAmount: { fontSize: 14, fontWeight: '600' },
});
