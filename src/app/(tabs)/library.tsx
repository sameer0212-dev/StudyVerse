import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.1.12:8000';

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

type StudyMaterial = {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  summary: string;
  key_concepts: string[];
  quiz: {
    questions: QuizQuestion[];
  };
  created_at: string;
};

export default function LibraryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [studyResult, setStudyResult] = useState<any>(null);

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // =========================
  // Quiz state
  // =========================

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [showAnswer, setShowAnswer] = useState(false);

  const [score, setScore] = useState(0);

  const [quizFinished, setQuizFinished] = useState(false);

  // =========================
  // Pick PDF
  // =========================

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);

      // Get the current session first
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      // No authenticated session
      if (!session?.user) {
        setMaterials([]);
        return;
      }
      console.log('AUTH USER ID:', session.user.id);

      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMaterials(data ?? []);
    } catch (error) {
      console.error('Load materials error:', error);

      Alert.alert(
        'Could not load library',
        'We could not load your saved study materials.'
      );
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      setSelectedFile(file);
      setStudyResult(null);

      resetQuiz();

      await uploadPdf(file);
    } catch (error) {
      console.error('Document picker error:', error);

      Alert.alert(
        'Something went wrong',
        'We could not select that PDF. Please try again.'
      );
    }
  };

  // =========================
  // Upload PDF
  // =========================

  const uploadPdf = async (
    file: DocumentPicker.DocumentPickerAsset
  ) => {
    try {
      setIsProcessing(true);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Expo Web gives us a browser Blob/File
        const response = await fetch(file.uri);
        const blob = await response.blob();

        formData.append(
          'file',
          new File([blob], file.name, {
            type: file.mimeType || 'application/pdf',
          })
        );
      } else {
        // iOS / Android
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        } as any);
      }

      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);

        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setStudyResult(data);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error('You must be signed in to save study material.');
      }

      const { error: saveError } = await supabase
        .from('study_materials')
        .insert({
          user_id: session.user.id,
          title: data.filename,
          file_name: data.filename,
          summary: data.notes.summary,
          key_concepts: data.notes.key_concepts,
          quiz: data.quiz,
        });

      if (saveError) {
        console.error('Supabase save error:', saveError);
        throw saveError;
      }

      await loadMaterials();

      Alert.alert(
        'Study Material Ready!',
        `${data.notes.key_concepts.length} concepts and ${data.quiz.questions.length} quiz questions generated.`
      );
    } catch (error) {
      console.error('PDF upload error:', error);

      Alert.alert(
        'Processing Failed',
        'We could not process your PDF. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================
  // Quiz functions
  // =========================

  const handleOpenMaterial = (material: any) => {
    setSelectedFile(null);

    setStudyResult({
      filename: material.file_name,
      notes: {
        summary: material.summary,
        key_concepts: material.key_concepts,
      },
      quiz: material.quiz,
    });

    resetQuiz();
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !studyResult) {
      return;
    }

    const question: QuizQuestion =
      studyResult.quiz.questions[currentQuestionIndex];

    if (selectedAnswer === question.correct_answer) {
      setScore((previousScore) => previousScore + 1);
    }

    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (!studyResult) {
      return;
    }

    const totalQuestions = studyResult.quiz.questions.length;

    if (currentQuestionIndex === totalQuestions - 1) {
      setQuizFinished(true);
      return;
    }

    setCurrentQuestionIndex(
      (previousIndex) => previousIndex + 1
    );

    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const handleRestartQuiz = () => {
    resetQuiz();
  };

  // =========================
  // Current quiz question
  // =========================

  const currentQuestion: QuizQuestion | null =
    studyResult?.quiz?.questions?.[currentQuestionIndex] ?? null;

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
        <Text style={[styles.title, { color: theme.colors.text }]}>Your Library</Text>

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Turn your study material into interactive learning.
        </Text>

        {/* Upload button */}

        <Pressable
          style={[
            styles.uploadCard,
            { backgroundColor: theme.colors.cardElevated },
          ]}
          onPress={handlePickDocument}
          disabled={isProcessing}
        >
          <View
            style={[
              styles.uploadIcon,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.uploadIconText, { color: theme.colors.text }]}>＋</Text>
          </View>

          <View style={styles.uploadContent}>
            <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>Upload a PDF</Text>

            <Text style={[styles.uploadDescription, { color: theme.colors.textMuted }]}>
              Add your notes, slides, textbook, or study material.
            </Text>
          </View>
        </Pressable>

        {/* Selected PDF */}

        {selectedFile && (
          <View
            style={[
              styles.selectedFileCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.pdfIcon,
                { backgroundColor: theme.colors.cardElevated },
              ]}
            >
              <Text style={styles.pdfIconText}>📄</Text>
            </View>

            <View style={styles.materialInfo}>
              <Text
                style={[styles.materialTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {selectedFile.name}
              </Text>

              <Text style={[styles.materialMeta, { color: theme.colors.textMuted }]}>
                {isProcessing
                  ? 'AI is processing your study material...'
                  : 'PDF selected · Ready for study'}
              </Text>
            </View>

            {isProcessing && <ActivityIndicator color={theme.colors.primary} />}
          </View>
        )}

        {/* AI Result */}

        {studyResult && !isProcessing && (
          <>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                Study Material Generated
              </Text>

              <Text style={[styles.resultSubtitle, { color: theme.colors.textMuted }]}>
                {decodeURIComponent(studyResult.filename)}
              </Text>

              {/* Summary */}

              <Text style={[styles.resultSectionTitle, { color: theme.colors.text }]}>
                Summary
              </Text>

              <Text style={[styles.resultText, { color: theme.colors.textSecondary }]}>
                {studyResult.notes.summary}
              </Text>

              {/* Key Concepts */}

              <Text style={[styles.resultSectionTitle, { color: theme.colors.text }]}>
                Key Concepts
              </Text>

              {studyResult.notes.key_concepts.map(
                (concept: string, index: number) => (
                  <View
                    key={index}
                    style={styles.conceptRow}
                  >
                    <Text style={[styles.conceptBullet, { color: theme.colors.text }]}>
                      •
                    </Text>

                    <Text style={[styles.resultText, { color: theme.colors.textSecondary }]}>
                      {concept}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* =========================
                Interactive Quiz
            ========================= */}

            {currentQuestion && !quizFinished && (
              <View
                style={[
                  styles.quizCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.quizHeader}>
                  <Text style={[styles.quizTitle, { color: theme.colors.text }]}>
                    Quiz
                  </Text>

                  <Text style={[styles.quizCounter, { color: theme.colors.textMuted }]}>
                    Question {currentQuestionIndex + 1} of{' '}
                    {studyResult.quiz.questions.length}
                  </Text>
                </View>

                <View
                  style={[
                    styles.quizProgressBackground,
                    { backgroundColor: theme.colors.cardElevated },
                  ]}
                >
                  <View
                    style={[
                      styles.quizProgressFill,
                      {
                        backgroundColor: theme.colors.primary,
                        width: `${((currentQuestionIndex + 1) /
                          studyResult.quiz.questions.length) *
                          100
                          }%`,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.questionText, { color: theme.colors.text }]}>
                  {currentQuestion.question}
                </Text>

                {/* Options */}

                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map(
                    (option: string, index: number) => {
                      const isSelected =
                        selectedAnswer === option;

                      const isCorrect =
                        option ===
                        currentQuestion.correct_answer;

                      let optionStyle =
                        styles.optionButton;

                      if (isSelected && !showAnswer) {
                        optionStyle =
                          styles.optionSelected;
                      }

                      if (showAnswer && isCorrect) {
                        optionStyle =
                          styles.optionCorrect;
                      }

                      if (
                        showAnswer &&
                        isSelected &&
                        !isCorrect
                      ) {
                        optionStyle =
                          styles.optionWrong;
                      }

                      return (
                        <Pressable
                          key={index}
                          style={[
                            optionStyle,
                            { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border },
                            isSelected && !showAnswer && { borderColor: theme.colors.primary },
                          ]}
                          onPress={() => {
                            if (!showAnswer) {
                              setSelectedAnswer(option);
                            }
                          }}
                          disabled={showAnswer}
                        >
                          <View style={[styles.optionLetter, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.optionLetterText, { color: theme.colors.text }]}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>

                          <Text style={[styles.optionText, { color: theme.colors.text }]}>
                            {option}
                          </Text>

                          {showAnswer && isCorrect && (
                            <Text style={styles.optionResult}>
                              ✓
                            </Text>
                          )}

                          {showAnswer &&
                            isSelected &&
                            !isCorrect && (
                              <Text style={styles.optionResult}>
                                ✕
                              </Text>
                            )}
                        </Pressable>
                      );
                    }
                  )}
                </View>

                {/* Explanation */}

                {showAnswer && (
                  <View style={[styles.explanationCard, { backgroundColor: theme.colors.cardElevated }]}>
                    <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>
                      {selectedAnswer ===
                        currentQuestion.correct_answer
                        ? '✓ Correct!'
                        : '✕ Not quite'}
                    </Text>

                    <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                      {currentQuestion.explanation}
                    </Text>
                  </View>
                )}

                {/* Action button */}

                {!showAnswer ? (
                  <Pressable
                    style={[
                      styles.quizActionButton,
                      { backgroundColor: theme.colors.primary },
                      !selectedAnswer &&
                      styles.quizActionDisabled,
                    ]}
                    onPress={handleCheckAnswer}
                    disabled={!selectedAnswer}
                  >
                    <Text style={styles.quizActionText}>
                      Check Answer
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.quizActionButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={handleNextQuestion}
                  >
                    <Text style={styles.quizActionText}>
                      {currentQuestionIndex ===
                        studyResult.quiz.questions.length - 1
                        ? 'Finish Quiz'
                        : 'Next Question'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* =========================
                Quiz Finished
            ========================= */}

            {quizFinished && (
              <View
                style={[
                  styles.quizCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <Text style={styles.finishedIcon}>
                  🎯
                </Text>

                <Text style={[styles.finishedTitle, { color: theme.colors.text }]}>
                  Quiz Complete!
                </Text>

                <Text style={[styles.finishedScore, { color: theme.colors.text }]}>
                  {score} / {studyResult.quiz.questions.length}
                </Text>

                <Text style={[styles.finishedPercentage, { color: theme.colors.textMuted }]}>
                  {Math.round(
                    (score /
                      studyResult.quiz.questions.length) *
                    100
                  )}
                  %
                </Text>

                <Text style={[styles.finishedMessage, { color: theme.colors.textSecondary }]}>
                  {score ===
                    studyResult.quiz.questions.length
                    ? 'Perfect score! 🔥'
                    : score >=
                      studyResult.quiz.questions.length * 0.7
                      ? 'Great job! Keep going.'
                      : 'Keep practicing. You will get there!'}
                </Text>

                <Pressable
                  style={[
                    styles.quizActionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleRestartQuiz}
                >
                  <Text style={styles.quizActionText}>
                    Restart Quiz
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* Recent materials */}

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Materials
        </Text>

        {loadingMaterials ? (
          <View style={styles.loadingLibrary}>
            <ActivityIndicator color={theme.colors.primary} />

            <Text style={[styles.loadingLibraryText, { color: theme.colors.textMuted }]}>
              Loading your materials...
            </Text>
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={[styles.emptyHintText, { color: theme.colors.textMuted }]}>
              Your uploaded materials will appear here.
            </Text>
          </View>
        ) : (
          materials.map((material) => (
            <Pressable
              key={material.id}
              style={[
                styles.materialCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => {
                const formattedMaterial = {
                  id: material.id,
                  title: material.title,
                  filename: material.file_name || material.title,
                  summary: material.summary,
                  key_concepts: material.key_concepts || [],
                  quiz: material.quiz || { questions: [] },
                };

                router.push({
                  pathname: '/material',
                  params: {
                    material: JSON.stringify(formattedMaterial),
                  },
                });
              }}
            >
              <View
                style={[
                  styles.pdfIcon,
                  { backgroundColor: theme.colors.cardElevated },
                ]}
              >
                <Text style={styles.pdfIconText}>📄</Text>
              </View>

              <View style={styles.materialInfo}>
                <Text
                  style={[styles.materialTitle, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {material.title}
                </Text>

                <Text style={[styles.materialMeta, { color: theme.colors.textMuted }]}>
                  {material.key_concepts?.length ?? 0} concepts ·{' '}
                  {material.quiz?.questions?.length ?? 0} questions
                </Text>
              </View>

              <Text style={[styles.arrow, { color: theme.colors.textMuted }]}>›</Text>
            </Pressable>
          ))
        )}

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
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: '#92929D',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 24,
  },

  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
  },

  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0B0B10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },

  uploadContent: {
    flex: 1,
    marginLeft: 14,
  },

  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  uploadDescription: {
    color: '#92929D',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151D',
    borderRadius: 17,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#292933',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151D',
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292933',
  },

  pdfIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#24242E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pdfIconText: {
    fontSize: 21,
  },

  materialInfo: {
    flex: 1,
    marginLeft: 13,
  },

  materialTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  materialMeta: {
    color: '#858590',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: '#777783',
    fontSize: 25,
    marginLeft: 10,
  },

  loadingLibrary: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  loadingLibraryText: {
    color: '#858590',
    fontSize: 12,
    marginTop: 10,
  },

  emptyHint: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  emptyHintText: {
    color: '#666671',
    fontSize: 12,
  },

  resultCard: {
    backgroundColor: '#15151D',
    borderRadius: 17,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#292933',
  },

  resultTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  resultSubtitle: {
    color: '#858590',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 18,
  },

  resultSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 7,
  },

  resultText: {
    color: '#B8B8C2',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },

  conceptRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },

  conceptBullet: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 8,
  },

  // =========================
  // Quiz
  // =========================

  quizCard: {
    backgroundColor: '#15151D',
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#292933',
  },

  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  quizTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  quizCounter: {
    color: '#858590',
    fontSize: 12,
    fontWeight: '600',
  },

  quizProgressBackground: {
    height: 6,
    backgroundColor: '#292932',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 24,
  },

  quizProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  questionText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    marginBottom: 18,
  },

  optionsContainer: {
    gap: 10,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24242E',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#33333E',
  },

  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30303A',
    borderRadius: 14,
    padding: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17351F',
    borderRadius: 14,
    padding: 13,
    borderWidth: 2,
    borderColor: '#4ADE80',
  },

  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A1D22',
    borderRadius: 14,
    padding: 13,
    borderWidth: 2,
    borderColor: '#F87171',
  },

  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#15151D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  optionText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  optionResult: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },

  explanationCard: {
    backgroundColor: '#20202A',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  explanationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },

  explanationText: {
    color: '#B8B8C2',
    fontSize: 12,
    lineHeight: 19,
  },

  quizActionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },

  quizActionDisabled: {
    opacity: 0.35,
  },

  quizActionText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '800',
  },

  // =========================
  // Finished
  // =========================

  finishedIcon: {
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 10,
  },

  finishedTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  finishedScore: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
  },

  finishedPercentage: {
    color: '#858590',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },

  finishedMessage: {
    color: '#B8B8C2',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});