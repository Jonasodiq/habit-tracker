import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createHabit, updateHabit } from '@/src/services/habitService';
import { Palette, Radius, Spacing, Typography, Shadows, COLORS_DEFAULT } from '@/constants/theme';
import { ICONS_DEFAULT } from '@/constants/icons';
import IconPickerModal from '@/components/IconPickerModal';
import ColorPickerModal from '@/components/ColorPickerModal';

export default function HabitFormScreen() {
  
  const params = useLocalSearchParams<{
    habitId?: string;
    name?: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    color?: string;
    icon?: string;
  }>();
  // console.log('PARAMS:', params);
  const isEditing = !!params.habitId;

  const [name, setName]               = useState(params.name || '');
  const [description, setDescription] = useState(params.description || '');
  const [frequency, setFrequency]     = useState<'daily' | 'weekly' | 'monthly'>(params.frequency || 'daily');
  const [color, setColor]             = useState(params.color || Palette.primary);
  const [icon, setIcon]               = useState(params.icon || '⭐');
  const [loading, setLoading]         = useState(false);
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [showMoreColors, setShowMoreColors] = useState(false);

 useEffect(() => {
  if (!params.habitId) {
    setName('');
    setDescription('');
    setFrequency('daily');
    setColor(Palette.primary);
    setIcon('⭐');
    return;
  }
  if (params.name)        setName(params.name);
  if (params.description) setDescription(params.description);
  if (params.frequency)   setFrequency(params.frequency);
  if (params.color)       setColor(params.color);
  if (params.icon)        setIcon(params.icon);
}, [params.habitId]);

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

  const colorWithOpacity = color + '22';

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <Text style={styles.title}>{isEditing ? 'Redigera vana' : 'Ny vana'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Preview card */}
        <View style={[styles.preview, { backgroundColor: colorWithOpacity, borderColor: color }]}>
          <Text style={styles.previewIcon}>{icon}</Text>
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color }]}>{name || 'Vana namn'}</Text>
            <Text style={styles.previewDesc}>{description || 'Beskrivning'}</Text>
          </View>
          <View style={[styles.previewBadge, { backgroundColor: color }]}>
            <Text style={styles.previewBadgeText}>
              {frequency === 'daily' ? 'Dagligen' : frequency === 'weekly' ? 'Veckovis' : 'Månadsvis'}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.label}>Namn *</Text>
        <TextInput
          style={styles.input}
          placeholder="t.ex. Träna, Läsa, Meditation"
          placeholderTextColor={Palette.gray400}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        {/* Description */}
        <Text style={styles.label}>Beskrivning (valfritt)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="t.ex. 30 min träning varje dag"
          placeholderTextColor={Palette.gray400}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />

        {/* Frequency */}
        <Text style={styles.label}>Frekvens</Text>
        <View style={styles.row}>
          {(['daily', 'weekly', 'monthly'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, frequency === f && { backgroundColor: color, borderColor: color }]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                {f === 'daily' ? 'Dagligen' : f === 'weekly' ? 'Veckovis' : 'Månadsvis'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color */}
        <Text style={styles.label}>Färg</Text>
        <View style={styles.row}>
          {COLORS_DEFAULT.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                color === c && styles.colorDotActive,
              ]}
              onPress={() => setColor(c)}
            >
              {color === c && <Text style={styles.colorCheck}>✓</Text>}
            </TouchableOpacity>
          ))}

          {/* More colors button */}
          <TouchableOpacity
            style={[styles.colorDot, styles.moreColorsBtn]}
            onPress={() => setShowMoreColors(true)}
          >
            <Text style={styles.moreColorsText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <Text style={styles.label}>Ikon</Text>
        <View style={styles.row}>
          {ICONS_DEFAULT.map((i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.iconButton,
                icon === i && { backgroundColor: colorWithOpacity, borderColor: color },
              ]}
              onPress={() => setIcon(i)}
            >
              <Text style={styles.iconText}>{i}</Text>
            </TouchableOpacity>
          ))}

          {/* More icons button */}
          <TouchableOpacity
            style={[styles.iconButton, styles.moreIconsBtn]}
            onPress={() => setShowMoreIcons(true)}
          >
            <Text style={styles.moreIconsText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Palette.successDark }, Shadows.primary]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
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

      {/* More icons Modal */}
      <IconPickerModal
        visible={showMoreIcons}
        selectedIcon={icon}
        selectedColor={color}
        onSelect={setIcon}
        onClose={() => setShowMoreIcons(false)}
      />

      {/* More colors Modal */}
      <ColorPickerModal
        visible={showMoreColors}
        selectedColor={color}
        onSelect={setColor}
        onClose={() => setShowMoreColors(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Palette.white },
  content:          { padding: Spacing.xl, paddingTop: 60, paddingBottom: 48 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backBtn:          { width: 36, height: 36, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Palette.gray300, backgroundColor: Palette.gray100, justifyContent: 'center', alignItems: 'center' },
  backText:         { fontSize: Typography.md, color: Palette.gray500 },
  title:            { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900 },
  preview:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1.5 },
  previewIcon:      { fontSize: 36 },
  previewInfo:      { flex: 1 },
  previewName:      { fontSize: Typography.md, fontWeight: Typography.bold },
  previewDesc:      { fontSize: Typography.sm, color: Palette.gray500, marginTop: 2 },
  previewBadge:     { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  previewBadgeText: { fontSize: Typography.xs, color: Palette.white, fontWeight: Typography.bold },
  label:            { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Palette.gray600, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input:            { borderWidth: 1.5, borderColor: Palette.gray200, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.md, color: Palette.gray900, backgroundColor: Palette.gray50 },
  textArea:         { height: 80, textAlignVertical: 'top' },
  row:              { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip:             { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Palette.gray200, backgroundColor: Palette.gray50 },
  chipText:         { fontSize: Typography.sm, color: Palette.gray500 },
  chipTextActive:   { color: Palette.white, fontWeight: Typography.semibold },
  colorDot:         { width: 36, height: 36, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  colorDotActive:   { borderWidth: 3, borderColor: Palette.gray400 },
  colorCheck:       { color: Palette.white, fontSize: Typography.sm, fontWeight: Typography.bold },
  moreIconsBtn:     { backgroundColor: Palette.gray100, borderColor: Palette.gray300 },
  moreIconsText:    { fontSize: Typography.xxxl, color: Palette.gray400 },
  iconButton:       { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.gray100, borderWidth: 1.5, borderColor: 'transparent' },
  iconText:         { fontSize: 24 },
  button:           { borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  buttonText:       { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.md },
  cancelButton:     { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.md },
  cancelText:       { color: Palette.gray400, fontSize: Typography.base },
  moreColorsBtn:    { backgroundColor: Palette.gray100, borderWidth: 1.5, borderColor: Palette.gray300 },
  moreColorsText:   { fontSize: Typography.xl, color: Palette.gray400, fontWeight: Typography.bold },
});