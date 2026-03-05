import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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

        <ThemedText type="title" style={{ marginBottom: 4 }}>
          {user?.name || 'Användare'}
        </ThemedText>
        <ThemedText type="subtitle" style={{ marginBottom: 24 }}>
          {user?.email || ''}
        </ThemedText>

        <ThemedText style={{ color: '#aaa', fontSize: 14 }}>
          Medlem sedan {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
            : ''}
        </ThemedText>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logga ut</ThemedText>
        </TouchableOpacity>

      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginTop: 32,
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