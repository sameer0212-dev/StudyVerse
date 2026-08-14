import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
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

const API_URL = 'http://192.168.1.10:8000';

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export default function LibraryScreen() {
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [studyResult, setStudyResult] = useState<any>(null);

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

    const selectedIndex =
      question.options.indexOf(selectedAnswer);

    const selectedLetter =
      String.fromCharCode(65 + selectedIndex);

    const correctAnswer = question.correct_answer.trim();

    const correctLetter =
      correctAnswer.charAt(0).toUpperCase();

    if (selectedLetter === correctLetter) {
      setScore((previous) => previous + 1);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Library</Text>

        <Text style={styles.subtitle}>
          Turn your study material into interactive learning.
        </Text>

        {/* Upload button */}

        <Pressable
          style={styles.uploadCard}
          onPress={handlePickDocument}
          disabled={isProcessing}
        >
          <View style={styles.uploadIcon}>
            <Text style={styles.uploadIconText}>＋</Text>
          </View>

          <View style={styles.uploadContent}>
            <Text style={styles.uploadTitle}>Upload a PDF</Text>

            <Text style={styles.uploadDescription}>
              Add your notes, slides, textbook, or study material.
            </Text>
          </View>
        </Pressable>

        {/* Selected PDF */}

        {selectedFile && (
          <View style={styles.selectedFileCard}>
            <View style={styles.pdfIcon}>
              <Text style={styles.pdfIconText}>📄</Text>
            </View>

            <View style={styles.materialInfo}>
              <Text
                style={styles.materialTitle}
                numberOfLines={1}
              >
                {selectedFile.name}
              </Text>

              <Text style={styles.materialMeta}>
                {isProcessing
                  ? 'AI is processing your study material...'
                  : 'PDF selected · Ready for study'}
              </Text>
            </View>

            {isProcessing && <ActivityIndicator />}
          </View>
        )}

        {/* AI Result */}

        {studyResult && !isProcessing && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                Study Material Generated
              </Text>

              <Text style={styles.resultSubtitle}>
                {decodeURIComponent(studyResult.filename)}
              </Text>

              {/* Summary */}

              <Text style={styles.resultSectionTitle}>
                Summary
              </Text>

              <Text style={styles.resultText}>
                {studyResult.notes.summary}
              </Text>

              {/* Key Concepts */}

              <Text style={styles.resultSectionTitle}>
                Key Concepts
              </Text>

              {studyResult.notes.key_concepts.map(
                (concept: string, index: number) => (
                  <View
                    key={index}
                    style={styles.conceptRow}
                  >
                    <Text style={styles.conceptBullet}>
                      •
                    </Text>

                    <Text style={styles.resultText}>
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
              <View style={styles.quizCard}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>
                    Quiz
                  </Text>

                  <Text style={styles.quizCounter}>
                    Question {currentQuestionIndex + 1} of{' '}
                    {studyResult.quiz.questions.length}
                  </Text>
                </View>

                <View style={styles.quizProgressBackground}>
                  <View
                    style={[
                      styles.quizProgressFill,
                      {
                        width: `${((currentQuestionIndex + 1) /
                          studyResult.quiz.questions.length) *
                          100
                          }%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>

                {/* Options */}

                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map(
                    (option: string, index: number) => {
                      const isSelected = selectedAnswer === option;

                      const optionLetter = String.fromCharCode(65 + index);

                      const correctAnswerLetter =
                        currentQuestion.correct_answer.trim().charAt(0).toUpperCase();

                      const isCorrect =
                        optionLetter === correctAnswerLetter;

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
                          style={optionStyle}
                          onPress={() => {
                            if (!showAnswer) {
                              setSelectedAnswer(option);
                            }
                          }}
                          disabled={showAnswer}
                        >
                          <View style={styles.optionLetter}>
                            <Text style={styles.optionLetterText}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>

                          <Text style={styles.optionText}>
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
                  <View style={styles.explanationCard}>
                    <Text style={styles.explanationTitle}>
                      {String.fromCharCode(
                        65 + currentQuestion.options.indexOf(selectedAnswer!)
                      ) ===
                        currentQuestion.correct_answer
                          .trim()
                          .charAt(0)
                          .toUpperCase()
                        ? '✓ Correct!'
                        : '✕ Not quite'}
                    </Text>

                    <Text style={styles.explanationText}>
                      {currentQuestion.explanation}
                    </Text>
                  </View>
                )}

                {/* Action button */}

                {!showAnswer ? (
                  <Pressable
                    style={[
                      styles.quizActionButton,
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
                    style={styles.quizActionButton}
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
              <View style={styles.quizCard}>
                <Text style={styles.finishedIcon}>
                  🎯
                </Text>

                <Text style={styles.finishedTitle}>
                  Quiz Complete!
                </Text>

                <Text style={styles.finishedScore}>
                  {score} / {studyResult.quiz.questions.length}
                </Text>

                <Text style={styles.finishedPercentage}>
                  {Math.round(
                    (score /
                      studyResult.quiz.questions.length) *
                    100
                  )}
                  %
                </Text>

                <Text style={styles.finishedMessage}>
                  {score ===
                    studyResult.quiz.questions.length
                    ? 'Perfect score! 🔥'
                    : score >=
                      studyResult.quiz.questions.length * 0.7
                      ? 'Great job! Keep going.'
                      : 'Keep practicing. You will get there!'}
                </Text>

                <Pressable
                  style={styles.quizActionButton}
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

        <Text style={styles.sectionTitle}>
          Recent Materials
        </Text>

        <View style={styles.materialCard}>
          <View style={styles.pdfIcon}>
            <Text style={styles.pdfIconText}>📄</Text>
          </View>

          <View style={styles.materialInfo}>
            <Text style={styles.materialTitle}>
              Operating Systems
            </Text>

            <Text style={styles.materialMeta}>
              12 concepts · 24 questions
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </View>

        <View style={styles.materialCard}>
          <View style={styles.pdfIcon}>
            <Text style={styles.pdfIconText}>📄</Text>
          </View>

          <View style={styles.materialInfo}>
            <Text style={styles.materialTitle}>
              Database Systems
            </Text>

            <Text style={styles.materialMeta}>
              18 concepts · 30 questions
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </View>

        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintText}>
            Your uploaded materials will appear here.
          </Text>
        </View>
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
    color: '#0B0B10',
    fontSize: 16,
    fontWeight: '800',
  },

  uploadDescription: {
    color: '#666671',
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
    marginTop: 12,
  },
});