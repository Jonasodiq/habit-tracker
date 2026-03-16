import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Modal,
  ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import InsightCards from '@/components/InsightCards';
import { getInsights, InsightsResponse } from '@/src/services/insightsService';
import { getHabits, Habit } from '@/src/services/habitService';
import apiClient from '@/src/services/apiClient';
import { Palette, Radius, Spacing, Typography, Shadows } from '@/constants/theme';

export default function InsightsScreen() {
  const [insightsData, setInsightsData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading]           = useState(true);
  const [habits, setHabits]             = useState<Habit[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [tipsText, setTipsText]         = useState('');
  const [weakestHabit, setWeakestHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        habitName:      weakestHabit.name,
        habitIcon:      weakestHabit.icon,
        habitFrequency: weakestHabit.frequency,
      });
      setTipsText(data.tips);
    } catch {
      setTipsText('Kunde inte hämta tips just nu. Försök igen senare.');
    } finally {
      setModalLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const [data, habitsData] = await Promise.all([getInsights(), getHabits()]);
      setInsightsData(data);
      setHabits(habitsData);
      if (habitsData.length > 0) {
        const weakest = [...habitsData].sort((a, b) => (a.streak || 0) - (b.streak || 0))[0];
        setWeakestHabit(weakest);
      }
    } catch (err) {
      console.error('handleRefresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }

  function parseTipsText(text: string) {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    return lines.map((line, lineIndex) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);

      return (
        <View key={lineIndex}>
          <Text style={styles.tipsText}>
            {parts.map((part, i) =>
              i % 2 === 1
                ? <Text key={i} style={styles.tipsBold}>{part}</Text>
                : <Text key={i}>{part}</Text>
            )}
          </Text>
        </View>
      );
    });
  }

  return (
    <>
      <View style={styles.screen}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI-insikter</Text>
            <Text style={styles.subtitle}>Personliga insikter baserade på dina vanor</Text>
          </View>
        </View>

        {/* Scrollbart innehåll */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Palette.primary}
              colors={[Palette.primary]}
            />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color={Palette.primary} style={{ marginTop: 32 }} />          
          ) : (
            <>
              {/* AI-insikter */}
              {insightsData && (
                <>
                  <InsightCards
                    aiInsight={insightsData.aiInsight}
                    fallbackInsights={insightsData.fallbackInsights}
                    generatedAt={insightsData.generatedAt}
                    dataPoints={insightsData.dataPoints}
                    fromCache={insightsData.fromCache}
                  />
                  <TouchableOpacity
                    style={[styles.refreshBtn, refreshing && styles.refreshBtnDisabled]}
                    onPress={handleRefresh}
                    disabled={refreshing}
                    activeOpacity={0.85}
                  >
                    {refreshing ? (
                      <ActivityIndicator color={Palette.primary} size="small" />
                    ) : (
                      <Text style={styles.refreshBtnText}>🔄 Generera nya insikter</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Svagaste vana */}
              {weakestHabit && (
                <View style={[styles.weakCard, Shadows.sm]}>
                  <Text style={styles.weakTitle}>💡 Förbättra din svagaste vana</Text>
                  <View style={[styles.weakHabit, { borderLeftColor: weakestHabit.color }]}>
                    <Text style={styles.weakIcon}>{weakestHabit.icon}</Text>
                    <View style={styles.weakInfo}>
                      <Text style={[styles.weakName, { color: weakestHabit.color }]}>
                        {weakestHabit.name}
                      </Text>
                      <Text style={styles.weakStreak}>
                        🔥 {weakestHabit.streak || 0} dagars streak
                      </Text>
                    </View>
                    <View style={[styles.weakBadge, { backgroundColor: weakestHabit.color + '22' }]}>
                      <Text style={[styles.weakBadgeText, { color: weakestHabit.color }]}>
                        Svagast
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.tipsButton, { backgroundColor: Palette.success}, Shadows.primary]}
                    onPress={handleGetTips}
                    activeOpacity={0.85}>
                      <Text style={styles.tipsButtonText}>Ja, ge mig tips! ✨</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
      
      {/* Tips Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalEmoji}>{weakestHabit?.icon}</Text>
              <Text style={styles.modalTitle}>Tips för {weakestHabit?.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {modalLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Palette.primary} />
                <Text style={styles.modalLoadingLogo}>🤖</Text>
                <Text style={styles.modalLoadingText}>AI tänker...</Text>
              </View>
            ) : (
              <>
                <View style={styles.tipsContainer}>
                  {/* Tips header */}
                  <View style={styles.tipsHeader}>
                    <Text style={styles.tipsIcon}>{weakestHabit?.icon}</Text>
                    <View style={styles.tipsHeaderInfo}>
                      <Text style={styles.tipsHabitName}>{weakestHabit?.name}</Text>
                      <Text style={styles.tipsSubtitle}>Här är dina personliga tips 💡</Text>
                    </View>
                  </View>
                  <View style={styles.tipsDivider} />
                  <View style={styles.tipsBody}>
                    {parseTipsText(tipsText)}
                  </View>
                </View>

                {/* OK knapp */}
                <TouchableOpacity
                  style={styles.okBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.okBtnText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: Palette.gray50 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg, backgroundColor: Palette.white, borderBottomWidth: 1, borderBottomColor: Palette.gray100 },
  headerEmoji:      { fontSize: 40 },
  title:            { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Palette.gray900 },
  subtitle:         { fontSize: Typography.sm, color: Palette.gray500, marginTop: 2 },
  container:        { flex: 1 },
  content:          { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  headerText:       { flex: 1 },
  refreshBtn:         { backgroundColor: Palette.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, alignSelf: 'center', marginTop: -Spacing.xxxl },
  refreshBtnDisabled: { opacity: 0.6 },
  refreshBtnText:     { color: Palette.white, fontWeight: Typography.semibold, fontSize: Typography.lg },

  // Svagaste vana
  weakCard:         { backgroundColor: Palette.white, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, marginTop: 50 },
  weakTitle:        { fontSize: Typography.md, fontWeight: Typography.bold, color: Palette.gray900 },
  weakHabit:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.gray50, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3 },
  weakIcon:         { fontSize: 32 },
  weakInfo:         { flex: 1 },
  weakName:         { fontSize: Typography.md, fontWeight: Typography.bold },
  weakStreak:       { fontSize: Typography.sm, color: Palette.gray500, marginTop: 2 },
  weakBadge:        { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  weakBadgeText:    { fontSize: Typography.xs, fontWeight: Typography.bold },
  tipsButton:       {  borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, alignSelf: 'center', margin: 24 },
  tipsButtonText:   { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.lg },

  // Modal
  modal:            { flex: 1, backgroundColor: Palette.white },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Palette.gray100 },
  modalTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  modalEmoji:       { fontSize: 24 },
  modalTitle:       { fontSize: Typography.lg, fontWeight: Typography.bold, color: Palette.gray900, flex: 1 },
  closeBtn:         { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Palette.gray100, justifyContent: 'center', alignItems: 'center' },
  closeText:        { fontSize: Typography.md, color: Palette.gray600 },
  modalContent:     { flex: 1, padding: Spacing.xl },
  modalLoading:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: Spacing.lg },
  modalLoadingText: { fontSize: Typography.md, color: Palette.gray500 },
  modalLoadingLogo: { fontSize: 48, marginTop: Spacing.md },
  tipsContainer:    { backgroundColor: Palette.tipsLight,borderWidth: 4, borderColor: Palette.tips + '44', borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md },
  tipsContent:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl},
  tipsTitle:        { fontSize: 54, color: Palette.gray500 },
  tipsText:         { fontSize: Typography.base, color: Palette.gray900, lineHeight: 24 },
  tipsHeader:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tipsIcon:         { fontSize: 40 },
  tipsHeaderInfo:   { flex: 1 },
  tipsHabitName:    { fontSize: Typography.xxxl, fontWeight: Typography.bold, color: Palette.gray900 },
  tipsSubtitle:     { fontSize: Typography.sm, color: Palette.gray500, marginTop: 2 },
  tipsDivider:      { height: 1, backgroundColor: Palette.tips + '85', marginVertical: Spacing.sm },
  tipsBody:         { gap: Spacing.sm },
  tipsBold:         { fontWeight: Typography.bold, color: Palette.gray900 },
  tipsSeparator:    { height: 1, backgroundColor: Palette.primary + '33', marginVertical: Spacing.sm },
  okBtn:            { backgroundColor: Palette.primary, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  okBtnText:        { color: Palette.white, fontWeight: Typography.bold, fontSize: Typography.lg },
});