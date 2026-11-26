// Make the shadow lines' audio once, offline, with ElevenLabs text-to-speech.
// The app never calls ElevenLabs: it only plays the mp3 files this script
// writes to public/audio/<story-id>/p<page>-<node-id>.mp3.
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY = "<your key>"     # set it in your own terminal only
//   node scripts/generate-audio.mjs --dry-run  # list lines, voices and characters; no API calls
//   node scripts/generate-audio.mjs            # make the missing files
//   node scripts/generate-audio.mjs --only nam-xuong --force   # remake one story
//   node scripts/generate-audio.mjs --list-voices
//
// The key is read from the environment and never written anywhere.
// Free ElevenLabs plan: non-commercial use, with attribution (the app credits ElevenLabs).
// Needs Node 22.18+ (imports the TypeScript schema directly).

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PageSchema, plainText } from "../lib/schema.ts";

const API = process.env.ELEVENLABS_API_URL ?? "https://api.elevenlabs.io/v1";
const CONTENT = "content";
const AUDIO = join("public", "audio");
const MANIFEST = join("lib", "audio-manifest.json");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const dryRun = flag("--dry-run");
const force = flag("--force");
const only = option("--only");
const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

const config = JSON.parse(readFileSync(join("scripts", "voices.json"), "utf8"));

/** Every shadow line: story, page, node id, speaking character and plain text. */
function shadowLines() {
  const lines = [];
  for (const storyId of readdirSync(CONTENT).sort()) {
    const dir = join(CONTENT, storyId);
    if (!statSync(dir).isDirectory() || (only && storyId !== only)) continue;
    const pages = readdirSync(dir)
      .map((f) => f.match(/^page-(\d+)\.json$/))
      .filter(Boolean)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    for (const page of pages) {
      const data = PageSchema.parse(JSON.parse(readFileSync(join(dir, `page-${page}.json`), "utf8")));
      for (const node of data.nodes) {
        if (node.type !== "shadow") continue;
        lines.push({
          storyId,
          page,
          nodeId: node.id,
          character: `${storyId}/${node.from}`,
          name: data.characters[node.from].name,
          text: plainText(node.text),
          file: join(AUDIO, storyId, `p${page}-${node.id}.mp3`),
        });
      }
    }
  }
  return lines;
}

function voiceFor(line) {
  const kind = config.characters[line.character];
  if (!kind) throw new Error(`No voice for ${line.character} (${line.name}): add it to scripts/voices.json`);
  const id = config.voices[kind];
  if (!id) throw new Error(`Unknown voice kind "${kind}" for ${line.character}`);
  return { kind, id };
}

async function api(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "xi-api-key": apiKey, ...init.headers },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const hint =
      response.status === 401
        ? " (check ELEVENLABS_API_KEY)"
        : response.status === 402 || /quota/i.test(body)
          ? " (out of credits for this month)"
          : response.status === 429
            ? " (too many requests: wait a minute and run again)"
            : "";
    throw new Error(`ElevenLabs ${response.status}${hint}: ${body.slice(0, 300)}`);
  }
  return response;
}

async function speech(text, voiceId) {
  const response = await api(`/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: config.model }),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`ElevenLabs returned only ${bytes.length} bytes`);
  return bytes;
}

/** The list of mp3 files the app may play, as "<story-id>/p<page>-<node-id>". */
function writeManifest() {
  const keys = [];
  if (existsSync(AUDIO)) {
    for (const storyId of readdirSync(AUDIO).sort()) {
      const dir = join(AUDIO, storyId);
      if (!statSync(dir).isDirectory()) continue;
      for (const file of readdirSync(dir).sort()) {
        const m = file.match(/^(p\d+-[A-Za-z0-9_-]+)\.mp3$/);
        if (m) keys.push(`${storyId}/${m[1]}`);
      }
    }
  }
  writeFileSync(MANIFEST, `${JSON.stringify(keys, null, 2)}\n`);
  return keys.length;
}

async function listVoices() {
  const data = await (await api("/voices")).json();
  for (const v of data.voices ?? []) {
    const labels = Object.values(v.labels ?? {}).join(", ");
    console.log(`${v.voice_id}  ${v.name}${labels ? `  (${labels})` : ""}  [${v.category ?? ""}]`);
  }
}

async function main() {
  if (!dryRun && !apiKey) {
    console.error('Set ELEVENLABS_API_KEY in this terminal first, e.g. $env:ELEVENLABS_API_KEY = "..."');
    process.exit(2);
  }
  if (flag("--list-voices")) return listVoices();

  const lines = shadowLines();
  for (const line of lines) voiceFor(line); // fail early on a missing voice
  const todo = lines.filter((l) => force || !existsSync(l.file));
  const chars = todo.reduce((n, l) => n + l.text.length, 0);
  console.log(`${lines.length} shadow lines, ${todo.length} to make (${chars} characters).`);

  if (dryRun) {
    for (const l of todo) console.log(`  ${l.file}  [${voiceFor(l).kind}] ${l.name}: ${l.text}`);
    return;
  }

  let made = 0;
  try {
    for (const line of todo) {
      const { id } = voiceFor(line);
      mkdirSync(join(AUDIO, line.storyId), { recursive: true });
      writeFileSync(line.file, await speech(line.text, id));
      made++;
      console.log(`  ✓ ${line.file}  ${line.name}: ${line.text}`);
    }
  } catch (error) {
    console.error(`\nStopped after ${made} file(s): ${error.message}`);
    process.exitCode = 1;
  } finally {
    console.log(`Manifest: ${writeManifest()} file(s) listed in ${MANIFEST}.`);
  }
}

await main();
