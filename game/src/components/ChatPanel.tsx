import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { GameId } from '../../convex/aiTown/ids';
import { ServerGame } from '../hooks/serverGame';

// A small side window for the clicked traveler: their current conversation as
// it happens, or their last one if they aren't talking right now.
export default function ChatPanel({
  worldId,
  game,
  playerId,
  onClose,
}: {
  worldId: Id<'worlds'>;
  game: ServerGame;
  playerId: GameId<'players'>;
  onClose: () => void;
}) {
  const name = game.playerDescriptions.get(playerId)?.name;
  const player = game.world.players.get(playerId);
  const conversation = player && game.world.playerConversation(player);
  const previous = useQuery(
    api.world.previousConversation,
    conversation ? 'skip' : { worldId, playerId },
  );
  const shown = conversation ?? previous ?? undefined;
  const messages = useQuery(
    api.messages.listMessages,
    shown ? { worldId, conversationId: shown.id } : 'skip',
  );

  const otherIds = conversation
    ? [...conversation.participants.keys()]
    : previous?.participants ?? [];
  const other = otherIds
    .filter((id) => id !== playerId)
    .map((id) => game.playerDescriptions.get(id as GameId<'players'>)?.name)[0];
  const typing =
    conversation?.isTyping && !messages?.some((m) => m.messageUuid === conversation.isTyping!.messageUuid)
      ? game.playerDescriptions.get(conversation.isTyping.playerId)?.name
      : undefined;

  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages?.length, typing]);

  let status = 'Not chatting right now';
  if (conversation && other) status = `Chatting with ${other}`;
  else if (previous && other) status = `Last chat, with ${other}`;

  return (
    <div className="absolute top-3 right-3 bottom-3 z-10 flex w-[min(20rem,calc(100%-1.5rem))] flex-col rounded-xl border border-[#3a3a3a]/30 bg-white/95 text-[#1f1f1f] shadow-lg [font-family:system-ui,sans-serif]">
      <div className="flex items-start gap-2 border-b border-[#3a3a3a]/15 px-4 py-3">
        <div className="flex-grow">
          <div className="text-base font-semibold">{name}</div>
          <div className="text-xs text-[#6b6b6b]">{status}</div>
        </div>
        <button
          className="rounded px-1 text-lg leading-none text-[#6b6b6b] hover:text-[#1f1f1f]"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-grow space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages?.map((m) => (
          <div key={m._id}>
            <div className="text-xs font-semibold text-[#6b6b6b]">{m.authorName}</div>
            <div className="leading-snug">{m.text}</div>
          </div>
        ))}
        {typing && <div className="text-xs italic text-[#6b6b6b]">{typing} is typing…</div>}
        {shown && messages?.length === 0 && !typing && (
          <div className="text-xs italic text-[#6b6b6b]">Saying hello…</div>
        )}
        <div ref={bottom} />
      </div>
    </div>
  );
}
