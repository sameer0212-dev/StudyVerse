import { HalftoneBackground, WebCornerOverlay } from '@/components/spider-fx';
import { useTheme } from '@/context/ThemeContext';
import {
    fetchUserStudyData,
    getMissionRoute,
    MissionData,
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

export default function MissionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [signedIn, setSignedIn] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserStudyData();

      if (!data) {
        setSignedIn(false);
        setMissions([]);
        return;
      }

      setSignedIn(true);

      // Not-started missions first (most recently added), then completed
      // missions ordered by weakest mastery first (most room to improve).
      const notStarted = data.missions.filter((m) => !m.completed);
      const completed = [...data.missions]
        .filter((m) => m.completed)
        .sort((a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0));

      setMissions([...notStarted, ...completed]);
    } catch (error) {
      console.error('Failed to load missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openMission = (mission: MissionData) => {
    const route = getMissionRoute(mission);
    router.push(route as any);
  };

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
          🎯 MISSIONS
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Study materials and quizzes generated from your uploads.
        </Text>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Loading your missions...
            </Text>
          </View>
        ) : !signedIn ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Sign in to see your missions.
            </Text>
          </View>
        ) : missions.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <HalftoneBackground opacity={0.08} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No missions yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Upload a PDF in your Library to generate your first study
              material and quiz.
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push('/library')}
            >
              <Text style={styles.emptyButtonText}>GO TO LIBRARY</Text>
            </Pressable>
          </View>
        ) : (
          missions.map((mission) => {
            const progress = mission.bestScore ?? 0;

            return (
              <Pressable
                key={mission.id}
                style={[
                  styles.missionCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
                onPress={() => openMission(mission)}
              >
                <WebCornerOverlay color={theme.colors.primary} opacity={0.2} />

                <View style={styles.missionTop}>
                  <View
                    style={[
                      styles.missionIcon,
                      { backgroundColor: theme.colors.cardElevated },
                    ]}
                  >
                    <Text style={styles.missionIconText}>
                      {mission.completed ? '✅' : '🎯'}
                    </Text>
                  </View>

                  <View style={styles.missionInfo}>
                    <Text
                      style={[styles.missionSubject, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {mission.title}
                    </Text>
                    <Text
                      style={[styles.missionTopic, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {mission.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      mission.completed
                        ? { borderColor: theme.colors.success, backgroundColor: 'rgba(57, 217, 138, 0.12)' }
                        : { borderColor: theme.colors.primary, backgroundColor: 'rgba(230, 57, 70, 0.12)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: mission.completed ? theme.colors.success : theme.colors.text },
                      ]}
                    >
                      {mission.completed ? 'COMPLETED' : 'NOT STARTED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.colors.textMuted }]}>
                    {mission.completed ? 'Best score' : 'Not attempted yet'}
                  </Text>
                  <Text style={[styles.progressPercentage, { color: theme.colors.text }]}>
                    {mission.completed ? `${progress}%` : '—'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBackground,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.actionButtonText}>
                    {mission.completed ? 'RETAKE QUIZ' : 'START MISSION'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
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
  loadingText: { fontSize: 12, marginTop: 10 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  missionCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  missionTop: { flexDirection: 'row', alignItems: 'center' },
  missionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconText: { fontSize: 20 },
  missionInfo: { marginLeft: 12, flex: 1, marginRight: 8 },
  missionSubject: { fontSize: 15, fontWeight: '800' },
  missionTopic: { fontSize: 12, marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 7,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  progressPercentage: { fontSize: 12, fontWeight: '800' },
  progressBackground: { height: 7, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  actionButton: {
    borderRadius: 10,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
});
