import { HalftoneBackground, WebCornerOverlay } from '@/components/spider-fx';
import { useTheme } from '@/context/ThemeContext';
import {
    computeAverageMastery,
    computeDayStreak,
    fetchUserStudyData,
    MissionData,
    QuizAttempt,
    StudyMaterial,
} from '@/lib/progress';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [materialTitleById, setMaterialTitleById] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserStudyData();

      if (!data) {
        setSignedIn(false);
        return;
      }

      setSignedIn(true);
      setMaterials(data.materials);
      setAttempts(data.attempts);
      setMissions(data.missions);
      setMaterialTitleById(
        Object.fromEntries(data.materials.map((m) => [m.id, m.title]))
      );
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalMaterials = materials.length;
  const totalConcepts = materials.reduce(
    (sum, m) => sum + (m.key_concepts?.length ?? 0),
    0
  );
  const completedMaterialIds = new Set(attempts.map((a) => a.material_id));
  const missionsCompleted = completedMaterialIds.size;
  const avgMastery = computeAverageMastery(missions);
  const dayStreak = computeDayStreak(attempts);
  const recentActivity = attempts.slice(0, 5);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Text style={[styles.backText, { color: theme.colors.text }]}>
            ‹ Back
          </Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          📊 PROGRESS
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Your real study activity, tracked from your materials and quizzes.
        </Text>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : !signedIn ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Sign in to see your progress.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                theme={theme}
                icon="📚"
                value={String(totalMaterials)}
                label="Study Materials"
              />
              <StatCard
                theme={theme}
                icon="🔥"
                value={String(dayStreak)}
                label="Day Streak"
              />
              <StatCard
                theme={theme}
                icon="🎯"
                value={String(missionsCompleted)}
                label="Missions Completed"
              />
              <StatCard
                theme={theme}
                icon="🧠"
                value={avgMastery !== null ? `${avgMastery}%` : '—'}
                label="Avg. Mastery"
              />
              <StatCard
                theme={theme}
                icon="📝"
                value={String(attempts.length)}
                label="Quizzes Taken"
              />
              <StatCard
                theme={theme}
                icon="💡"
                value={String(totalConcepts)}
                label="Concepts Studied"
              />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🕸️ RECENT ACTIVITY
            </Text>

            {recentActivity.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <HalftoneBackground opacity={0.08} />
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  {totalMaterials === 0
                    ? 'Upload study material and complete a quiz to see your activity here.'
                    : 'Complete a quiz to see your activity here.'}
                </Text>
              </View>
            ) : (
              recentActivity.map((attempt) => (
                <View
                  key={attempt.id}
                  style={[
                    styles.activityRow,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: theme.colors.cardElevated },
                    ]}
                  >
                    <Text style={styles.activityIconText}>📝</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text
                      style={[styles.activityTitle, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {materialTitleById[attempt.material_id] ?? 'Study material'}
                    </Text>
                    <Text
                      style={[styles.activityMeta, { color: theme.colors.textMuted }]}
                    >
                      {new Date(attempt.completed_at).toLocaleDateString()} ·{' '}
                      {attempt.score}/{attempt.total_questions} correct
                    </Text>
                  </View>
                  <Text style={[styles.activityScore, { color: theme.colors.primary }]}>
                    {attempt.percentage}%
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  theme,
  icon,
  value,
  label,
}: {
  theme: any;
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <WebCornerOverlay color={theme.colors.primary} opacity={0.15} />
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: { marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, marginTop: 6, marginBottom: 24 },
  centerBlock: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  statIcon: { fontSize: 18, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 3 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: { fontSize: 17 },
  activityInfo: { flex: 1, marginLeft: 12 },
  activityTitle: { fontSize: 13, fontWeight: '700' },
  activityMeta: { fontSize: 11, marginTop: 3 },
  activityScore: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
});
