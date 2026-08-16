import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
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

type Material = {
    id?: string;
    title?: string;
    filename?: string;
    notes?: {
        summary?: string;
        key_concepts?: string[];
    };
    summary?: string;
    key_concepts?: string[];
    quiz?: {
        questions?: QuizQuestion[];
    };
};

export default function MaterialScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ material?: string }>();

    // Safely parse JSON parameter or fallback to null
    const material: Material | null = useMemo(() => {
        if (!params.material) return null;
        try {
            return typeof params.material === 'string'
                ? JSON.parse(params.material)
                : params.material;
        } catch (error) {
            console.error('Failed to parse material parameter:', error);
            return null;
        }
    }, [params.material]);

    // Fallback UI if parameter parsing fails or material is missing
    if (!material) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Material Not Found</Text>
                    <Text style={styles.errorSubtitle}>
                        Could not load the requested study material.
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.errorBackButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.errorBackButtonText}>‹ Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const title = material.title ?? material.filename ?? 'Untitled Material';
    const summary = material.summary ?? material.notes?.summary;
    const keyConcepts = material.key_concepts ?? material.notes?.key_concepts ?? [];
    const questions: QuizQuestion[] = material.quiz?.questions ?? [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={() => router.back()}
                    hitSlop={12}
                >
                    <Text style={styles.backText}>‹ Back</Text>
                </Pressable>

                <Text style={styles.title}>{title}</Text>

                <Text style={styles.meta}>
                    {keyConcepts.length} concepts · {questions.length}{' '}
                    {questions.length === 1 ? 'question' : 'questions'}
                </Text>

                {/* Summary */}
                {summary ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Summary</Text>
                        <Text style={styles.bodyText}>{summary}</Text>
                    </View>
                ) : null}

                {/* Key Concepts */}
                {keyConcepts.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Key Concepts</Text>
                        {keyConcepts.map((concept, index) => (
                            <View key={`${concept}-${index}`} style={styles.conceptRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bodyText}>{concept}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Quiz Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Quiz</Text>
                    <Text style={styles.quizIntro}>
                        Test yourself with {questions.length} question
                        {questions.length === 1 ? '' : 's'}.
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.quizButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={() => {
                            router.push({
                                pathname: '/quiz',
                                params: {
                                    questions: JSON.stringify(questions),
                                    ...(material.id
                                        ? { materialId: material.id, materialTitle: title }
                                        : {}),
                                },
                            });
                        }}
                    >
                        <Text style={styles.quizButtonText}>Start Quiz</Text>
                    </Pressable>
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
        padding: 20,
        paddingBottom: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    errorSubtitle: {
        color: '#858590',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorBackButton: {
        backgroundColor: '#15151D',
        borderColor: '#292933',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    errorBackButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
    },
    meta: {
        color: '#858590',
        fontSize: 12,
        marginTop: 7,
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#15151D',
        borderRadius: 17,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#292933',
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    bodyText: {
        color: '#B8B8C2',
        fontSize: 13,
        lineHeight: 20,
        flex: 1,
    },
    conceptRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bullet: {
        color: '#FFFFFF',
        fontSize: 15,
        marginRight: 8,
    },
    quizIntro: {
        color: '#858590',
        fontSize: 13,
        lineHeight: 19,
    },
    quizButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 18,
    },
    quizButtonText: {
        color: '#0B0B10',
        fontSize: 14,
        fontWeight: '800',
    },
    buttonPressed: {
        opacity: 0.8,
    },
});