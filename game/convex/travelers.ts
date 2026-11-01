import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { chatCompletion } from './util/llm';
import { ARRIVAL_INTERVAL, ARRIVAL_CHECK_INTERVAL, MAX_GUESTS, MIN_TIME_AWAY } from './constants';

// Travelers come from the Nomad-Cafe backend: customers with their published
// stories (GET /game/travelers). They're cached in the `travelers` table, so
// the café keeps running on the last copy if the backend is down.

const SPRITES = ['adam', 'alex', 'amelia', 'bob'];

const story = v.object({
  id: v.string(),
  destination: v.string(),
  what_happened: v.string(),
  interesting_things: v.optional(v.string()),
  artifact: v.optional(v.string()),
  emotion: v.optional(v.string()),
  pictures: v.optional(v.array(v.string())),
});
type Story = Doc<'travelers'>['stories'][number];

const voice = v.object({
  style: v.string(),
  length: v.union(v.literal('short'), v.literal('medium')),
  examples: v.array(v.string()),
  basedOn: v.string(),
});

// The backend sends null for empty optional fields; Convex wants them absent.
const orUndefined = <T>(x: T | null) => (x === null ? undefined : x);

export const sync = internalAction({
  args: {},
  handler: async (ctx) => {
    const url = process.env.NOMAD_API_URL;
    if (!url) {
      console.warn('NOMAD_API_URL is not set; keeping the travelers we already have.');
      return;
    }
    let data: any[];
    try {
      const response = await fetch(`${url}/game/travelers`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (e: any) {
      console.warn(`Couldn't reach the Nomad-Cafe backend at ${url}: ${e.message}`);
      return;
    }
    const travelers = data.map((t) => ({
      travelerId: String(t.id),
      name: t.name,
      personality: t.personality_traits ?? '',
      appearance: t.visual_description ?? '',
      stories: t.stories.map((s: any) => ({
        id: String(s.id),
        destination: s.destination,
        what_happened: s.what_happened,
        interesting_things: orUndefined(s.interesting_things),
        artifact: orUndefined(s.artifact),
        emotion: orUndefined(s.emotion),
        pictures: orUndefined(s.pictures),
      })),
    }));
    // Give each traveler a speaking voice, made once from their personality.
    const voices = await ctx.runQuery(internal.travelers.voices, {});
    const withVoices = [];
    for (const t of travelers) {
      const basedOn = `${VOICE_PROMPT_VERSION}\n${t.personality}\n${t.appearance}`;
      const voice =
        voices.find((v) => v.travelerId === t.travelerId && v.voice?.basedOn === basedOn)?.voice ??
        (await writeVoice(t.name, t.personality, t.appearance, basedOn));
      withVoices.push({ ...t, voice });
    }
    await ctx.runMutation(internal.travelers.save, { travelers: withVoices });
  },
});

export const voices = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('travelers').collect();
    return rows.map(({ travelerId, voice }) => ({ travelerId, voice }));
  },
});

// Character prompts work best with a concrete description of how someone talks
// plus a few sample lines, which small models imitate closely. We ask the LLM
// to write both from the traveler's personality traits. Bump the version when
// changing this prompt, so every voice gets rewritten.
const VOICE_PROMPT_VERSION = 'voice-v2';
async function writeVoice(name: string, personality: string, appearance: string, basedOn: string) {
  // Small models sometimes return broken JSON; give them a few tries.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await tryWriteVoice(name, personality, appearance, basedOn);
    } catch (e: any) {
      console.warn(`Couldn't write a voice for ${name} (try ${attempt}): ${e.message}`);
    }
  }
  return undefined;
}

async function tryWriteVoice(
  name: string,
  personality: string,
  appearance: string,
  basedOn: string,
) {
  const { content } = await chatCompletion({
    messages: [
      {
        role: 'system',
        content:
          'You design how a character talks, so they sound unlike anyone else. ' +
          "Given a traveler's personality and appearance, reply with JSON: " +
          '{"style": one or two sentences on HOW they talk: sentence length, formality, word choice, ' +
          'verbal habits or pet phrases, humor, and what they tend to ask about; ' +
          '"length": "short" if they usually say very little, otherwise "medium"; ' +
          '"examples": three lines they would say while chatting with a stranger in a café, each under 20 words, ' +
          "clearly in their own voice: one opener, one reaction to someone else's travel story, one about themselves. " +
          'Do not name any real places or tell a travel story in the examples.}',
      },
      {
        role: 'user',
        content: `Name: ${name}\nPersonality: ${personality}\nAppearance: ${appearance}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 250,
  });
  const parsed = JSON.parse(content);
  const examples = Array.isArray(parsed.examples)
    ? parsed.examples.filter((e: unknown) => typeof e === 'string' && e.trim()).slice(0, 3)
    : [];
  if (typeof parsed.style !== 'string' || !parsed.style.trim() || examples.length === 0) {
    throw new Error(`unexpected reply: ${content}`);
  }
  return {
    style: parsed.style.trim(),
    length: parsed.length === 'short' ? ('short' as const) : ('medium' as const),
    examples,
    basedOn,
  };
}

export const save = internalMutation({
  args: {
    travelers: v.array(
      v.object({
        travelerId: v.string(),
        name: v.string(),
        personality: v.string(),
        appearance: v.string(),
        stories: v.array(story),
        voice: v.optional(voice),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('travelers').collect();
    for (const t of args.travelers) {
      const row = existing.find((r) => r.travelerId === t.travelerId);
      if (row) {
        // Two overlapping syncs can both write a voice for the same personality;
        // keep the one already saved.
        const keepVoice = row.voice && row.voice.basedOn === t.voice?.basedOn;
        await ctx.db.patch(row._id, keepVoice ? { ...t, voice: row.voice } : t);
      } else {
        // Pick a sprite from the id so a traveler always looks the same.
        const hash = [...t.travelerId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
        await ctx.db.insert('travelers', {
          ...t,
          character: SPRITES[hash % SPRITES.length],
          told: [],
        });
      }
    }
    // Customers who were deleted or no longer have published stories.
    for (const row of existing) {
      if (!args.travelers.some((t) => t.travelerId === row.travelerId)) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

// Runs every ARRIVAL_CHECK_INTERVAL: while there's room, now and then a
// traveler who isn't inside and hasn't just left walks in. An empty café fills
// up right away.
export const admit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .unique();
    if (!worldStatus || worldStatus.status !== 'running') return;
    const world = (await ctx.db.get(worldStatus.worldId))!;
    if (world.agents.length >= MAX_GUESTS) return;
    if (world.agents.length >= 2 && Math.random() > ARRIVAL_CHECK_INTERVAL / ARRIVAL_INTERVAL) {
      return;
    }
    // Wait for the previous arrival to be processed.
    const pending = await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) => q.eq('engineId', worldStatus.engineId))
      .order('desc')
      .filter((q) => q.eq(q.field('name'), 'createAgent'))
      .first();
    if (pending && pending.returnValue === undefined) return;

    const now = Date.now();
    const descriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', world._id))
      .collect();
    const candidates = [];
    for (const t of await ctx.db.query('travelers').collect()) {
      const playerId = descriptions.find((d) => d.travelerId === t.travelerId)?.playerId;
      const inside = playerId && world.players.some((p) => p.id === playerId);
      const justLeft = (world.departures ?? []).some(
        (d) => d.playerId === playerId && now < d.left + MIN_TIME_AWAY,
      );
      if (!inside && !justLeft) candidates.push({ t, playerId });
    }
    if (candidates.length === 0) return;
    const { t, playerId } = candidates[Math.floor(Math.random() * candidates.length)];
    await insertInput(ctx, world._id, 'createAgent', {
      travelerId: t.travelerId,
      name: t.name,
      character: t.character,
      identity:
        `${t.name} is a traveler spending the afternoon at Nomad Café, a small café where travelers meet. ` +
        `${t.personality} Appearance: ${t.appearance}`,
      plan: 'You are relaxing at the café and enjoy easy small talk with other guests. Now and then you share a travel memory or ask where someone has been.',
      playerId,
    });
  },
});

function describe(s: Story) {
  const extras = [
    s.interesting_things,
    s.artifact && `You still have: ${s.artifact}.`,
    s.emotion && `It made you feel ${s.emotion}.`,
  ]
    .filter(Boolean)
    .join(' ');
  return `- ${s.destination}: ${s.what_happened}${extras ? ' ' + extras : ''}`;
}

// The part of a traveler's prompt about their travel stories: the ones not yet
// shared at the café, and the ones already shared, which they shouldn't retell.
export function storyPrompt(traveler: Doc<'travelers'> | null): string[] {
  if (!traveler) return [];
  const told = traveler.stories.filter((s) => traveler.told.includes(s.id));
  const untold = traveler.stories.filter((s) => !traveler.told.includes(s.id));
  const prompt = [];
  if (untold.length > 0) {
    prompt.push(
      `Your travel memories you haven't shared at the café yet (share at most one, and only if it fits):`,
      ...untold.map(describe),
    );
  } else {
    prompt.push(
      `You've already shared all your travel memories here. Stick to small talk and ask others about their trips.`,
    );
  }
  prompt.push(
    `These are your only trips. Never make up other places you've been or claim someone else's trip.`,
  );
  if (told.length > 0) {
    prompt.push(
      `Memories you already told on earlier visits. Do not retell them; at most mention a small detail in passing:`,
      ...told.map((s) => `- ${s.destination}`),
    );
  }
  return prompt;
}

// Small words that don't identify a destination on their own.
const COMMON_WORDS = new Set(['the', 'del', 'de', 'la', 'le', 'lake', 'island', 'city', 'mount']);

// Stories a traveler told in their messages, judged by whether a word from the
// destination appears ("Kyoto", "Baikal", "Morocco").
export function storiesMentioned(traveler: Doc<'travelers'>, texts: string[]) {
  const said = texts.join(' ').toLowerCase();
  return traveler.stories
    .filter((s) =>
      s.destination
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length >= 3 && !COMMON_WORDS.has(w))
        .some((w) => {
          const word = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`(^|[^\\p{L}])${word}($|[^\\p{L}])`, 'u').test(said);
        }),
    )
    .map((s) => s.id);
}
