import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { societiesAPI } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const { user, canEdit } = useAuthStore();
  const router = useRouter();
  const [societies, setSocieties] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await societiesAPI.list();
      const socs = res.data.societies || [];
      setSocieties(socs);
      const map = {};
      await Promise.all(socs.map(async (s) => {
        try {
          const b = await societiesAPI.balance(s.id);
          map[s.id] = b.data;
        } catch {}
      }));
      setBalances(map);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const totalCredit = Object.values(balances).reduce((s, b) => s + (b?.total_credit || 0), 0);
  const totalDebit = Object.values(balances).reduce((s, b) => s + (b?.total_debit || 0), 0);
  const net = totalCredit - totalDebit;

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#24784a" />
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#24784a']} />}
    >
      {/* Greeting */}
      <View style={s.header}>
        <Text style={s.greeting}>Namaste, {user?.name?.split(' ')[0]} 🙏</Text>
        <Text style={s.date}>{format(new Date(), 'dd MMMM yyyy')}</Text>
      </View>

      {/* Summary Cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderLeftColor: '#22c55e' }]}>
          <Text style={s.summaryLabel}>Total Credit</Text>
          <Text style={[s.summaryValue, { color: '#15803d' }]}>{fmt(totalCredit)}</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: '#ef4444' }]}>
          <Text style={s.summaryLabel}>Total Debit</Text>
          <Text style={[s.summaryValue, { color: '#dc2626' }]}>{fmt(totalDebit)}</Text>
        </View>
      </View>

      <View style={s.balanceCard}>
        <View style={s.balanceLeft}>
          <Ionicons name="wallet-outline" size={22} color={net >= 0 ? '#24784a' : '#dc2626'} />
          <Text style={s.balanceLabel}>Net Balance</Text>
        </View>
        <Text style={[s.balanceValue, { color: net >= 0 ? '#1d5f3c' : '#dc2626' }]}>{fmt(net)}</Text>
      </View>

      {/* Quick Actions */}
      {canEdit() && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/entries/new')} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={s.actionBtnText}>New Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={() => router.push('/reports')} activeOpacity={0.8}>
              <Ionicons name="bar-chart-outline" size={22} color="#24784a" />
              <Text style={[s.actionBtnText, { color: '#24784a' }]}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Societies */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Societies ({societies.length})</Text>
        {societies.map((soc) => {
          const bal = balances[soc.id];
          const balance = (bal?.total_credit || 0) - (bal?.total_debit || 0);
          return (
            <TouchableOpacity
              key={soc.id}
              style={s.societyCard}
              onPress={() => router.push({ pathname: '/entries', params: { society: soc.id } })}
              activeOpacity={0.7}
            >
              <View style={s.societyHeader}>
                <View style={s.societyIconWrap}>
                  <Ionicons name="business-outline" size={18} color="#24784a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.societyName}>{soc.name}</Text>
                  {soc.registration_number && <Text style={s.societyReg}>Reg: {soc.registration_number}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#a8a29e" />
              </View>
              <View style={s.societyBalRow}>
                <View style={s.balItem}>
                  <Text style={s.balItemLabel}>Credit</Text>
                  <Text style={[s.balItemValue, { color: '#15803d' }]}>{fmt(bal?.total_credit)}</Text>
                </View>
                <View style={s.balItem}>
                  <Text style={s.balItemLabel}>Debit</Text>
                  <Text style={[s.balItemValue, { color: '#dc2626' }]}>{fmt(bal?.total_debit)}</Text>
                </View>
                <View style={[s.balItem, { alignItems: 'flex-end' }]}>
                  <Text style={s.balItemLabel}>Balance</Text>
                  <Text style={[s.balItemValue, { color: balance >= 0 ? '#1d5f3c' : '#dc2626', fontWeight: '700' }]}>
                    {fmt(balance)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#1c1917' },
  date: { fontSize: 12, color: '#78716c', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 3, elevation: 1 },
  summaryLabel: { fontSize: 11, color: '#78716c', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  balanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 1 },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { fontSize: 13, color: '#44403c', fontWeight: '500' },
  balanceValue: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#24784a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 6, elevation: 2 },
  actionBtnSecondary: { backgroundColor: '#f0f9f4', borderWidth: 1, borderColor: '#bbe3cf', elevation: 0 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  societyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  societyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  societyIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f9f4', alignItems: 'center', justifyContent: 'center' },
  societyName: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  societyReg: { fontSize: 11, color: '#a8a29e', marginTop: 1 },
  societyBalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 10 },
  balItem: { flex: 1 },
  balItemLabel: { fontSize: 10, color: '#a8a29e', marginBottom: 2 },
  balItemValue: { fontSize: 13, fontWeight: '600' },
});
