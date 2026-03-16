import { useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { logout } from '@/src/services/authService';
import apiClient from '@/src/services/apiClient';
import { Palette, Radius, Spacing, Typography, Shadows } from '@/constants/theme';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser]             = useState<UserProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [editModal, setEditModal]   = useState(false);
  const [editName, setEditName]     = useState('');
  const [editEmail, setEditEmail]   = useState('');
  const [saving, setSaving]         = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  async function loadUser() {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/auth/users/me');
      setUser(data.user);
    } catch (err) {
      console.error('loadUser error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit() {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      Alert.alert('Fel', 'Namn krävs.');
      return;
    }
    try {
      setSaving(true);
      const { data } = await apiClient.patch('/auth/users/me', {
        name: editName.trim(),
      });
      setUser(data.user);
      setEditModal(false);
    } catch (err) {
      Alert.alert('Fel', 'Kunde inte uppdatera profilen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logga ut', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Logga ut',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
    : '';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBg} />
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle} key={user?.name}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleOpenEdit}>
              <Text style={styles.editAvatarText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName} key={user?.name}>{user?.name || 'Användare'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>🗓 Medlem sedan {memberSince}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, Shadows.sm]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Namn</Text>
            <Text style={styles.infoValue}>{user?.name || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.infoRow} onPress={handleOpenEdit} activeOpacity={0.7}>
            <Text style={styles.infoLabel}>Redigera profil</Text>
            <Text style={styles.infoArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={[styles.infoCard, Shadows.sm]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Byggd med</Text>
            <Text style={styles.infoValue}>React Native</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, Shadows.sm]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Logga ut</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Redigera profil</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setEditModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Namn</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ditt namn"
              placeholderTextColor={Palette.gray400}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveEdit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <Text style={styles.saveBtnText}>💾 Spara ändringar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Palette.gray50 },
  content:        { paddingBottom: 100 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:         { alignItems: 'center', paddingBottom: Spacing.xl, marginBottom: Spacing.lg },
  headerBg:       { position: 'absolute', top: 0, left: 0, right: 0, height: 160, backgroundColor: Palette.primaryLight },
  avatarWrapper:  { marginTop: 100, position: 'relative' },
  avatarCircle:   { width: 100, height: 100, borderRadius: Radius.full, backgroundColor: Palette.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: Palette.white, ...Shadows.primary },
  avatarText:     { fontSize: 40, fontWeight: Typography.bold, color: Palette.white },
  editAvatarBtn:  { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: Radius.full, backgroundColor: Palette.white, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  editAvatarText: { fontSize: 14 },
  userName:       { fontSize: Typography.xxl, fontWeight: Typography.extrabold, color: Palette.gray900, marginTop: Spacing.xl },
  userEmail:      { fontSize: Typography.base, color: Palette.gray500, marginTop: 4 },
  memberBadge:    { backgroundColor: Palette.gray100, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginTop: Spacing.sm },
  memberText:     { fontSize: Typography.xs, color: Palette.gray500, fontWeight: Typography.medium },

  // Info cards
  infoCard:       { backgroundColor: Palette.white, borderRadius: Radius.lg, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, overflow: 'hidden' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  infoLabel:      { fontSize: Typography.base, color: Palette.gray500 },
  infoValue:      { fontSize: Typography.base, fontWeight: Typography.semibold, color: Palette.gray900, flex: 1, textAlign: 'right' },
  infoArrow:      { fontSize: Typography.xl, color: Palette.gray300 },
  divider:        { height: 1, backgroundColor: Palette.gray100, marginHorizontal: Spacing.lg },

  // Logout
  logoutButton:   { backgroundColor: Palette.danger, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.sm },
  logoutText:     { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.md },

  // Modal
  modal:          { flex: 1, backgroundColor: Palette.white },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Palette.gray100 },
  modalTitle:     { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900 },
  closeBtn:       { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Palette.gray100, justifyContent: 'center', alignItems: 'center' },
  closeText:      { fontSize: Typography.md, color: Palette.gray600 },
  modalContent:   { flex: 1, padding: Spacing.xl },
  inputLabel:     { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Palette.gray600, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input:          { borderWidth: 1.5, borderColor: Palette.gray200, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.md, color: Palette.gray900, backgroundColor: Palette.gray50 },
  saveBtn:        { backgroundColor: Palette.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  saveBtnText:    { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.md },
  cancelBtn:      { alignItems: 'center', padding: Spacing.lg },
  cancelText:     { color: Palette.gray400, fontSize: Typography.base },
});