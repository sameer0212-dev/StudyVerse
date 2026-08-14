import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        {/* Current Theme */}
        <View style={styles.themeCard}>
          <View>
            <Text style={styles.themeLabel}>CURRENT THEME</Text>
            <Text style={styles.themeTitle}>🕷️ Web Hero</Text>
            <Text style={styles.themeDescription}>
              Train like a hero. Master your concepts.
            </Text>
          </View>

          <Pressable style={styles.themeButton}>
            <Text style={styles.themeButtonText}>Themes</Text>
          </Pressable>
        </View>

        {/* Today's Mission */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Mission</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>

        <View style={styles.missionCard}>
          <View style={styles.missionTop}>
            <View style={styles.missionIcon}>
              <Text style={styles.missionIconText}>🎯</Text>
            </View>

            <View style={styles.missionInfo}>
              <Text style={styles.missionSubject}>Operating Systems</Text>
              <Text style={styles.missionTopic}>
                Process Management
              </Text>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Mastery</Text>
            <Text style={styles.progressPercentage}>80%</Text>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressFill} />
          </View>

          <Pressable style={styles.continueButton}>
            <Text style={styles.continueButtonText}>
              Continue Mission
            </Text>
          </Pressable>
        </View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Your Progress</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🧠</Text>
            <Text style={styles.statValue}>72%</Text>
            <Text style={styles.statLabel}>Avg. Mastery</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Explore</Text>

        <View style={styles.exploreGrid}>
          <Pressable
            style={styles.exploreCard}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.exploreIcon}>📚</Text>
            <Text style={styles.exploreTitle}>Library</Text>
            <Text style={styles.exploreDescription}>
              Your study materials
            </Text>
          </Pressable>

          <Pressable style={styles.exploreCard}>
            <Text style={styles.exploreIcon}>🎯</Text>
            <Text style={styles.exploreTitle}>Missions</Text>
            <Text style={styles.exploreDescription}>
              Practice and learn
            </Text>
          </Pressable>

          <Pressable style={styles.exploreCard}>
            <Text style={styles.exploreIcon}>📊</Text>
            <Text style={styles.exploreTitle}>Progress</Text>
            <Text style={styles.exploreDescription}>
              Track your mastery
            </Text>
          </Pressable>

          <Pressable style={styles.exploreCard}>
            <Text style={styles.exploreIcon}>🎨</Text>
            <Text style={styles.exploreTitle}>Themes</Text>
            <Text style={styles.exploreDescription}>
              Customize your world
            </Text>
          </Pressable>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
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

  themeCard: {
    backgroundColor: '#15151D',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#292933',
  },

  themeLabel: {
    color: '#777783',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
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
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#24242E',
  },

  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  sectionAction: {
    color: '#9A9AA6',
    fontSize: 13,
  },

  missionCard: {
    backgroundColor: '#15151D',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#292933',
  },

  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    fontWeight: '700',
  },

  missionTopic: {
    color: '#92929D',
    fontSize: 13,
    marginTop: 4,
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
  },

  progressPercentage: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  progressBackground: {
    height: 7,
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
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },

  continueButtonText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#15151D',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
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
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292933',
    minHeight: 125,
  },

  exploreIcon: {
    fontSize: 24,
    marginBottom: 12,
  },

  exploreTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  exploreDescription: {
    color: '#858590',
    fontSize: 11,
    marginTop: 4,
  },
});