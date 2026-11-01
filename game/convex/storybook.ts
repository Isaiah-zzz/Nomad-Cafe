import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import { conversationId, playerId } from './aiTown/ids';
import { storiesMentioned } from './travelers';
import { chatCompletion } from './util/llm';

// The café's storybook: when a conversation ends, the LLM gives it a short
// title and summary. The full transcript stays in the messages table. This is
// also where we note which travel stories each traveler has now told.

export const write = internalAction({
  args: { worldId: v.id('worlds'), conversationId },
  handler: async (ctx, args) => {
    const { messages, participants } = await ctx.runQuery(internal.storybook.load, args);
    if (messages.length === 0) return;
    const names = participants.map((p) => p.name).join(' and ');
    const transcript = messages.map((m) => `${m.authorName}: ${m.text}`).join('\n');

    let title = names;
    let summary = messages[0].text;
    try {
      const { content } = await chatCompletion({
        messages: [
          {
            role: 'system',
            content:
              `You keep the storybook of Nomad Café, where travelers chat. Read the conversation between ${names}, ` +
              'then reply with JSON: {"title": a title of at most 6 words, "summary": one or two sentences in past tense ' +
              'about what they talked about and any travel memory that was shared}.',
          },
          { role: 'user', content: transcript },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 150,
      });
      const parsed = JSON.parse(content);
      if (typeof parsed.title === 'string' && parsed.title.trim()) title = parsed.title.trim();
      if (typeof parsed.summary === 'string' && parsed.summary.trim()) summary = parsed.summary.trim();
    } catch (e: any) {
      console.warn(`Storybook summary failed, using the first line instead: ${e.message}`);
    }

    const told = participants.flatMap((p) =>
      p.traveler
        ? [
            {
              travelerId: p.traveler.travelerId,
              storyIds: storiesMentioned(
                p.traveler,
                messages.filter((m) => m.author === p.playerId).map((m) => m.text),
              ),
            },
          ]
        : [],
    );
    await ctx.runMutation(internal.storybook.save, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      participants: participants.map(({ playerId, name }) => ({ playerId, name })),
      title,
      summary,
      told,
    });
  },
});

export const load = internalQuery({
  args: { worldId: v.id('worlds'), conversationId },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) =>
        q.eq('worldId', args.worldId).eq('conversationId', args.conversationId),
      )
      .collect();
    const descriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const nameOf = (id: string) => descriptions.find((d) => d.playerId === id)?.name ?? 'Someone';
    const participants = [];
    for (const id of new Set(messages.map((m) => m.author))) {
      const travelerId = descriptions.find((d) => d.playerId === id)?.travelerId;
      const traveler = travelerId
        ? await ctx.db
            .query('travelers')
            .withIndex('travelerId', (q) => q.eq('travelerId', travelerId))
            .first()
        : null;
      participants.push({ playerId: id, name: nameOf(id), traveler });
    }
    return {
      messages: messages.map((m) => ({ author: m.author, authorName: nameOf(m.author), text: m.text })),
      participants,
    };
  },
});

export const save = internalMutation({
  args: {
    worldId: v.id('worlds'),
    conversationId,
    participants: v.array(v.object({ playerId, name: v.string() })),
    title: v.string(),
    summary: v.string(),
    told: v.array(v.object({ travelerId: v.string(), storyIds: v.array(v.string()) })),
  },
  handler: async (ctx, { told, ...entry }) => {
    await ctx.db.insert('storybook', { ...entry, ended: Date.now() });
    for (const { travelerId, storyIds } of told) {
      const traveler = await ctx.db
        .query('travelers')
        .withIndex('travelerId', (q) => q.eq('travelerId', travelerId))
        .first();
      if (traveler && storyIds.some((id) => !traveler.told.includes(id))) {
        await ctx.db.patch(traveler._id, { told: [...new Set([...traveler.told, ...storyIds])] });
      }
    }
  },
});

// Storybook entries that ended after `since` (the start of the viewer's day), newest first.
export const list = query({
  args: { worldId: v.id('worlds'), since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('storybook')
      .withIndex('ended', (q) => q.eq('worldId', args.worldId).gte('ended', args.since))
      .order('desc')
      .collect();
  },
});
