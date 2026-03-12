import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import InsightCards from '@/components/InsightCards';
import { getInsights, InsightsResponse } from '@/src/services/insightsService';
import { getHabits, Habit } from '@/src/services/habitService';
import apiClient from '@/src/services/apiClient';

export default function InsightsScreen() {
  const [insightsData, setInsightsData]   = useState<InsightsResponse | null>(null);
  const [loading, setLoading]             = useState(true);
  const [habits, setHabits]               = useState<Habit[]>([]);
  const [modalVisible, setModalVisible]   = useState(false);
  const [modalLoading, setModalLoading]   = useState(false);
  const [tipsText, setTipsText]           = useState('');
  const [weakestHabit, setWeakestHabit]   = useState<Habit | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      setLoading(true);
      const [data, habitsData] = await Promise.all([getInsights(), getHabits()]);
      setInsightsData(data);
      setHabits(habitsData);

      // Hitta svagaste vana (lägst streak)
      if (habitsData.length > 0) {
        const weakest = [...habitsData].sort((a, b) => (a.streak || 0) - (b.streak || 0))[0];
        setWeakestHabit(weakest);
      }
    } catch (err) {
      console.error('loadData error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetTips() {
    if (!weakestHabit) return;
    setModalVisible(true);
    setModalLoading(true);
    setTipsText('');

    try {
      const { data } = await apiClient.post('/insights/tips', {
        habitName: weakestHabit.name,
        habitIcon: weakestHabit.icon,
        habitFrequency: weakestHabit.frequency,
      });
      setTipsText(data.tips);
    } catch (err) {
      setTipsText('Kunde inte hämta tips just nu. Försök igen senare.');
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#EEF2FF', dark: '#1a1a2e' }}
        headerImage={
          <Text style={styles.headerEmoji}>🤖</Text>
        }
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>AI-insikter</ThemedText>
          <ThemedText style={styles.subtitle}>
            Personliga insikter baserade på dina vanor
          </ThemedText>

          {loading ? (
            <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 32 }} />
          ) : (
            <>
              {/* AI-insikter */}
              {insightsData && (
                <InsightCards
                  aiInsight={insightsData.aiInsight}
                  fallbackInsights={insightsData.fallbackInsights}
                  generatedAt={insightsData.generatedAt}
                  dataPoints={insightsData.dataPoints}
                  fromCache={insightsData.fromCache}
                />
              )}

              {/* Svagaste vana sektion */}
              {weakestHabit && (
                <View style={styles.weakCard}>
                  <Text style={styles.weakTitle}>💡 Förbättra din svagaste vana</Text>
                  <View style={styles.weakHabit}>
                    <Text style={styles.weakIcon}>{weakestHabit.icon}</Text>
                    <View style={styles.weakInfo}>
                      <Text style={styles.weakName}>{weakestHabit.name}</Text>
                      <Text style={styles.weakStreak}>
                        🔥 {weakestHabit.streak || 0} dagars streak
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.tipsButton} onPress={handleGetTips}>
                    <Text style={styles.tipsButtonText}>Ja, ge mig tips! ✨</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ThemedView>
      </ParallaxScrollView>

      {/* Tips Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {weakestHabit?.icon} Tips för {weakestHabit?.name}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {modalLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.modalLoadingText}>AI tänker... 🤖</Text>
              </View>
            ) : (
              <Text style={styles.tipsText}>{tipsText}</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerEmoji:      { fontSize: 120, textAlign: 'center', marginTop: 60 },
  container:        { gap: 16 },
  title:            { marginBottom: 4 },
  subtitle:         { color: '#687076', marginBottom: 8 },
  weakCard:         { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, gap: 12 },
  weakTitle:        { fontSize: 16, fontWeight: '700', color: '#11181C' },
  weakHabit:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  weakIcon:         { fontSize: 32 },
  weakInfo:         { flex: 1 },
  weakName:         { fontSize: 16, fontWeight: '600', color: '#11181C' },
  weakStreak:       { fontSize: 13, color: '#687076', marginTop: 2 },
  tipsButton:       { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  tipsButtonText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  modal:            { flex: 1, backgroundColor: '#fff' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: '#11181C', flex: 1 },
  closeButton:      { fontSize: 18, color: '#687076', padding: 4 },
  modalContent:     { flex: 1, padding: 20 },
  modalLoading:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  modalLoadingText: { fontSize: 16, color: '#687076' },
  tipsText:         { fontSize: 15, color: '#11181C', lineHeight: 24 },
});