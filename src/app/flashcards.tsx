import { HalftoneBackground } from '@/components/spider-fx';
import { useTheme } from '@/context/ThemeContext';
import {
    Flashcard,
    FlashcardError,
    fetchFlashcards,
    generateFlashcards,
} from '@/lib/flashcards';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Difficulty = 'again' | 'hard' | 'good' | 'easy';

const GENERATION_STEPS = [
  'Analyzing study material',
  'Generating questions',
  'Building your deck',
];

export default function FlashcardsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const params = useLocalSearchParams<{
    materialId?: string;
    materialTitle?: string;
    summary?: string;
    keyConcepts?: string;
  }>();

  const materialId = params.materialId;
  const materialTitle = params.materialTitle || 'Study Material';
  const summary = params.summary ?? '';
  const keyConcepts: string[] = useMemo(() => {
    if (!params.keyConcepts) return [];
    try {
      return JSON.parse(params.keyConcepts);
    } catch {
      return [];
    }
  }, [params.keyConcepts]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, Difficulty>>({});
  const [complete, setComplete] = useState(false);

  // Load any previously-generated deck for this material.
  useEffect(() => {
    const load = async () => {
      if (!materialId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const existing = await fetchFlashcards(materialId);
        setCards(existing ?? []);
      } catch (err) {
        console.error('Failed to load flashcards:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [materialId]);

  // Rotates the generation-loading copy while a deck is being generated.
  useEffect(() => {
    if (!generating) return;
    setGenerationStep(0);
    const interval = setInterval(() => {
      setGenerationStep((s) => (s + 1) % GENERATION_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = async () => {
    if (!materialId) {
      setError("This material is missing an id, so flashcards can't be saved.");
      return;
    }

    if (!summary.trim() && keyConcepts.length === 0) {
      setError("There's no study content available to generate flashcards from.");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const deck = await generateFlashcards(materialId, summary, keyConcepts);
      setCards(deck);
      setCurrentIndex(0);
      setRevealed(false);
      setResults({});
      setComplete(false);
    } catch (err) {
      setError(
        err instanceof FlashcardError
          ? err.message
          : "Couldn't generate flashcards right now. Try again in a moment."
      );
    } finally {
      setGenerating(false);
    }
  };

  const currentCard = cards[currentIndex];

  const goToNext = (difficulty: Difficulty) => {
    if (!currentCard) return;

    setResults((prev) => ({ ...prev, [currentCard.id]: difficulty }));

    if (currentIndex >= cards.length - 1) {
      setComplete(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setRevealed(false);
  };

  const goToPrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
    setRevealed(false);
  };

  const restartDeck = () => {
    setCurrentIndex(0);
    setRevealed(false);
    setResults({});
    setComplete(false);
  };

  const tally = useMemo(() => {
    const counts: Record<Difficulty, number> = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    };
    Object.values(results).forEach((d) => {
      counts[d] += 1;
    });
    return counts;
  }, [results]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.backText, { color: theme.colors.text }]}>
            ‹ Back
          </Text>
        </Pressable>

        {cards.length > 0 && !complete && (
          <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
            {currentIndex + 1} / {cards.length}
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : generating ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.generatingTitle, { color: theme.colors.text }]}>
              Creating your flashcards...
            </Text>
            {GENERATION_STEPS.map((step, index) => (
              <Text
                key={step}
                style={[
                  styles.generatingStep,
                  {
                    color:
                      index === generationStep
                        ? theme.colors.text
                        : theme.colors.textMuted,
                  },
                ]}
              >
                {index <= generationStep ? '✓ ' : '· '}
                {step}
              </Text>
            ))}
          </View>
        ) : error ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              {error}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleGenerate}
            >
              <Text style={styles.primaryButtonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : complete ? (
          <View style={styles.centerBlock}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={[styles.completeTitle, { color: theme.colors.text }]}>
              Deck Complete!
            </Text>
            <Text
              style={[styles.completeSubtitle, { color: theme.colors.textSecondary }]}
            >
              You studied {cards.length} flashcard{cards.length === 1 ? '' : 's'}.
            </Text>

            <View
              style={[
                styles.tallyCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <TallyRow label="Easy" value={tally.easy} color={theme.colors.success} />
              <TallyRow label="Good" value={tally.good} color={theme.colors.text} />
              <TallyRow label="Hard" value={tally.hard} color={theme.colors.warning} />
              <TallyRow label="Again" value={tally.again} color={theme.colors.danger} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={restartDeck}
            >
              <Text style={styles.primaryButtonText}>STUDY AGAIN</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.back()}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                BACK TO MATERIAL
              </Text>
            </Pressable>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centerBlock}>
            <HalftoneBackground opacity={0.06} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No flashcards yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
            >
              Generate a revision deck from "{materialTitle}".
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleGenerate}
            >
              <Text style={styles.primaryButtonText}>GENERATE FLASHCARDS</Text>
            </Pressable>
          </View>
        ) : (
          currentCard && (
            <View style={styles.studyArea}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <HalftoneBackground opacity={0.05} />
                <Text
                  style={[styles.cardLabel, { color: theme.colors.textMuted }]}
                >
                  QUESTION
                </Text>
                <Text style={[styles.questionText, { color: theme.colors.text }]}>
                  {currentCard.question}
                </Text>

                {revealed && (
                  <>
                    <View
                      style={[styles.divider, { backgroundColor: theme.colors.border }]}
                    />
                    <Text
                      style={[styles.cardLabel, { color: theme.colors.textMuted }]}
                    >
                      ANSWER
                    </Text>
                    <Text
                      style={[styles.answerText, { color: theme.colors.textSecondary }]}
                    >
                      {currentCard.answer}
                    </Text>
                  </>
                )}
              </View>

              {!revealed ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => setRevealed(true)}
                >
                  <Text style={styles.primaryButtonText}>REVEAL</Text>
                </Pressable>
              ) : (
                <View style={styles.difficultyRow}>
                  <DifficultyButton
                    label="Again"
                    color={theme.colors.danger}
                    onPress={() => goToNext('again')}
                  />
                  <DifficultyButton
                    label="Hard"
                    color={theme.colors.warning}
                    onPress={() => goToNext('hard')}
                  />
                  <DifficultyButton
                    label="Good"
                    color={theme.colors.text}
                    onPress={() => goToNext('good')}
                  />
                  <DifficultyButton
                    label="Easy"
                    color={theme.colors.success}
                    onPress={() => goToNext('easy')}
                  />
                </View>
              )}

              {currentIndex > 0 && (
                <Pressable onPress={goToPrevious} style={styles.previousButton}>
                  <Text
                    style={[styles.previousText, { color: theme.colors.textMuted }]}
                  >
                    ‹ Previous card
                  </Text>
                </Pressable>
              )}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TallyRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.tallyRow}>
      <Text style={[styles.tallyLabel, { color }]}>{label}</Text>
      <Text style={[styles.tallyValue, { color }]}>{value}</Text>
    </View>
  );
}

function DifficultyButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.difficultyButton,
        { borderColor: color, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.difficultyButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backText: { fontSize: 15, fontWeight: '700' },
  counter: { fontSize: 13, fontWeight: '700' },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 10,
  },
  generatingTitle: { fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 14 },
  generatingStep: { fontSize: 13, marginTop: 6 },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    maxWidth: 300,
  },
  studyArea: { flex: 1, paddingTop: 10 },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    minHeight: 220,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  questionText: { fontSize: 19, fontWeight: '700', lineHeight: 26 },
  divider: { height: 1, marginVertical: 18 },
  answerText: { fontSize: 15, lineHeight: 22 },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  difficultyButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  difficultyButtonText: { fontSize: 12.5, fontWeight: '800' },
  previousButton: { alignSelf: 'center', marginTop: 20 },
  previousText: { fontSize: 13, fontWeight: '700' },
  completeEmoji: { fontSize: 40, marginBottom: 10 },
  completeTitle: { fontSize: 22, fontWeight: '800' },
  completeSubtitle: { fontSize: 14, marginTop: 6, marginBottom: 20 },
  tallyCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
    gap: 10,
    marginBottom: 24,
  },
  tallyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tallyLabel: { fontSize: 14, fontWeight: '700' },
  tallyValue: { fontSize: 14, fontWeight: '800' },
});
