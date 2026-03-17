import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function AddButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/habit-form')} activeOpacity={0.85}>
      <View style={styles.addButtonInner}>
        <IconSymbol size={32} name="plus" color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
      }}
    >
    <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="habits"
        options={{ title: 'Vanor', tabBarIcon: ({ color }) => <IconSymbol size={32}
        name="checkmark.circle.fill" color={color} /> }} 
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats', tabBarIcon: ({ color }) => <IconSymbol size={32}
        name="chart.bar.fill" color={color} /> }}
      />
      <Tabs.Screen
        name="habit-form"
        options={{ title: '', tabBarIcon: () => null, tabBarButton: () => <AddButton /> }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'AI', tabBarIcon: ({ color }) => <IconSymbol size={32}
        name="sparkles" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <IconSymbol size={32}
        name="person.crop.circle.fill" color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar:         { height: 80, paddingBottom: 16, paddingTop: 8 },
  addButton:      { top: -20, justifyContent: 'center', alignItems: 'center', width: 64, marginLeft: 16 },
  addButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: Palette.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
});