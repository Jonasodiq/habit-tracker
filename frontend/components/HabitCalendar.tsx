import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Svg, { Circle } from 'react-native-svg';
import { Completion } from '@/src/services/completionService';
import { Habit } from '@/src/services/habitService';
import { LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['sv'] = {
  monthNames: [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
  ],
  dayNames: [
    'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag',
  ],
  dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
  today: 'Idag',
};

LocaleConfig.defaultLocale = 'sv';

interface Props {
  habits: Habit[];
  completions: Completion[];
}

export default function HabitCalendar({ habits, completions }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const habitMap = new Map(habits.map((h) => [h.habitId, h]));
  const todayStr = new Date().toISOString().slice(0, 10);

  // Build completions per day
  const completionsPerDay: Record<string, string[]> = {};
  completions.forEach((c) => {
    if (!completionsPerDay[c.completedDate]) completionsPerDay[c.completedDate] = [];
    completionsPerDay[c.completedDate].push(c.habitId);
  });

  // Build markedDates with dots (max 3)
  const markedDates: Record<string, any> = {};
  completions.forEach((c) => {
    const habit = habitMap.get(c.habitId);
    if (!habit) return;
    if (!markedDates[c.completedDate]) markedDates[c.completedDate] = { dots: [] };
    if (markedDates[c.completedDate].dots.length < 3) {
      markedDates[c.completedDate].dots.push({ key: habit.habitId, color: habit.color });
    }
  });

  // Completions for selected day
  const selectedCompletions = selectedDate
    ? completions.filter((c) => c.completedDate === selectedDate)
    : [];

  const size = 36;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Kalender</Text>

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}       
        dayComponent={({ date, state, marking }: any) => {
          const isToday    = date.dateString === todayStr;
          const isSelected = date.dateString === selectedDate;
          const total      = habits.length;
          const completed  = (completionsPerDay[date.dateString] || []).length;
          const progress   = total > 0 ? Math.min(completed / total, 1) : 0;
          const strokeDashoffset = circumference * (1 - progress);

          return (
            <View style={{ alignItems: 'center', width: size }}>
              <View onTouchEnd={() => setSelectedDate(date.dateString)}>
                <Svg width={size} height={size}>
                  {/* Background circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill={isSelected ? '#ccc' : isToday ? '#ADD8E6' : 'transparent'}
                  />
                  {/* Progress-ring */}
                  {progress > 0 && (
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="#FFBF00"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${size / 2}, ${size / 2}`}
                    />
                  )}
                </Svg>
                <Text
                  style={{
                    position: 'absolute',
                    width: size,
                    textAlign: 'center',
                    lineHeight: size,
                    color: isSelected ? '#fff' : isToday ? '#6C63FF' : state === 'disabled' ? '#ccc' : '#11181C',
                    fontWeight: isToday ? '700' : '400',
                    fontSize: 13,
                  }}
                >
                  {date.day}
                </Text>
              </View>
            </View>
          );
        }}
        theme={{
          arrowColor: '#6C63FF',
          textMonthFontSize: 16,
          textMonthFontWeight: '700',
        }}
      />

      {/* Details for selected day */}
      {selectedDate && (
        <View style={styles.details}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('sv-SE', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
            {habits.length > 0 && (
              <Text style={styles.detailsPercent}>
                {Math.round((selectedCompletions.length / habits.length) * 100)}%
              </Text>
            )}
          </View>

          {selectedCompletions.length === 0 ? (
            <Text style={styles.noCompletions}>Inga vanor genomförda</Text>
          ) : (
            selectedCompletions.map((c) => {
              const habit = habitMap.get(c.habitId);
              if (!habit) return null;
              return (
                <View key={c.completionId} style={[styles.completionRow, { borderLeftColor: habit.color }]}>
                  <Text style={styles.completionIcon}>{habit.icon}</Text>
                  <Text style={styles.completionName}>{habit.name}</Text>
                  <Text style={styles.completionCheck}>✅</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 16 },
  title:           { fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 12 },
  details:         { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  detailsHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailsTitle:    { fontSize: 15, fontWeight: '700', color: '#11181C', textTransform: 'capitalize' },
  detailsPercent:  { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
  noCompletions:   { color: '#687076', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  completionRow:   { flexDirection: 'row', alignItems: 'center', padding: 10, borderLeftWidth: 3, borderRadius: 8, backgroundColor: '#F9FAFB', marginBottom: 8, gap: 10 },
  completionIcon:  { fontSize: 20 },
  completionName:  { flex: 1, fontSize: 15, fontWeight: '600', color: '#11181C' },
  completionCheck: { fontSize: 16 },
});