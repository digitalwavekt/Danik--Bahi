import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api/client';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email required';
    if (!password) errs.password = 'Password required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login({ email: email.toLowerCase().trim(), password });
      await setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo area */}
        <View style={s.logoArea}>
          <View style={s.logoBox}>
            <Ionicons name="book" size={32} color="#fff" />
          </View>
          <Text style={s.title}>Dainik Bahi</Text>
          <Text style={s.subtitle}>Sahakari Samiti Ledger System</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>Email Address</Text>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Ionicons name="mail-outline" size={16} color="#78716c" style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="admin@example.com"
                placeholderTextColor="#c4c2c0"
              />
            </View>
            {errors.email && <Text style={s.errText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Ionicons name="lock-closed-outline" size={16} color="#78716c" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor="#c4c2c0"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#78716c" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.errText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>© 2024 Digital Wave IT Solutions Pvt Ltd</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0b2318' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#24784a', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: '#6ee7b7', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1c1917', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#44403c', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, height: 46 },
  inputError: { borderColor: '#f87171' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#1c1917' },
  eyeBtn: { padding: 4 },
  errText: { color: '#ef4444', fontSize: 11, marginTop: 4 },
  btn: { backgroundColor: '#24784a', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', color: '#4d7a5e', fontSize: 11, marginTop: 32 },
});
