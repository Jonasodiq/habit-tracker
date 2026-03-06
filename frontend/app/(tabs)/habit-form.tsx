import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createHabit, updateHabit } from '@/src/services/habitService';

const COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
const ICONS  = ['⭐', '💪', '📚', '🧘', '💧', '🏃', '🎯', '😴', '🥗', '🎵'];

export default function HabitFormScreen() {
  const params = useLocalSearchParams<{
    habitId?: string;
    name?: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    color?: string;
    icon?: string;
  }>();

  const isEditing = !!params.habitId;

  const [name, setName]               = useState(params.name || '');
  const [description, setDescription] = useState(params.description || '');
  const [frequency, setFrequency]     = useState<'daily' | 'weekly' | 'monthly'>(params.frequency || 'daily');
  const [color, setColor]             = useState(params.color || '#6C63FF');
  const [icon, setIcon]               = useState(params.icon || '⭐');
  const [loading, setLoading]         = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Fyll i namn', 'Vanan måste ha ett namn.');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('För kort namn', 'Namnet måste vara minst 2 tecken.');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await updateHabit(params.habitId!, { name: name.trim(), description: description.trim(), frequency, color, icon });
      } else {
        await createHabit({ name: name.trim(), description: description.trim(), frequency, color, icon });
      }
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error || (isEditing ? 'Kunde inte uppdatera vanan' : 'Kunde inte skapa vanan');
      Alert.alert('Fel', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isEditing ? 'Redigera vana' : 'Ny vana'}</Text>

      <Text style={styles.label}>Namn *</Text>
      <TextInput
        style={styles.input}
        placeholder="t.ex. Träna, Läsa, Meditation"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      <Text style={styles.label}>Beskrivning (valfritt)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="t.ex. 30 min träning varje dag"
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
      />

      <Text style={styles.label}>Frekvens</Text>
      <View style={styles.row}>
        {(['daily', 'weekly', 'monthly'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, frequency === f && styles.chipActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
              {f === 'daily' ? 'Dagligen' : f === 'weekly' ? 'Veckovis' : 'Månadsvis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Färg</Text>
      <View style={styles.row}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <Text style={styles.label}>Ikon</Text>
      <View style={styles.row}>
        {ICONS.map((i) => (
          <TouchableOpacity
            key={i}
            style={[styles.iconButton, icon === i && styles.iconButtonActive]}
            onPress={() => setIcon(i)}
          >
            <Text style={styles.iconText}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.preview, { borderLeftColor: color }]}>
        <Text style={styles.previewIcon}>{icon}</Text>
        <View>
          <Text style={styles.previewName}>{name || 'Vana namn'}</Text>
          <Text style={styles.previewDesc}>{description || 'Beskrivning'}</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isEditing ? 'Spara ändringar' : 'Skapa vana'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Avbryt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title:            { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#11181C' },
  label:            { fontSize: 14, fontWeight: '600', color: '#687076', marginBottom: 8, marginTop: 16 },
  input:            { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#11181C', backgroundColor: '#F9FAFB' },
  textArea:         { height: 80, textAlignVertical: 'top' },
  row:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipActive:       { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText:         { fontSize: 14, color: '#687076' },
  chipTextActive:   { color: '#fff', fontWeight: '600' },
  colorDot:         { width: 32, height: 32, borderRadius: 16 },
  colorDotActive:   { borderWidth: 3, borderColor: '#11181C' },
  iconButton:       { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  iconButtonActive: { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#6C63FF' },
  iconText:         { fontSize: 22 },
  preview:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginTop: 24, borderLeftWidth: 4 },
  previewIcon:      { fontSize: 28 },
  previewName:      { fontSize: 16, fontWeight: '600', color: '#11181C' },
  previewDesc:      { fontSize: 13, color: '#687076', marginTop: 2 },
  button:           { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText:       { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelButton:     { alignItems: 'center', padding: 16, marginBottom: 32 },
  cancelText:       { color: '#687076', fontSize: 15 },
});