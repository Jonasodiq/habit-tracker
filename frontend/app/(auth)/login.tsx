import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Fyll i alla fält', 'Email och lösenord krävs.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Ogiltig email', 'Ange en giltig e-postadress.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace('/(tabs)/habits' as any);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Fel email eller lösenord';
      Alert.alert('Inloggning misslyckades', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>HabitTracker</Text>
        <Text style={styles.title}>Välkommen tillbaka!</Text>
        <Text style={styles.subtitle}>Logga in för att fortsätta din resa</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="din@email.com"
            placeholderTextColor={Palette.gray400}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Lösenord</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Palette.gray400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Logga in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/register' as any)}
        >
          <Text style={styles.linkText}>
            Inget konto?{' '}
            <Text style={styles.linkBold}>Registrera dig</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Palette.white, padding: Spacing.xl, justifyContent: 'center' },
  header:         { alignItems: 'center', marginBottom: Spacing.xxxl, },
  emoji:          { fontSize: 56, marginBottom: Spacing.sm, },
  appName:        { fontFamily: "Roboto",fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm, },
  title:          { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Palette.gray900, marginBottom: Spacing.xs, },
  subtitle:       { fontSize: Typography.base, color: Palette.gray500, },
  form:           { gap: Spacing.md, },
  inputWrapper:   { gap: Spacing.xs, },
  label:          { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Palette.gray600, },
  input:          { borderWidth: 1.5, borderColor: Palette.gray200, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.md, color: Palette.gray900, backgroundColor: Palette.gray50, },
  button:         { backgroundColor: Palette.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm, shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, },
  buttonDisabled: { opacity: 0.7,},
  buttonText:     { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.md },
  linkButton:     { alignItems: 'center', paddingVertical: Spacing.sm, },
  linkText:       { fontSize: Typography.base, color: Palette.gray500 },
  linkBold:       { color: Palette.primary, fontWeight: Typography.bold,},
});