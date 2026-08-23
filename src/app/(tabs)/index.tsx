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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getTimeBasedGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Still up', emoji: '🌙' };
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 18) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

/** Colors a mastery/status badge by performance tier, using only existing
 * theme tokens (no new hardcoded colors). */
function getMasteryTierColor(theme: AppTheme, score: number | null) {
  if (score === null) return theme.colors.textMuted;
  if (score >= 80) return theme.colors.success;
  if (score >= 50) return theme.colors.warning;
  return theme.colors.danger;
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, themeId, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const [loadingMission, setLoadingMission] = useState(true);
  const [todaysMission, setTodaysMission] = useState<MissionData | null>(null);
  const [dayStreak, setDayStreak] = useState(0);
  const [avgMastery, setAvgMastery] = useState<number | null>(null);
  const [missionsCompleted, setMissionsCompleted] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loadingMission ? 0 : (todaysMission?.bestScore ?? 0),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [loadingMission, todaysMission, progressAnim]);

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

  const themeTagline = theme.tagline ?? 'Train like a hero. Master your concepts.';

  const greeting = getTimeBasedGreeting();

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
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: theme.colors.text }]}>
                {greeting.text} {greeting.emoji}
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                Ready for today's mission?
              </Text>
            </View>

            <View
              style={[
                styles.avatarRing,
                { borderColor: theme.colors.primarySoft },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Text style={styles.avatarText}>S</Text>
              </View>
            </View>
          </View>

          {/* Current Theme Card */}
          <View
            style={[
              styles.themeCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <HalftoneBackground opacity={0.07} />
            <WebCornerOverlay
              color={theme.colors.primary}
              opacity={0.18}
              size={150}
              corner="bottom-right"
            />

            <View style={styles.cardContent}>
              <Text style={[styles.themeLabel, { color: theme.colors.textMuted }]}>
                CURRENT THEME
              </Text>
              <View style={styles.themeTitleRow}>
                <View
                  style={[
                    styles.themeEmojiChip,
                    { backgroundColor: theme.colors.cardElevated },
                  ]}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                </View>
                <Text style={[styles.themeTitle, { color: theme.colors.text }]}>
                  {theme.name}
                </Text>
              </View>
              <Text
                style={[
                  styles.themeDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {themeTagline}
              </Text>
            </View>

            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.themeButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.cardElevated,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.themeButtonText, { color: theme.colors.text }]}>
                Themes
              </Text>
            </Pressable>
          </View>

        {/* Section Header: Today's Mission */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🕸️ TODAY'S MISSION
          </Text>
          <Pressable onPress={() => router.push('/missions')} hitSlop={8}>
            <Text
              style={[styles.sectionAction, { color: theme.colors.textSecondary }]}
            >
              View all ›
            </Text>
          </Pressable>
        </View>

        {/* Mission Card */}
        {loadingMission ? (
          <View
            style={[
              styles.missionCard,
              styles.missionLoading,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : !todaysMission ? (
          <View
            style={[
              styles.missionCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[styles.missionAccentStrip, { backgroundColor: theme.colors.primary }]}
            />
            <HalftoneBackground opacity={0.07} />
            <Text style={[styles.missionSubject, { color: theme.colors.text }]}>
              No missions yet
            </Text>
            <Text
              style={[styles.missionTopic, { color: theme.colors.textSecondary }]}
            >
              Upload a PDF to your Library to generate your first mission.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
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
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[styles.missionAccentStrip, { backgroundColor: theme.colors.primary }]}
            />
            <WebCornerOverlay
              color={theme.colors.primary}
              opacity={0.14}
              size={150}
              corner="bottom-right"
            />

            <View style={styles.missionTop}>
              <View
                style={[
                  styles.missionIcon,
                  {
                    backgroundColor: theme.colors.cardElevated,
                    borderColor: theme.colors.primarySoft,
                  },
                ]}
              >
                <Text style={styles.missionIconText}>🎯</Text>
              </View>

              <View style={styles.missionInfo}>
                <Text
                  style={[styles.missionSubject, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {todaysMission.title}
                </Text>
                <Text
                  style={[styles.missionTopic, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {todaysMission.topic}
                </Text>
              </View>

              {/* Dynamic Pill Badge, color-tiered by actual mastery */}
              <View
                style={[
                  styles.comicBadge,
                  {
                    borderColor: getMasteryTierColor(theme, todaysMission.bestScore),
                    backgroundColor: theme.colors.cardElevated,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.comicBadgeText,
                    { color: getMasteryTierColor(theme, todaysMission.bestScore) },
                  ]}
                >
                  {todaysMission.completed
                    ? `${todaysMission.bestScore}% MASTERY`
                    : 'NOT STARTED'}
                </Text>
              </View>
            </View>

            <View style={styles.progressHeader}>
              <Text
                style={[styles.progressLabel, { color: theme.colors.textMuted }]}
              >
                Mastery Level
              </Text>
              <Text style={[styles.progressPercentage, { color: theme.colors.text }]}>
                {todaysMission.bestScore ?? 0}%
              </Text>
            </View>

            <View
              style={[styles.progressBackground, { backgroundColor: theme.colors.border }]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Action Button with Cut Corners */}
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleContinueMission}
            >
              <Text style={styles.continueButtonText}>
                {todaysMission.completed ? 'RETAKE QUIZ →' : 'CONTINUE MISSION →'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Quick Stats Header */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🕷️ YOUR PROGRESS
        </Text>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.statColumn}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dayStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
              Day Streak
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.statColumn}>
            <Text style={styles.statIcon}>🧠</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {avgMastery !== null ? `${avgMastery}%` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
              Avg. Mastery
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.statColumn}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {missionsCompleted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
              Missions
            </Text>
          </View>
        </View>

        {/* Quick Actions Header */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🕸️ EXPLORE
        </Text>

        {/* Asymmetric / Diagonal Cut Action Grid */}
        <View style={styles.exploreGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.asymmetricCardLeft,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.push('/library')}
          >
            <HalftoneBackground opacity={0.08} />
            <View
              style={[styles.exploreIconChip, { backgroundColor: theme.colors.cardElevated }]}
            >
              <Text style={styles.exploreIcon}>📚</Text>
            </View>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>
              LIBRARY
            </Text>
            <Text
              style={[styles.exploreDescription, { color: theme.colors.textMuted }]}
            >
              Your study materials
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.asymmetricCardRight,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.push('/missions')}
          >
            <HalftoneBackground opacity={0.08} />
            <View
              style={[styles.exploreIconChip, { backgroundColor: theme.colors.cardElevated }]}
            >
              <Text style={styles.exploreIcon}>🎯</Text>
            </View>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>
              MISSIONS
            </Text>
            <Text
              style={[styles.exploreDescription, { color: theme.colors.textMuted }]}
            >
              Practice and learn
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.asymmetricCardRight,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.push('/progress')}
          >
            <HalftoneBackground opacity={0.08} />
            <View
              style={[styles.exploreIconChip, { backgroundColor: theme.colors.cardElevated }]}
            >
              <Text style={styles.exploreIcon}>📊</Text>
            </View>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>
              PROGRESS
            </Text>
            <Text
              style={[styles.exploreDescription, { color: theme.colors.textMuted }]}
            >
              Track your mastery
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.asymmetricCardLeft,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <HalftoneBackground opacity={0.08} />
            <View
              style={[styles.exploreIconChip, { backgroundColor: theme.colors.cardElevated }]}
            >
              <Text style={styles.exploreIcon}>🎨</Text>
            </View>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>
              THEMES
            </Text>
            <Text
              style={[styles.exploreDescription, { color: theme.colors.textMuted }]}
            >
              Customize your world
            </Text>
          </Pressable>

          {/* TALK keeps a warmer, more personal identity via primarySoft */}
          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.asymmetricCardRight,
              styles.talkCard,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primaryDark,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.push('/motivation')}
          >
            <HalftoneBackground opacity={0.06} />
            <View
              style={[styles.exploreIconChip, { backgroundColor: theme.colors.cardElevated }]}
            >
              <Text style={styles.exploreIcon}>🕊️</Text>
            </View>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>
              TALK
            </Text>
            <Text
              style={[styles.exploreDescription, { color: theme.colors.textSecondary }]}
            >
              Need to vent? I'm here
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: theme.colors.danger }]}>
            LOG OUT
          </Text>
        </Pressable>

        <View style={{ height: 30 }} />
        </Animated.View>
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
              { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Choose a Theme
            </Text>
            {Object.keys(AppThemes).map((key) => {
              const item = (AppThemes as Record<string, AppTheme>)[key];
              const isSelected = themeId === key;

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                      backgroundColor: theme.colors.primarySoft,
                    },
                  ]}
                  onPress={() => handleSelectTheme(key)}
                >
                  <Text style={[styles.themeOptionText, { color: theme.colors.text }]}>
                    {item.emoji} {item.name}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>✓</Text>
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
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    zIndex: 1,
  },
  themeCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  themeEmojiChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeEmoji: {
    fontSize: 17,
  },
  themeTitle: {
    fontSize: 21,
    fontWeight: '800',
  },
  themeDescription: {
    fontSize: 13,
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 18,
  },
  themeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    zIndex: 1,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  missionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  missionAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  missionLoading: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  missionIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconText: {
    fontSize: 23,
  },
  missionInfo: {
    marginLeft: 13,
    flex: 1,
    marginRight: 8,
  },
  missionSubject: {
    fontSize: 18,
    fontWeight: '800',
  },
  missionTopic: {
    fontSize: 13,
    marginTop: 4,
  },
  comicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  comicBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBackground: {
    height: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  continueButton: {
    borderRadius: 12,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    marginBottom: 28,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  statIcon: {
    fontSize: 17,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10.5,
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    minHeight: 128,
    overflow: 'hidden',
    position: 'relative',
  },
  talkCard: {
    width: '100%',
  },
  asymmetricCardLeft: {
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  asymmetricCardRight: {
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
  exploreIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  exploreIcon: {
    fontSize: 18,
  },
  exploreTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  exploreDescription: {
    fontSize: 11.5,
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
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  themeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});