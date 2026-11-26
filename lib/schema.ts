// Zod schemas for story content (see docs/PRODUCT.md section 6).
// Story JSON is validated with these at load time.

import { z } from "zod";

export const LEVELS = ["A2", "B1"] as const;
export const NODE_TYPES = [
  "message",
  "narration",
  "choice",
  "shadow",
  "free-reply",
  "cliffhanger",
] as const;

const Level = z.enum(LEVELS);
const NodeId = z.string().regex(/^[a-z][a-z0-9-]*$/, "node id: lowercase, digits, dashes");
const CharacterId = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, "character id: camelCase");
const StoryId = z.string().regex(/^[a-z][a-z0-9-]*$/, "story id: kebab-case");

// ---------- Vocabulary markup ----------

/** Matches `[[word]]` and `[[shown form|key]]`. */
export const VOCAB_MARK = /\[\[([^\[\]|]+)(?:\|([^\[\]|]+))?\]\]/g;

export type VocabMark = { shown: string; key: string };

/** All vocab marks in a text, in order. A bare `[[Word]]` uses the lowercased word as its key. */
export function vocabMarks(text: string): VocabMark[] {
  return [...text.matchAll(VOCAB_MARK)].map((m) => ({
    shown: m[1],
    key: (m[2] ?? m[1]).trim().toLowerCase(),
  }));
}

/** The text with vocab marks replaced by their shown form. */
export function plainText(text: string): string {
  return text.replace(VOCAB_MARK, (_m, shown: string) => shown);
}

/** Story text: English, may contain well-formed vocab marks. */
const StoryText = z
  .string()
  .min(1)
  .refine((s) => !/\[\[|\]\]/.test(s.replace(VOCAB_MARK, "")), "malformed [[vocab]] mark");

/** Vietnamese text: never contains vocab marks. */
const ViText = z
  .string()
  .min(1)
  .refine((s) => !s.includes("[["), "Vietnamese text must not contain [[vocab]] marks");

export const VocabEntrySchema = z.object({
  /** Simple English definition, max 10 words. */
  en: z
    .string()
    .min(1)
    .refine((s) => s.trim().split(/\s+/).length <= 10, "definition: max 10 words"),
  vi: ViText,
  /** American IPA between slashes, e.g. "/wɪʃ/". */
  ipa: z.string().regex(/^\/[^/\s][^/]*\/$/, 'IPA must look like "/wɪʃ/"'),
  /** True when a human should verify the IPA. */
  ipaCheck: z.boolean().optional(),
});

export const CharacterSchema = z.object({
  name: z.string().min(1),
  /** Optional avatar emoji. */
  emoji: z.string().optional(),
});

// ---------- Nodes ----------
// Nodes play in array order. `next` jumps to another node id instead
// (used to skip the other branch and rejoin the main plot).

const Base = { id: NodeId };

export const MessageNodeSchema = z.object({
  ...Base,
  type: z.literal("message"),
  from: CharacterId,
  text: StoryText,
  vi: ViText.optional(),
  /** Shown as a voice note (e.g. Herbert records Morris talking). */
  voice: z.boolean().optional(),
  next: NodeId.optional(),
});

export const NarrationNodeSchema = z.object({
  ...Base,
  type: z.literal("narration"),
  text: StoryText,
  vi: ViText.optional(),
  next: NodeId.optional(),
});

export const ChoiceOptionSchema = z.object({
  /** What the learner sends (English). */
  text: StoryText,
  vi: ViText.optional(),
  next: NodeId,
});

export const ChoiceNodeSchema = z.object({
  ...Base,
  type: z.literal("choice"),
  /** Vietnamese question shown above the options. */
  prompt: ViText,
  /** Vietnamese hint (first hint tier). */
  hint: ViText,
  options: z.array(ChoiceOptionSchema).min(2).max(3),
});

export const ShadowNodeSchema = z.object({
  ...Base,
  type: z.literal("shadow"),
  from: CharacterId,
  /** The line the learner repeats aloud. Shown in the chat as this character's message. */
  text: StoryText,
  vi: ViText,
  voice: z.boolean().optional(),
  next: NodeId.optional(),
});

export const FreeReplyNodeSchema = z.object({
  ...Base,
  type: z.literal("free-reply"),
  prompt: ViText,
  hint: ViText,
  /** A model answer shown on the last hint tier. */
  sample: StoryText,
  level: Level.optional(),
  next: NodeId.optional(),
});

export const CliffhangerNodeSchema = z.object({
  ...Base,
  type: z.literal("cliffhanger"),
  /** A character who says it. Without `from` it is shown like a narration line. */
  from: CharacterId.optional(),
  text: StoryText,
  vi: ViText.optional(),
  voice: z.boolean().optional(),
});

export const NodeSchema = z.discriminatedUnion("type", [
  MessageNodeSchema,
  NarrationNodeSchema,
  ChoiceNodeSchema,
  ShadowNodeSchema,
  FreeReplyNodeSchema,
  CliffhangerNodeSchema,
]);

export type StoryNode = z.infer<typeof NodeSchema>;

/** Ids a node can go to next. Empty for the cliffhanger. */
export function successors(nodes: StoryNode[], index: number): string[] {
  const node = nodes[index];
  if (node.type === "cliffhanger") return [];
  if (node.type === "choice") return node.options.map((o) => o.next);
  if (node.next) return [node.next];
  const following = nodes[index + 1];
  return following ? [following.id] : [];
}

/** Every English text in a node (message text, choice options, samples…). */
export function englishTexts(node: StoryNode): string[] {
  switch (node.type) {
    case "choice":
      return node.options.map((o) => o.text);
    case "free-reply":
      return [node.sample];
    default:
      return [node.text];
  }
}

// ---------- Page ----------

export const PageSchema = z
  .object({
    storyId: StoryId,
    page: z.number().int().min(1),
    title: z.string().min(1),
    titleVi: ViText,
    level: Level,
    /** Name shown in the chat header (a person or a group). */
    chatTitle: z.string().min(1),
    characters: z.record(CharacterId, CharacterSchema),
    /** Words first introduced on this page, keyed by base form (lowercase). */
    vocab: z.record(z.string().regex(/^[a-z][a-z' -]*$/), VocabEntrySchema),
    /** Play starts at nodes[0]. */
    nodes: z.array(NodeSchema).min(2),
  })
  .superRefine((page, ctx) => {
    const issue = (message: string, path: (string | number)[] = ["nodes"]) =>
      ctx.addIssue({ code: "custom", message, path });
    const { nodes } = page;

    // Unique ids
    const index = new Map<string, number>();
    nodes.forEach((n, i) => {
      if (index.has(n.id)) issue(`duplicate node id "${n.id}"`, ["nodes", i, "id"]);
      index.set(n.id, i);
    });

    // Speakers exist
    nodes.forEach((n, i) => {
      if ("from" in n && n.from && !(n.from in page.characters)) {
        issue(`unknown character "${n.from}"`, ["nodes", i, "from"]);
      }
    });

    // Exactly one cliffhanger, and it is the last node
    const cliffs = nodes.filter((n) => n.type === "cliffhanger").length;
    if (cliffs !== 1) issue(`a page needs exactly 1 cliffhanger (found ${cliffs})`);
    if (nodes[nodes.length - 1]?.type !== "cliffhanger") issue("the last node must be the cliffhanger");

    // Links point to real nodes
    nodes.forEach((n, i) => {
      for (const target of successors(nodes, i)) {
        if (!index.has(target)) issue(`"${n.id}" goes to unknown node "${target}"`, ["nodes", i]);
      }
    });

    // Every node is reachable and there are no loops
    const seen = new Set<number>();
    const onStack = new Set<number>();
    const visit = (i: number) => {
      if (onStack.has(i)) return issue(`loop through node "${nodes[i].id}"`);
      if (seen.has(i)) return;
      seen.add(i);
      onStack.add(i);
      for (const target of successors(nodes, i)) {
        const j = index.get(target);
        if (j !== undefined) visit(j);
      }
      onStack.delete(i);
    };
    visit(0);
    nodes.forEach((n, i) => {
      if (!seen.has(i)) issue(`node "${n.id}" can never be reached`, ["nodes", i]);
    });
  });

export type Page = z.infer<typeof PageSchema>;

// ---------- The Last Page ----------

export const MOODS = ["happy", "sad", "twist"] as const;

export const LastPageSchema = z.object({
  storyId: StoryId,
  /** The writing question, in Vietnamese. */
  promptVi: ViText,
  /** Sentence pattern to reuse, e.g. "If I had the last wish, I would wish…". */
  pattern: z.string().min(1),
  moods: z
    .array(z.object({ id: z.enum(MOODS), hintVi: ViText }))
    .length(3)
    .refine((m) => new Set(m.map((x) => x.id)).size === 3, "moods must be happy, sad and twist"),
  starters: z.array(z.string().min(1)).length(6),
  /** The story's 10 vocab words first, then up to 5 extras. */
  wordBank: z.array(z.object({ word: z.string().min(1), vi: ViText })).min(10).max(15),
  modelEndings: z
    .array(z.object({ level: Level, text: z.string().min(1) }))
    .length(2)
    .refine((e) => e[0].level === "A2" && e[1].level === "B1", "model endings: one A2, then one B1"),
  /** The original ending, for writers only. Never shown to learners. */
  authorNote: z.string().min(1),
});

export type LastPage = z.infer<typeof LastPageSchema>;

// ---------- Stories manifest (content/stories.json) ----------

export const StoryMetaSchema = z.object({
  id: StoryId,
  title: z.string().min(1),
  titleVi: ViText,
  /** Stories come in themed pairs (one Western, one Vietnamese). */
  pair: z.number().int().min(1).max(5),
  themeVi: ViText,
  origin: z.enum(["vn", "west"]),
  /** Author and year, e.g. "W. W. Jacobs, 1902". */
  source: z.string().min(1),
  fearLevel: z.number().int().min(1).max(3),
  level: Level,
  pages: z.number().int().min(1),
  order: z.number().int().min(1),
  /** Shown before page 1, in Vietnamese, without spoiling the ending. */
  intro: z.object({
    /** Where and when, in one line. */
    settingVi: ViText,
    /** The set-up of the story, 2–4 sentences. */
    summaryVi: ViText,
    /** Who the learner is in the story. */
    roleVi: ViText,
    /** How the learner experiences it: whose messages they read, and what they cannot see. */
    viewVi: ViText,
  }),
});

export const StoriesManifestSchema = z
  .array(StoryMetaSchema)
  .refine((s) => new Set(s.map((x) => x.id)).size === s.length, "story ids must be unique")
  .refine((s) => new Set(s.map((x) => x.order)).size === s.length, "story order must be unique");

export type StoryMeta = z.infer<typeof StoryMetaSchema>;
