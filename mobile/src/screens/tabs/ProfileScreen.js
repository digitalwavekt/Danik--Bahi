import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/client';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  society_admin: 'Society Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  auditor: 'Auditor',
};

export default function ProfileScreen() {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await authAPI.logout(refreshToken); } catch {}
          await clearAuth();
          router.replace('/login');
        }
      }
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert('Sign Out All Devices', 'This will sign you out from all devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out All', style: 'destructive',
        onPress: async () => {
          try {
            const { api } = await import('../../api/client');
            await api.post('/auth/logout-all');
          } catch {}
          await clearAuth();
          router.replace('/login');
        }
      }
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.userName}>{user?.name}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{ROLE_LABELS[user?.role] || user?.role}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account Info</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={18} color="#78716c" />
            <View style={s.infoTextWrap}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoValue}>{user?.name}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={18} color="#78716c" />
            <View style={s.infoTextWrap}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue}>{user?.email}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Ionicons name="shield-outline" size={18} color="#78716c" />
            <View style={s.infoTextWrap}>
              <Text style={s.infoLabel}>Role</Text>
              <Text style={s.infoValue}>{ROLE_LABELS[user?.role]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Session</Text>
        <TouchableOpacity style={s.actionRow} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[s.actionText, { color: '#ef4444' }]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#c4c2c0" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity style={s.actionRow} onPress={handleLogoutAll} activeOpacity={0.7}>
          <Ionicons name="phone-portrait-outline" size={20} color="#ef4444" />
          <Text style={[s.actionText, { color: '#ef4444' }]}>Sign Out All Devices</Text>
          <Ionicons name="chevron-forward" size={16} color="#c4c2c0" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>Dainik Bahi v1.0.0{'\n'}© Digital Wave IT Solutions Pvt Ltd</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#24784a', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '700', color: '#1c1917' },
  userEmail: { fontSize: 13, color: '#78716c', marginTop: 2 },
  roleBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f0f9f4', borderWidth: 1, borderColor: '#bbe3cf' },
  roleText: { color: '#24784a', fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#a8a29e' },
  infoValue: { fontSize: 14, color: '#1c1917', fontWeight: '500', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#f5f5f4' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, backgroundColor: '#fff', paddingHorizontal: 14 },
  actionText: { fontSize: 14, fontWeight: '500' },
  footer: { textAlign: 'center', color: '#c4c2c0', fontSize: 11, lineHeight: 18, marginTop: 20 },
});
