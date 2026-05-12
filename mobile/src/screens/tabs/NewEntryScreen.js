import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { entriesAPI, societiesAPI, headingsAPI } from '../../api/client';
import Toast from 'react-native-toast-message';

export default function NewEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [societies, setSocieties] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [societyId, setSocietyId] = useState(params.society || '');
  const [headingId, setHeadingId] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    societiesAPI.list().then((r) => setSocieties(r.data.societies || []));
  }, []);

  useEffect(() => {
    if (!societyId) { setHeadings([]); return; }
    headingsAPI.list(societyId).then((r) => setHeadings(r.data.headings || []));
    setHeadingId('');
  }, [societyId]);

  const pickBill = async () => {
    Alert.alert('Upload Bill', 'Choose source', [
      { text: 'Camera / Gallery', onPress: pickImage },
      { text: 'PDF Document', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setBill({ uri: result.assets[0].uri, type: 'image/jpeg', name: 'bill.jpg' });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled) setBill({ uri: result.assets[0].uri, type: 'application/pdf', name: result.assets[0].name });
  };

  const validate = () => {
    const errs = {};
    if (!societyId) errs.societyId = 'Select a society';
    if (!headingId) errs.headingId = 'Select a heading';
    if (!subHeading.trim()) errs.subHeading = 'Sub-heading required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errs.amount = 'Valid amount required';
    if (!entryDate) errs.entryDate = 'Date required';
    if (entryDate > format(new Date(), 'yyyy-MM-dd')) errs.entryDate = 'Future date not allowed';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('society_id', societyId);
      formData.append('heading_id', headingId);
      formData.append('sub_heading', subHeading.trim());
      formData.append('amount', parseFloat(amount).toString());
      formData.append('entry_date', entryDate);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (bill) formData.append('bill', { uri: bill.uri, type: bill.type, name: bill.name });

      await entriesAPI.create(formData);
      Toast.show({ type: 'success', text1: 'Entry added successfully!' });
      router.back();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add entry';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const creditHeadings = headings.filter((h) => h.type === 'credit');
  const debitHeadings = headings.filter((h) => h.type === 'debit');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Society */}
        <View style={s.field}>
          <Text style={s.label}>Society <Text style={s.req}>*</Text></Text>
          <View style={[s.pickerWrap, errors.societyId && s.inputError]}>
            {societies.map((soc) => (
              <TouchableOpacity
                key={soc.id}
                style={[s.chip, societyId === soc.id && s.chipActive]}
                onPress={() => setSocietyId(soc.id)}
              >
                <Text style={[s.chipText, societyId === soc.id && s.chipTextActive]}>{soc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.societyId && <Text style={s.errText}>{errors.societyId}</Text>}
        </View>

        {/* Heading */}
        {societyId && (
          <View style={s.field}>
            <Text style={s.label}>Entry Heading <Text style={s.req}>*</Text></Text>
            {creditHeadings.length > 0 && (
              <>
                <Text style={s.typeLabel}>CREDIT</Text>
                <View style={s.pickerWrap}>
                  {creditHeadings.map((h) => (
                    <TouchableOpacity key={h.id} style={[s.chip, s.creditChip, headingId === h.id && s.creditChipActive]} onPress={() => setHeadingId(h.id)}>
                      <Text style={[s.chipText, headingId === h.id && { color: '#fff' }]}>{h.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {debitHeadings.length > 0 && (
              <>
                <Text style={[s.typeLabel, { color: '#dc2626' }]}>DEBIT</Text>
                <View style={s.pickerWrap}>
                  {debitHeadings.map((h) => (
                    <TouchableOpacity key={h.id} style={[s.chip, s.debitChip, headingId === h.id && s.debitChipActive]} onPress={() => setHeadingId(h.id)}>
                      <Text style={[s.chipText, headingId === h.id && { color: '#fff' }]}>{h.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {errors.headingId && <Text style={s.errText}>{errors.headingId}</Text>}
          </View>
        )}

        {/* Sub Heading */}
        <View style={s.field}>
          <Text style={s.label}>Description <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.subHeading && s.inputError]}
            value={subHeading}
            onChangeText={setSubHeading}
            placeholder="e.g., Monthly fee from Ramesh Ji"
            placeholderTextColor="#c4c2c0"
          />
          {errors.subHeading && <Text style={s.errText}>{errors.subHeading}</Text>}
        </View>

        {/* Amount */}
        <View style={s.field}>
          <Text style={s.label}>Amount (₹) <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.amount && s.inputError]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#c4c2c0"
          />
          {errors.amount && <Text style={s.errText}>{errors.amount}</Text>}
        </View>

        {/* Date */}
        <View style={s.field}>
          <Text style={s.label}>Entry Date <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.entryDate && s.inputError]}
            value={entryDate}
            onChangeText={setEntryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#c4c2c0"
          />
          <Text style={s.hint}>Format: YYYY-MM-DD. Past dates allowed.</Text>
          {errors.entryDate && <Text style={s.errText}>{errors.entryDate}</Text>}
        </View>

        {/* Notes */}
        <View style={s.field}>
          <Text style={s.label}>Notes (optional)</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Additional notes..."
            placeholderTextColor="#c4c2c0"
            textAlignVertical="top"
          />
        </View>

        {/* Bill Upload */}
        <View style={s.field}>
          <Text style={s.label}>Upload Bill (optional)</Text>
          {bill ? (
            <View style={s.billRow}>
              <Ionicons name="document-attach-outline" size={20} color="#24784a" />
              <Text style={s.billName} numberOfLines={1}>{bill.name}</Text>
              <TouchableOpacity onPress={() => setBill(null)}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.uploadBtn} onPress={pickBill}>
              <Ionicons name="cloud-upload-outline" size={20} color="#24784a" />
              <Text style={s.uploadBtnText}>Tap to upload image or PDF</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, loading && s.submitDisabled]} onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Add Entry</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 48 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403c', marginBottom: 8 },
  req: { color: '#ef4444' },
  input: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, padding: 12, fontSize: 14, color: '#1c1917', backgroundColor: '#fff' },
  textArea: { height: 80, paddingTop: 10 },
  inputError: { borderColor: '#f87171' },
  errText: { color: '#ef4444', fontSize: 11, marginTop: 4 },
  hint: { color: '#a8a29e', fontSize: 11, marginTop: 3 },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#24784a', borderColor: '#24784a' },
  chipText: { fontSize: 13, color: '#44403c' },
  chipTextActive: { color: '#fff' },
  creditChip: { borderColor: '#bbf7d0' },
  creditChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  debitChip: { borderColor: '#fecaca' },
  debitChipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  typeLabel: { fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  uploadBtn: { borderWidth: 1.5, borderColor: '#bbe3cf', borderStyle: 'dashed', borderRadius: 10, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', backgroundColor: '#f0f9f4' },
  uploadBtnText: { color: '#24784a', fontSize: 13 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0f9f4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbe3cf' },
  billName: { flex: 1, fontSize: 13, color: '#1c1917' },
  submitBtn: { backgroundColor: '#24784a', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 2 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
