import { Platform, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Header } from '@react-navigation/elements';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  // Dummy user data
  const user = {
    name: 'Test User',
    email: 'test@example.com',
    joinedDate: 'Feb 2024',
    totalHabits: 3,
    daysActive: 15,
  };

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
        {/* Name & Email */}
        <ThemedText type="title" style={{ marginBottom: 4 }}>
          {user.name}
        </ThemedText>
        <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
          {user.email}
        </ThemedText>
        {/* Stats */}
        <ThemedView style={{ flexDirection: 'row', gap: 24, marginBottom: 24 }}>
          <ThemedView style={{ alignItems: 'center' }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 20 }}>
              {user.totalHabits}
            </ThemedText>
            <ThemedText>Habits</ThemedText>
          </ThemedView>
          <ThemedView style={{ alignItems: 'center' }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 20 }}>
              {user.daysActive}
            </ThemedText>
            <ThemedText>Days Active</ThemedText>
          </ThemedView>
        </ThemedView>
        {/* Member since */}
        <ThemedText style={{ color: '#aaa', fontSize: 14 }}>
          Member since {user.joinedDate}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    alignSelf: 'center',
    position: 'relative',
    top: 0,
    marginTop: 56,
  },
});
