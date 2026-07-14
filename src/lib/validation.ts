import { z } from "zod";

export const quizEventSchema = z.object({
  event_type: z.enum(["quiz_started", "quiz_completed"]),
  book_id: z.string().uuid(),
  // Quiz difficulty level (stored in the events.age_band column).
  age_band: z.enum(["easy", "medium", "hard"]).optional(),
  // Raw number of correct answers.
  score: z.number().int().min(0).max(1000).optional(),
  // Null for anonymous visitors; must accept null (not just undefined) so
  // anonymous quiz_completed events are not silently dropped.
  user_id: z.string().uuid().nullable().optional(),
});

export type QuizEvent = z.infer<typeof quizEventSchema>;
