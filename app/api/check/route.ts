// The app's only server code: a thin proxy to the free public LanguageTool API,
// so the browser does not call a third-party server directly. Nothing is stored.

import { z } from "zod";
import { CHECK_MAX_CHARS, type CheckMatch, type CheckResponse } from "@/lib/feedback";

const LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check";
const TIMEOUT_MS = 8000;

const RequestSchema = z.object({ text: z.string().min(1).max(CHECK_MAX_CHARS) });

// The part of LanguageTool's answer this app uses.
const LanguageToolSchema = z.object({
  matches: z.array(
    z.object({
      message: z.string(),
      offset: z.number().int().min(0),
      length: z.number().int().min(0),
      replacements: z.array(z.object({ value: z.string() })),
      rule: z.object({
        id: z.string(),
        issueType: z.string().optional(),
        category: z.object({ id: z.string() }),
      }),
    }),
  ),
});

const error = (message: string, status: number) => Response.json({ error: message }, { status });

/** Only this site's own pages may use the proxy. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return error("forbidden", 403);
  if (Number(request.headers.get("content-length") ?? 0) > CHECK_MAX_CHARS * 4 + 100) return error("too large", 413);

  let text: string;
  try {
    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) return error("bad request", 400);
    text = parsed.data.text;
  } catch {
    return error("bad request", 400);
  }

  try {
    const response = await fetch(LANGUAGETOOL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ text, language: "en-US" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return error("languagetool unavailable", 502);
    const parsed = LanguageToolSchema.safeParse(await response.json());
    if (!parsed.success) return error("unexpected answer", 502);

    const matches: CheckMatch[] = parsed.data.matches.map((m) => ({
      offset: m.offset,
      length: m.length,
      message: m.message,
      replacements: m.replacements.slice(0, 5).map((r) => r.value),
      ruleId: m.rule.id,
      category: m.rule.category.id,
      issueType: m.rule.issueType ?? "",
    }));
    return Response.json({ matches } satisfies CheckResponse);
  } catch {
    return error("languagetool unavailable", 502);
  }
}
