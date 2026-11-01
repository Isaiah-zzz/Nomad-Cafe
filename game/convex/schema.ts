import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  // Travelers synced from the Nomad-Cafe backend (see travelers.ts). `told`
  // lists the ids of stories they've already shared at the café.
  travelers: defineTable({
    travelerId: v.string(),
    name: v.string(),
    personality: v.string(),
    appearance: v.string(),
    character: v.string(),
    stories: v.array(
      v.object({
        id: v.string(),
        destination: v.string(),
        what_happened: v.string(),
        interesting_things: v.optional(v.string()),
        artifact: v.optional(v.string()),
        emotion: v.optional(v.string()),
        pictures: v.optional(v.array(v.string())),
      }),
    ),
    told: v.array(v.string()),
    // How they talk, written by the LLM from their personality (see travelers.ts).
    voice: v.optional(
      v.object({
        style: v.string(),
        length: v.union(v.literal('short'), v.literal('medium')),
        examples: v.array(v.string()),
        // The personality text this voice was made from, to know when to redo it.
        basedOn: v.string(),
      }),
    ),
  }).index('travelerId', ['travelerId']),

  // One entry per finished conversation (see storybook.ts).
  storybook: defineTable({
    worldId: v.id('worlds'),
    conversationId,
    participants: v.array(v.object({ playerId, name: v.string() })),
    title: v.string(),
    summary: v.string(),
    ended: v.number(),
  }).index('ended', ['worldId', 'ended']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
