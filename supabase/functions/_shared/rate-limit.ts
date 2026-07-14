import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Derive the client IP from request headers.
 *
 * `X-Forwarded-For` is a client-controllable, comma-separated list where the
 * platform APPENDS the real peer IP as the LAST entry. Naively taking the
 * FIRST entry lets a caller spoof a fresh IP on every request (defeating rate
 * limiting), so we take the last entry instead.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit?: number;
  /** Sliding window size in milliseconds. */
  windowMs?: number;
}

/**
 * Returns true if the client has EXCEEDED the rate limit for this endpoint.
 *
 * Fails CLOSED (treats the caller as rate-limited) on a database error: these
 * endpoints spend money on AI, so it is safer to briefly reject than to allow
 * unbounded abuse while the logging table is unavailable.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  ipAddress: string,
  endpoint: string,
  options: RateLimitOptions = {}
): Promise<boolean> {
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? 60 * 60 * 1000;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from("request_logs")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .eq("endpoint", endpoint)
    .gte("created_at", since);

  if (error) {
    console.error("Rate limit check error:", error);
    return true; // fail closed
  }

  return (count || 0) >= limit;
}

/**
 * Log a request to the request_logs table (best-effort).
 */
export async function logRequest(
  supabase: SupabaseClient,
  ipAddress: string,
  endpoint: string
): Promise<void> {
  const { error } = await supabase
    .from("request_logs")
    .insert({ ip_address: ipAddress, endpoint });
  if (error) {
    console.error("Failed to log request:", error);
  }
}
