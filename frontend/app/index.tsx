import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { isLoggedIn } from '@/src/services/authService';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    isLoggedIn()
      .then((result) => setLoggedIn(result))
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (loggedIn) {
    return <Redirect href="/(tabs)/habits" />;
  }

  return <Redirect href="/(auth)/login" />;
}