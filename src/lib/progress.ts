import { supabase } from '@/lib/supabase';

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export type StudyMaterial = {
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

export type QuizAttempt = {
  id: string;
  user_id: string;
  material_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
};

export type MissionData = {
  id: string; // material id
  title: string;
  topic: string;
  description: string;
  totalQuestions: number;
  keyConceptsCount: number;
  attemptsCount: number;
  bestScore: number | null; // 0-100, null if never attempted
  lastAttemptAt: string | null;
  completed: boolean;
  material: StudyMaterial;
};

export type UserStudyData = {
  materials: StudyMaterial[];
  attempts: QuizAttempt[];
  missions: MissionData[];
};

/**
 * Fetches the current authenticated user's study materials and quiz
 * attempts, and derives a Mission for each material.
 *
 * Returns null if there is no authenticated session.
 */
export async function fetchUserStudyData(): Promise<UserStudyData | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  const [materialsResult, attemptsResult] = await Promise.all([
    supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),
  ]);

  if (materialsResult.error) {
    throw materialsResult.error;
  }

  // The quiz_attempts table may not exist yet if the SQL migration has not
  // been run. Rather than breaking the whole screen, treat that as "no
  // attempts recorded" and continue with materials only.
  const attempts: QuizAttempt[] = attemptsResult.error
    ? []
    : (attemptsResult.data as QuizAttempt[]) ?? [];

  if (attemptsResult.error) {
    console.warn(
      'quiz_attempts table unavailable (has the migration been run?):',
      attemptsResult.error.message
    );
  }

  const materials: StudyMaterial[] = (materialsResult.data as StudyMaterial[]) ?? [];

  const missions: MissionData[] = materials.map((material) => {
    const materialAttempts = attempts.filter(
      (attempt) => attempt.material_id === material.id
    );

    const bestScore =
      materialAttempts.length > 0
        ? Math.max(...materialAttempts.map((a) => a.percentage))
        : null;

    const lastAttemptAt =
      materialAttempts.length > 0 ? materialAttempts[0].completed_at : null;

    const questions = material.quiz?.questions ?? [];
    const keyConcepts = material.key_concepts ?? [];

    return {
      id: material.id,
      title: material.title,
      topic:
        keyConcepts.length > 0
          ? keyConcepts[0]
          : 'General review',
      description: `${keyConcepts.length} concept${keyConcepts.length === 1 ? '' : 's'} · ${questions.length} quiz question${questions.length === 1 ? '' : 's'}`,
      totalQuestions: questions.length,
      keyConceptsCount: keyConcepts.length,
      attemptsCount: materialAttempts.length,
      bestScore,
      lastAttemptAt,
      completed: materialAttempts.length > 0,
      material,
    };
  });

  return { materials, attempts, missions };
}

/**
 * Picks the most relevant "Today's Mission" for the Home screen:
 * 1. The most recently added material that has never been attempted.
 * 2. If everything has been attempted, the one with the lowest mastery
 *    (most room to improve).
 * 3. null if the user has no materials at all.
 */
export function pickTodaysMission(missions: MissionData[]): MissionData | null {
  if (missions.length === 0) return null;

  const notStarted = missions.filter((m) => !m.completed);
  if (notStarted.length > 0) {
    return notStarted[0]; // materials are already sorted by created_at desc
  }

  return [...missions].sort(
    (a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0)
  )[0];
}

/**
 * Average mastery across materials that have at least one quiz attempt.
 * Returns null if nothing has been attempted yet.
 */
export function computeAverageMastery(missions: MissionData[]): number | null {
  const attempted = missions.filter((m) => m.bestScore !== null);
  if (attempted.length === 0) return null;

  const total = attempted.reduce((sum, m) => sum + (m.bestScore ?? 0), 0);
  return Math.round(total / attempted.length);
}

/**
 * Builds the expo-router destination for acting on a mission: materials
 * that haven't been attempted yet open the material screen (Study
 * Material action); materials already attempted jump straight into a
 * quiz retake (Quiz action).
 */
export function getMissionRoute(mission: MissionData): {
  pathname: '/material' | '/quiz';
  params: Record<string, string>;
} {
  if (!mission.completed) {
    const formattedMaterial = {
      id: mission.material.id,
      title: mission.material.title,
      filename: mission.material.file_name || mission.material.title,
      summary: mission.material.summary,
      key_concepts: mission.material.key_concepts || [],
      quiz: mission.material.quiz || { questions: [] },
    };

    return {
      pathname: '/material',
      params: { material: JSON.stringify(formattedMaterial) },
    };
  }

  return {
    pathname: '/quiz',
    params: {
      questions: JSON.stringify(mission.material.quiz?.questions ?? []),
      materialId: mission.material.id,
      materialTitle: mission.material.title,
    },
  };
}

/**
 * Simple day-streak: counts consecutive calendar days (ending today or
 * yesterday) on which at least one quiz was completed.
 */
export function computeDayStreak(attempts: QuizAttempt[]): number {
  if (attempts.length === 0) return 0;

  const daySet = new Set(
    attempts.map((a) => new Date(a.completed_at).toDateString())
  );

  const cursor = new Date();

  if (!daySet.has(cursor.toDateString())) {
    // Streak can still be "alive" if the user completed something
    // yesterday but hasn't yet today.
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (daySet.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
