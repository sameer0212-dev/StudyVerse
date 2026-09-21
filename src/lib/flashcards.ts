import { API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export type Flashcard = {
  id: string;
  material_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
};

export class FlashcardError extends Error {}

/**
 * Loads any previously-generated flashcards for a study material, ordered
 * for study. Returns null if there's no authenticated session, and an
 * empty array if none have been generated yet (or the table doesn't exist
 * yet because the migration hasn't been run — fails soft rather than
 * blocking the screen).
 */
export async function fetchFlashcards(
  materialId: string
): Promise<Flashcard[] | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('material_id', materialId)
    .order('order_index', { ascending: true });

  if (error) {
    console.warn(
      'flashcards unavailable (has the migration been run?):',
      error.message
    );
    return [];
  }

  return (data as Flashcard[]) ?? [];
}

/**
 * Generates a fresh flashcard deck for a study material via the backend
 * AI endpoint, then persists it to Supabase (replacing any previous deck
 * for the same material). Returns the saved cards.
 *
 * Throws FlashcardError with a user-friendly message on any failure.
 */
export async function generateFlashcards(
  materialId: string,
  summary: string,
  keyConcepts: string[]
): Promise<Flashcard[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new FlashcardError('Please sign in again to generate flashcards.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  let generated: { question: string; answer: string }[];

  try {
    const response = await fetch(`${API_URL}/generate-flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, key_concepts: keyConcepts }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FlashcardError(
        "Couldn't generate flashcards right now. Try again in a moment."
      );
    }

    const data = await response.json();

    if (!Array.isArray(data?.flashcards) || data.flashcards.length === 0) {
      throw new FlashcardError(
        "Couldn't generate flashcards from this material."
      );
    }

    generated = data.flashcards;
  } catch (error) {
    if (error instanceof FlashcardError) throw error;

    if ((error as any)?.name === 'AbortError') {
      throw new FlashcardError(
        'That took too long. Please try again.'
      );
    }

    throw new FlashcardError(
      "Couldn't connect right now. Try again in a moment."
    );
  } finally {
    clearTimeout(timeout);
  }

  // Replace any existing deck for this material with the fresh one.
  const { error: deleteError } = await supabase
    .from('flashcards')
    .delete()
    .eq('user_id', session.user.id)
    .eq('material_id', materialId);

  if (deleteError) {
    console.warn('Could not clear previous flashcards:', deleteError.message);
  }

  const rows = generated.map((card, index) => ({
    user_id: session.user.id,
    material_id: materialId,
    question: card.question,
    answer: card.answer,
    order_index: index,
  }));

  const { data: saved, error: insertError } = await supabase
    .from('flashcards')
    .insert(rows)
    .select();

  if (insertError || !saved) {
    console.warn('Could not save flashcards:', insertError?.message);
    // Persistence failed, but the student can still study this session —
    // return client-side cards so the feature isn't blocked entirely.
    return rows.map((row, index) => ({
      id: `local-${index}`,
      material_id: row.material_id,
      question: row.question,
      answer: row.answer,
      order_index: row.order_index,
      created_at: new Date().toISOString(),
    }));
  }

  return (saved as Flashcard[]).sort((a, b) => a.order_index - b.order_index);
}
