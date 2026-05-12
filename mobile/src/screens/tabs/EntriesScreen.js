import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { entriesAPI, societiesAPI } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import Toast from 'react-native-toast-message';

export default function EntriesScreen() {
  const { canEdit } = useAuthStore();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(params.society || '');
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  const loadEntries = useCallback(async (reset = false) => {
    if (!selectedSociety) return;
    const currentPage = reset ? 1 : page;
    setLoading(true);
    try {
      const [eRes, bRes] = await Promise.all([
        entriesAPI.list(selectedSociety, { page: currentPage, limit: 25 }),
        societiesAPI.balance(selectedSociety),
      ]);
      const newEntries = eRes.data.entries || [];
      setEntries(reset ? newEntries : (prev) => [...prev, ...newEntries]);
      setHasMore(newEntries.length === 25);
      setBalance(bRes.data);
      if (reset) setPage(1);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedSociety, page]);

  useEffect(() => { loadEntries(true); }, [selectedSociety]);

  const handleDelete = (entry) => {
    Alert.alert('Delete Entry', `Delete "${entry.sub_heading}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await entriesAPI.delete(entry.id);
            Toast.show({ type: 'success', text1: 'Entry deleted' });
            loadEntries(true);
          } catch { Toast.show({ type: 'error', text1: 'Failed to delete' }); }
        }
      }
    ]);
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  const renderItem = ({ item }) => (
    <View style={s.entryCard}>
      <View style={s.entryTop}>
        <View style={[s.typeBadge, item.type === 'credit' ? s.creditBadge : s.debitBadge]}>
          <Text style={[s.typeBadgeText, item.type === 'credit' ? s.creditText : s.debitText]}>
            {item.entry_headings?.name}
          </Text>
        </View>
        <Text style={s.entryDate}>{format(new Date(item.entry_date), 'dd/MM/yyyy')}</Text>
      </View>
      <Text style={s.entrySubHeading}>{item.sub_heading}</Text>
      <View style={s.entryBottom}>
        <Text style={[s.entryAmount, item.type === 'credit' ? s.creditAmount : s.debitAmount]}>
          {item.type === 'credit' ? '+' : '-'}{fmt(item.amount)}
        </Text>
        <View style={s.entryActions}>
          {item.bill_url && (
            <TouchableOpacity style={s.iconBtn}>
              <Ionicons name="document-attach-outline" size={16} color="#24784a" />
            </TouchableOpacity>
          )}
          {canEdit() && (
            <>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push({ pathname: '/entries/edit', params: { id: item.id } })}>
                <Ionicons name="pencil-outline" size={16} color="#78716c" />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Society selector */}
      <View style={s.societyRow}>
        {societies.map((soc) => (
          <TouchableOpacity
            key={soc.id}
            style={[s.societyChip, selectedSociety === soc.id && s.societyChipActive]}
            onPress={() => setSelectedSociety(soc.id)}
          >
            <Text style={[s.societyChipText, selectedSociety === soc.id && s.societyChipTextActive]} numberOfLines={1}>
              {soc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Balance strip */}
      {balance && selectedSociety && (
        <View style={s.balanceStrip}>
          <View style={s.balItem}>
            <Text style={s.balLabel}>Credit</Text>
            <Text style={[s.balVal, { color: '#15803d' }]}>{fmt(balance.total_credit)}</Text>
          </View>
          <View style={s.balDivider} />
          <View style={s.balItem}>
            <Text style={s.balLabel}>Debit</Text>
            <Text style={[s.balVal, { color: '#dc2626' }]}>{fmt(balance.total_debit)}</Text>
          </View>
          <View style={s.balDivider} />
          <View style={s.balItem}>
            <Text style={s.balLabel}>Balance</Text>
            <Text style={[s.balVal, { color: balance.balance >= 0 ? '#1d5f3c' : '#dc2626', fontWeight: '700' }]}>{fmt(balance.balance)}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEntries(true); }} colors={['#24784a']} />}
        onEndReached={() => { if (hasMore && !loading) { setPage((p) => p + 1); loadEntries(); } }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Ionicons name="document-outline" size={40} color="#c4c2c0" />
              <Text style={s.emptyText}>{selectedSociety ? 'No entries found' : 'Select a society above'}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 16 }} color="#24784a" /> : null}
      />

      {canEdit() && selectedSociety && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push({ pathname: '/entries/new', params: { society: selectedSociety } })}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  societyRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  societyChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', maxWidth: 150 },
  societyChipActive: { backgroundColor: '#24784a', borderColor: '#24784a' },
  societyChipText: { fontSize: 12, color: '#44403c' },
  societyChipTextActive: { color: '#fff' },
  balanceStrip: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  balItem: { flex: 1, alignItems: 'center' },
  balLabel: { fontSize: 10, color: '#a8a29e' },
  balVal: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  balDivider: { width: 1, backgroundColor: '#e7e5e4', marginVertical: 2 },
  list: { padding: 12, paddingBottom: 80 },
  entryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  creditBadge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  debitBadge: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  typeBadgeText: { fontSize: 11, fontWeight: '500' },
  creditText: { color: '#15803d' },
  debitText: { color: '#dc2626' },
  entryDate: { fontSize: 11, color: '#a8a29e' },
  entrySubHeading: { fontSize: 14, color: '#1c1917', marginBottom: 8 },
  entryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryAmount: { fontSize: 16, fontWeight: '700' },
  creditAmount: { color: '#15803d' },
  debitAmount: { color: '#dc2626' },
  entryActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#a8a29e', fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#24784a', alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
