import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logout } from '@/src/services/authService';
import apiClient from '@/src/services/apiClient';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#c1ddd5', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={180}
          color="#4ECDC4"
          name="person.crop.circle.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={{ flex: 1, alignItems: 'center', paddingTop: 32 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#6C63FF" />
        ) : (
          <>
            <ThemedText type="title" style={{ marginBottom: 4 }}>
              {user?.name || 'Användare'}
            </ThemedText>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              {user?.email || ''}
            </ThemedText>
            <ThemedText style={{ color: '#aaa', fontSize: 14, marginBottom: 32 }}>
              Medlem sedan {memberSince}
            </ThemedText>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logga ut</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerImage: {
    color: '#808080',
    alignSelf: 'center',
    position: 'relative',
    top: 0,
    marginTop: 56,
  },
});