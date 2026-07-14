// Shared AI client — Google Gemini (native API), replacing the Lovable AI Gateway.
//
// The whole app used to route model calls through https://ai.gateway.lovable.dev
// (an OpenAI-compatible proxy to google/gemini-2.5-flash). That required paid
// Lovable credits, and when they ran out every AI feature failed
// ("Failed to generate quiz"). This calls Gemini directly with a free-tier
// GEMINI_API_KEY, preserving Google Search grounding.
//
// Provider is centralized here so a future swap only touches this file.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GenerateContentOptions {
  /** System instruction (persona / rules). */
  system?: string;
  /** User message / prompt. */
  user: string;
  /** Enable Google Search grounding (web-verified answers). */
  grounding?: boolean;
  /** Sampling temperature. */
  temperature?: number;
  /** Simple retry count for transient errors (429/5xx). Default 2. */
  retries?: number;
}

/**
 * Call Gemini and return the generated text.
 * Throws on non-retryable HTTP errors (with the status in the message).
 * Returns "" if the model returns no candidates.
 */
export async function generateContent(opts: GenerateContentOptions): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
  };
  if (opts.system) {
    body.system_instruction = { parts: [{ text: opts.system }] };
  }
  if (opts.grounding) {
    // gemini-2.x grounding tool
    body.tools = [{ google_search: {} }];
  }
  if (typeof opts.temperature === "number") {
    body.generationConfig = { temperature: opts.temperature };
  }

  const maxAttempts = (opts.retries ?? 2) + 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastError = err;
      continue; // network error → retry
    }

    if (response.ok) {
      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return "";
      return parts
        .map((p: { text?: string }) => p?.text ?? "")
        .join("")
        .trim();
    }

    // Retry on rate-limit / transient server errors
    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`Gemini API error: ${response.status}`);
      // small backoff without Date.now(): scale by attempt
      await new Promise((r) => setTimeout(r, attempt * 500));
      continue;
    }

    // Non-retryable client error
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini API call failed after retries");
}
