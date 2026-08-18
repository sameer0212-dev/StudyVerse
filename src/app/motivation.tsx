import MotivationTimer from '@/components/motivation-timer';
import { HalftoneBackground } from '@/components/spider-fx';
import { useTheme } from '@/context/ThemeContext';
import {
    buildStudyVerseContext,
    ChatHistoryTurn,
    loadConversation,
    MotivationError,
    MotivationMessage,
    saveMessage,
    sendMotivationMessage,
} from '@/lib/motivation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROTATING_PROMPTS = [
  "Feeling lost? Let's talk it out.",
  "Bad day? That's okay. Start here.",
  "Let's untangle this.",
  "You don't have to figure everything out alone.",
  'Talk to me.',
];

const QUICK_STARTS: { emoji: string; label: string; message: string }[] = [
  { emoji: '😵', label: 'Overwhelmed', message: "I'm feeling really overwhelmed right now." },
  { emoji: '😔', label: 'Demotivated', message: "I can't find any motivation to study." },
  { emoji: '😴', label: "Can't Focus", message: "I can't focus no matter what I try." },
  { emoji: '😰', label: 'Exam Panic', message: "I have an exam coming up and I'm panicking." },
  { emoji: '🧭', label: "Don't Know Where to Start", message: "I don't know where to even start studying." },
  { emoji: '🔥', label: 'Need a Push', message: 'I know what to do, I just need a push to start.' },
  { emoji: '💬', label: 'Just Talk', message: 'I just want to talk for a bit.' },
];

let tempIdCounter = 0;
const tempId = () => `temp-${Date.now()}-${tempIdCounter++}`;

export default function MotivationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [messages, setMessages] = useState<MotivationMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const contextRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((i) => (i + 1) % ROTATING_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setSignedIn(false);
          return;
        }

        setSignedIn(true);

        const [conversation, context] = await Promise.all([
          loadConversation(),
          buildStudyVerseContext(),
        ]);

        contextRef.current = context;
        setMessages(conversation ?? []);
      } catch (err) {
        console.error('Failed to load Motivation Centre:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (messages.length > 0 || sending) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;

    if (content.length > 2000) {
      setError("That message is a bit long — try trimming it down.");
      return;
    }

    const history: ChatHistoryTurn[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setInput('');
    setError(null);
    setLastFailedMessage(null);

    const optimisticUser: MotivationMessage = {
      id: tempId(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);

    // Persist the user's message; a persistence hiccup shouldn't block
    // the conversation itself.
    saveMessage('user', content);

    try {
      const reply = await sendMotivationMessage(
        content,
        history,
        contextRef.current
      );

      const saved = await saveMessage('assistant', reply);

      setMessages((prev) => [
        ...prev,
        {
          id: saved?.id ?? tempId(),
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const friendlyMessage =
        err instanceof MotivationError
          ? err.message
          : "I couldn't connect right now. Try again in a moment.";
      setError(friendlyMessage);
      setLastFailedMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) send(lastFailedMessage);
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.backText, { color: theme.colors.text }]}>
              ‹ Back
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTimerVisible(true)}
            style={[
              styles.resetChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.resetChipText, { color: theme.colors.textSecondary }]}>
              ⏱ Focus Reset
            </Text>
          </Pressable>
        </View>

        {!signedIn ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Sign in to open the Motivation Centre.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isEmpty && (
              <View style={styles.hero}>
                <HalftoneBackground opacity={0.06} />
                <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                  POUR YOUR{'\n'}HEART OUT
                </Text>
                <Text
                  style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}
                >
                  {ROTATING_PROMPTS[promptIndex]}
                </Text>

                <View style={styles.chipsWrap}>
                  {QUICK_STARTS.map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => send(option.message)}
                    >
                      <Text style={styles.chipEmoji}>{option.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: theme.colors.text }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubbleRow,
                  msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAssistant,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? { backgroundColor: theme.colors.primary }
                      : {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          borderWidth: 1,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: msg.role === 'user' ? '#FFFFFF' : theme.colors.text },
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {sending && (
              <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                <View
                  style={[
                    styles.bubble,
                    styles.typingBubble,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                >
                  <ActivityIndicator color={theme.colors.textMuted} size="small" />
                </View>
              </View>
            )}

            {error && (
              <View
                style={[
                  styles.errorCard,
                  { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.danger },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.text }]}>
                  {error}
                </Text>
                {lastFailedMessage && (
                  <Pressable onPress={handleRetry}>
                    <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                      Retry
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        {signedIn && !loading && (
          <View
            style={[
              styles.inputRow,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type how you're feeling..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={sending || !input.trim()}
              style={[
                styles.sendButton,
                { backgroundColor: theme.colors.primary },
                (sending || !input.trim()) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <MotivationTimer
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        theme={theme}
        minutes={25}
      />
    </SafeAreaView>
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
  resetChip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  resetChipText: { fontSize: 12, fontWeight: '700' },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  hero: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
    minHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 15 },
  chipLabel: { fontSize: 12.5, fontWeight: '700' },
  bubbleRow: { flexDirection: 'row', marginTop: 12 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  typingBubble: { paddingVertical: 13, paddingHorizontal: 18 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  errorCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  errorText: { fontSize: 13, lineHeight: 19 },
  retryText: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
    maxWidth: 600,
    width: '92%',
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
