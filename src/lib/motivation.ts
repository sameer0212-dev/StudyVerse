import { API_URL } from '@/lib/api';
import {
    computeAverageMastery,
    computeDayStreak,
    fetchUserStudyData,
    MissionData,
    QuizAttempt,
} from '@/lib/progress';
import { supabase } from '@/lib/supabase';

export type MessageRole = 'user' | 'assistant';

export type MotivationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

const HISTORY_LIMIT = 50; // how many past messages to load into the screen
const CONTEXT_HISTORY_TURNS = 8; // how many recent turns to send to the AI

export class MotivationError extends Error {}

/**
 * Loads the current user's Motivation Centre conversation (most recent
 * messages, oldest first). Returns null if there's no authenticated
 * session.
 */
export async function loadConversation(): Promise<MotivationMessage[] | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('motivation_messages')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    // Table may not exist yet if the migration hasn't been run. Fail soft
    // so the screen still works (as a non-persisted conversation) instead
    // of crashing.
    console.warn(
      'motivation_messages unavailable (has the migration been run?):',
      error.message
    );
    return [];
  }

  return ((data as MotivationMessage[]) ?? []).slice().reverse();
}

/**
 * Persists a single message (user or assistant) for the authenticated
 * user. Returns null (rather than throwing) on failure so a persistence
 * hiccup never blocks the conversation itself.
 */
export async function saveMessage(
  role: MessageRole,
  content: string
): Promise<MotivationMessage | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('motivation_messages')
    .insert({ user_id: session.user.id, role, content })
    .select()
    .single();

  if (error) {
    console.warn('Could not save motivation message:', error.message);
    return null;
  }

  return data as MotivationMessage;
}

/**
 * Builds a short, human-readable summary of the student's StudyVerse
 * activity — reusing the exact same streak/mastery calculations as
 * Home/Progress rather than recomputing anything. Returns null if there's
 * no signed-in user or nothing worth summarizing yet.
 */
export async function buildStudyVerseContext(): Promise<string | null> {
  try {
    const data = await fetchUserStudyData();
    if (!data || data.materials.length === 0) return null;

    const streak = computeDayStreak(data.attempts);
    const avgMastery = computeAverageMastery(data.missions);
    const missionsCompleted = new Set(
      data.attempts.map((a: QuizAttempt) => a.material_id)
    ).size;

    const lines: string[] = [];
    lines.push(`Study materials uploaded: ${data.materials.length}.`);
    lines.push(`Current day streak: ${streak}.`);
    lines.push(
      `Missions completed: ${missionsCompleted} of ${data.materials.length}.`
    );

    if (avgMastery !== null) {
      lines.push(`Average quiz mastery: ${avgMastery}%.`);
    }

    const trend = recentScoreTrend(data.missions, data.attempts);
    if (trend) lines.push(trend);

    return lines.join(' ');
  } catch (error) {
    console.warn('Could not build StudyVerse context:', error);
    return null;
  }
}

/**
 * Looks at the most recent quiz attempts (oldest -> newest of the last
 * few) and, if there's a clear improving or declining trend, describes it
 * in one short sentence.
 */
function recentScoreTrend(
  missions: MissionData[],
  attempts: QuizAttempt[]
): string | null {
  if (attempts.length < 2) return null;

  const recent = [...attempts]
    .sort(
      (a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    )
    .slice(-3);

  if (recent.length < 2) return null;

  const first = recent[0].percentage;
  const last = recent[recent.length - 1].percentage;
  const delta = last - first;

  if (Math.abs(delta) < 8) return null;

  return delta > 0
    ? `Recent quiz scores are trending up, from ${first}% to ${last}%.`
    : `Recent quiz scores are trending down, from ${first}% to ${last}%.`;
}

export type ChatHistoryTurn = { role: MessageRole; content: string };

/**
 * Sends a message to the Motivation Centre backend and returns the AI's
 * reply. Throws a MotivationError with a user-friendly message on any
 * failure (network, timeout, server error).
 */
export async function sendMotivationMessage(
  message: string,
  history: ChatHistoryTurn[],
  context: string | null
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${API_URL}/motivation-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-CONTEXT_HISTORY_TURNS),
        context,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MotivationError(
        "I couldn't connect right now. Try again in a moment."
      );
    }

    const data = await response.json();

    if (!data?.reply || typeof data.reply !== 'string') {
      throw new MotivationError(
        "That didn't come through right. Mind trying again?"
      );
    }

    return data.reply;
  } catch (error) {
    if (error instanceof MotivationError) throw error;

    if ((error as any)?.name === 'AbortError') {
      throw new MotivationError(
        "That took too long to respond. Let's try again."
      );
    }

    throw new MotivationError(
      "I couldn't connect right now. Try again in a moment."
    );
  } finally {
    clearTimeout(timeout);
  }
}
