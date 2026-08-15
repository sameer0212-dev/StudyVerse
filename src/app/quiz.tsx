import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export default function QuizScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ questions?: string }>();

  const questions: QuizQuestion[] = useMemo(() => {
    if (!params.questions) return [];

    try {
      return JSON.parse(params.questions);
    } catch (error) {
      console.error('Failed to parse quiz questions:', error);
      return [];
    }
  }, [params.questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>No Quiz Available</Text>

          <Text style={styles.errorText}>
            This material does not contain any quiz questions.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹ Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------
  // QUIZ RESULT SCREEN
  // -------------------------

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultLabel}>QUIZ COMPLETE</Text>

          <Text style={styles.resultTitle}>Mission Complete 🎯</Text>

          <Text style={styles.resultSubtitle}>
            Here's how you performed.
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scorePercentage}>
              {percentage}%
            </Text>

            <Text style={styles.scoreText}>
              {score} out of {questions.length} correct
            </Text>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>
                {score}
              </Text>

              <Text style={styles.resultStatLabel}>
                Correct
              </Text>
            </View>

            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>
                {questions.length - score}
              </Text>

              <Text style={styles.resultStatLabel}>
                Incorrect
              </Text>
            </View>

            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>
                {questions.length}
              </Text>

              <Text style={styles.resultStatLabel}>
                Questions
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.resultButton}
            onPress={() => router.back()}
          >
            <Text style={styles.resultButtonText}>
              Back to Material
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);

    if (answer === question.correct_answer) {
      setScore((previous) => previous + 1);
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    if (isLastQuestion) {
      const finalScore =
        score +
        (selectedAnswer === question.correct_answer ? 1 : 0);

      setScore(finalScore);
      setFinished(true);

      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.label}>QUIZ</Text>

          <Text style={styles.progress}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.question}>
            {question.question}
          </Text>
        </View>

        <View style={styles.options}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === question.correct_answer;

            let optionStyle = styles.option;
            let textStyle = styles.optionText;

            if (selectedAnswer !== null && isCorrect) {
              optionStyle = styles.correctOption;
              textStyle = styles.correctOptionText;
            } else if (isSelected) {
              optionStyle = styles.wrongOption;
              textStyle = styles.wrongOptionText;
            }

            return (
              <Pressable
                key={`${option}-${index}`}
                style={optionStyle}
                onPress={() => handleAnswer(option)}
              >
                <Text style={textStyle}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedAnswer !== null && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === question.correct_answer
                ? '✓ Correct!'
                : '✕ Not quite'}
            </Text>

            <Text style={styles.explanation}>
              {question.explanation}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.nextButton,
            !selectedAnswer && styles.disabledButton,
          ]}
          disabled={!selectedAnswer}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </Text>
        </Pressable>
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
    padding: 20,
    paddingBottom: 40,
  },

  resultContainer: {
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    color: '#FF3344',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  progress: {
    color: '#858590',
    fontSize: 13,
    fontWeight: '700',
  },

  progressBackground: {
    height: 6,
    backgroundColor: '#292933',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 28,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FF3344',
    borderRadius: 10,
  },

  questionCard: {
    backgroundColor: '#15151D',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#292933',
    marginBottom: 18,
  },

  question: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '800',
  },

  options: {
    gap: 10,
  },

  option: {
    backgroundColor: '#15151D',
    borderWidth: 1,
    borderColor: '#292933',
    borderRadius: 14,
    padding: 16,
  },

  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },

  correctOption: {
    backgroundColor: '#15351F',
    borderWidth: 1,
    borderColor: '#2ECC71',
    borderRadius: 14,
    padding: 16,
  },

  correctOptionText: {
    color: '#7FF0A8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  wrongOption: {
    backgroundColor: '#35151A',
    borderWidth: 1,
    borderColor: '#FF3344',
    borderRadius: 14,
    padding: 16,
  },

  wrongOptionText: {
    color: '#FF8A94',
    fontSize: 14,
    lineHeight: 20,
  },

  explanationCard: {
    backgroundColor: '#15151D',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#292933',
  },

  explanationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 7,
  },

  explanation: {
    color: '#A8A8B3',
    fontSize: 13,
    lineHeight: 20,
  },

  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.35,
  },

  nextButtonText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '800',
  },

  // -------------------------
  // RESULT STYLES
  // -------------------------

  resultLabel: {
    color: '#FF3344',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  resultTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  resultSubtitle: {
    color: '#858590',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  scoreCard: {
    backgroundColor: '#15151D',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#292933',
    alignItems: 'center',
    marginTop: 30,
  },

  scorePercentage: {
    color: '#FF3344',
    fontSize: 52,
    fontWeight: '900',
  },

  scoreText: {
    color: '#A8A8B3',
    fontSize: 14,
    marginTop: 6,
  },

  resultStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  resultStat: {
    flex: 1,
    backgroundColor: '#15151D',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292933',
  },

  resultStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  resultStatLabel: {
    color: '#858590',
    fontSize: 11,
    marginTop: 4,
  },

  resultButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },

  resultButtonText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '800',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  errorText: {
    color: '#858590',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});