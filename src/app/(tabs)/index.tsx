import { HalftoneBackground, WebCornerOverlay } from '@/components/spider-fx';
import { AppTheme, AppThemes } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  computeAverageMastery,
  computeDayStreak,
  fetchUserStudyData,
  getMissionRoute,
  MissionData,
  pickTodaysMission,
  QuizAttempt,
} from '@/lib/progress';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, themeId, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const [loadingMission, setLoadingMission] = useState(true);
  const [todaysMission, setTodaysMission] = useState<MissionData | null>(null);
  const [dayStreak, setDayStreak] = useState(0);
  const [avgMastery, setAvgMastery] = useState<number | null>(null);
  const [missionsCompleted, setMissionsCompleted] = useState(0);

  const loadHomeData = useCallback(async () => {
    try {
      setLoadingMission(true);
      const data = await fetchUserStudyData();

      if (!data) {
        setTodaysMission(null);
        setDayStreak(0);
        setAvgMastery(null);
        setMissionsCompleted(0);
        return;
      }

      setTodaysMission(pickTodaysMission(data.missions));
      setDayStreak(computeDayStreak(data.attempts));
      setAvgMastery(computeAverageMastery(data.missions));
      setMissionsCompleted(
        new Set(data.attempts.map((a: QuizAttempt) => a.material_id)).size
      );
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoadingMission(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const handleContinueMission = () => {
    if (!todaysMission) {
      router.push('/library');
      return;
    }
    const route = getMissionRoute(todaysMission);
    router.push(route as any);
  };

  const handleSelectTheme = (id: string) => {
    setTheme(id as any);
    setModalVisible(false);
  };

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('LOGOUT ERROR:', error);
      return;
    }

    console.log('LOGOUT SUCCESS');

    router.replace('/auth');
  } catch (error) {
    console.error('LOGOUT EXCEPTION:', error);
  }
};

  const themeTagline =
    'tagline' in theme && typeof theme.tagline === 'string'
      ? theme.tagline
      : 'Train like a hero. Master your concepts.';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening 👋</Text>
            <Text style={styles.subtitle}>
              Ready for today's mission?
            </Text>
          </View>

          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        {/* Current Theme Card */}
        <View
          style={[
            styles.themeCard,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <HalftoneBackground opacity={0.08} />
          <WebCornerOverlay color={theme.colors.primary} opacity={0.3} />

          <View style={styles.cardContent}>
            <Text style={styles.themeLabel}>CURRENT THEME</Text>
            <Text style={styles.themeTitle}>
              {theme.emoji} {theme.name}
            </Text>
            <Text style={styles.themeDescription}>
              {themeTagline}
            </Text>
          </View>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={[
              styles.themeButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.themeButtonText}>Themes</Text>
          </Pressable>
        </View>

        {/* Section Header: Today's Mission */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🕸️ TODAY'S MISSION</Text>
          <Pressable onPress={() => router.push('/missions')}>
            <Text style={styles.sectionAction}>View all</Text>
          </Pressable>
        </View>

        {/* Mission Card */}
        {loadingMission ? (
          <View
            style={[
              styles.missionCard,
              styles.missionLoading,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : !todaysMission ? (
          <View
            style={[
              styles.missionCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <HalftoneBackground opacity={0.08} />
            <Text style={styles.missionSubject}>No missions yet</Text>
            <Text style={styles.missionTopic}>
              Upload a PDF to your Library to generate your first mission.
            </Text>
            <Pressable
              style={[
                styles.continueButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => router.push('/library')}
            >
              <Text style={styles.continueButtonText}>GO TO LIBRARY</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.missionCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <WebCornerOverlay color="#00D2FF" opacity={0.2} />

            <View style={styles.missionTop}>
              <View
                style={[
                  styles.missionIcon,
                  { backgroundColor: theme.colors.cardElevated },
                ]}
              >
                <Text style={styles.missionIconText}>🎯</Text>
              </View>

              <View style={styles.missionInfo}>
                <Text style={styles.missionSubject} numberOfLines={1}>
                  {todaysMission.title}
                </Text>
                <Text style={styles.missionTopic} numberOfLines={1}>
                  {todaysMission.topic}
                </Text>
              </View>

              {/* Dynamic Pill Badge */}
              <View style={styles.comicBadge}>
                <Text style={styles.comicBadgeText}>
                  {todaysMission.completed
                    ? `${todaysMission.bestScore}% MASTERY`
                    : 'NOT STARTED'}
                </Text>
              </View>
            </View>

            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Mastery Level</Text>
              <Text style={styles.progressPercentage}>
                {todaysMission.bestScore ?? 0}%
              </Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${todaysMission.bestScore ?? 0}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>

            {/* Action Button with Cut Corners */}
            <Pressable
              style={[
                styles.continueButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleContinueMission}
            >
              <Text style={styles.continueButtonText}>
                {todaysMission.completed ? 'RETAKE QUIZ' : 'CONTINUE MISSION'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Quick Stats Header */}
        <Text style={styles.sectionTitle}>🕷️ YOUR PROGRESS</Text>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{dayStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={styles.statIcon}>🧠</Text>
            <Text style={styles.statValue}>
              {avgMastery !== null ? `${avgMastery}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>Avg. Mastery</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{missionsCompleted}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
        </View>

        {/* Quick Actions Header */}
        <Text style={styles.sectionTitle}>🕸️ EXPLORE</Text>

        {/* Asymmetric / Diagonal Cut Action Grid */}
        <View style={styles.exploreGrid}>
          <Pressable
            style={[
              styles.exploreCard,
              styles.asymmetricCardLeft,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/library')}
          >
            <HalftoneBackground opacity={0.1} />
            <Text style={styles.exploreIcon}>📚</Text>
            <Text style={styles.exploreTitle}>LIBRARY</Text>
            <Text style={styles.exploreDescription}>
              Your study materials
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.exploreCard,
              styles.asymmetricCardRight,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/missions')}
          >
            <HalftoneBackground opacity={0.1} />
            <Text style={styles.exploreIcon}>🎯</Text>
            <Text style={styles.exploreTitle}>MISSIONS</Text>
            <Text style={styles.exploreDescription}>
              Practice and learn
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.exploreCard,
              styles.asymmetricCardRight,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/progress')}
          >
            <HalftoneBackground opacity={0.1} />
            <Text style={styles.exploreIcon}>📊</Text>
            <Text style={styles.exploreTitle}>PROGRESS</Text>
            <Text style={styles.exploreDescription}>
              Track your mastery
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.exploreCard,
              styles.asymmetricCardLeft,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <HalftoneBackground opacity={0.1} />
            <Text style={styles.exploreIcon}>🎨</Text>
            <Text style={styles.exploreTitle}>THEMES</Text>
            <Text style={styles.exploreDescription}>
              Customize your world
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardElevated },
            ]}
          >
            <Text style={styles.modalTitle}>Choose a Theme</Text>
            {Object.keys(AppThemes).map((key) => {
              const item = (AppThemes as Record<string, AppTheme>)[key];
              const isSelected = themeId === key;

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.themeOption,
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => handleSelectTheme(key)}
                >
                  <Text style={styles.themeOptionText}>
                    {item.emoji} {item.name}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: theme.colors.primary }}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#92929D',
    fontSize: 14,
    marginTop: 5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#24242D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#383842',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  webOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    pointerEvents: 'none',
  },
  cardContent: {
    zIndex: 1,
  },
  themeCard: {
    backgroundColor: '#15151D',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#292933',
    overflow: 'hidden',
    position: 'relative',
  },
  themeLabel: {
    color: '#777783',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  themeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 7,
  },
  themeDescription: {
    color: '#9999A5',
    fontSize: 13,
    marginTop: 6,
    maxWidth: 280,
  },
  themeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#24242E',
    zIndex: 1,
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#292933',
    backgroundColor: '#15151D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionAction: {
    color: '#9A9AA6',
    fontSize: 13,
    fontWeight: '600',
  },
  missionCard: {
    backgroundColor: '#15151D',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#292933',
    overflow: 'hidden',
    position: 'relative',
  },
  missionLoading: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#24242E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconText: {
    fontSize: 23,
  },
  missionInfo: {
    marginLeft: 13,
    flex: 1,
  },
  missionSubject: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  missionTopic: {
    color: '#92929D',
    fontSize: 13,
    marginTop: 4,
  },
  comicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E63946',
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
  },
  comicBadgeText: {
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 8,
  },
  progressLabel: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressPercentage: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#292932',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  continueButtonText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#15151D',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#292933',
  },
  statIcon: {
    fontSize: 19,
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  statLabel: {
    color: '#858590',
    fontSize: 11,
    marginTop: 3,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exploreCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#15151D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#292933',
    minHeight: 125,
    overflow: 'hidden',
    position: 'relative',
  },
  asymmetricCardLeft: {
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  asymmetricCardRight: {
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
  exploreIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  exploreTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  exploreDescription: {
    color: '#858590',
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  themeOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#15151D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});