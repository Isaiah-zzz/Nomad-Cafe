import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc, Id } from '../../convex/_generated/dataModel';

// Every conversation that ended today, newest first: a title and summary, with
// the full conversation one click away.
export default function Storybook() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const [startOfToday] = useState(() => new Date().setHours(0, 0, 0, 0));
  const entries = useQuery(
    api.storybook.list,
    worldStatus ? { worldId: worldStatus.worldId, since: startOfToday } : 'skip',
  );
  return (
    <div className="[font-family:system-ui,sans-serif] text-[#1f1f1f]">
      <h2 className="text-lg font-semibold">Storybook</h2>
      <p className="mb-4 text-xs text-[#6b6b6b]">Stories shared at the café today</p>
      {entries?.length === 0 && (
        <p className="text-sm italic text-[#6b6b6b]">
          Nothing yet. Stories appear here as travelers finish their conversations.
        </p>
      )}
      <div className="space-y-3">
        {entries?.map((e) => <Entry key={e._id} entry={e} />)}
      </div>
    </div>
  );
}

function Entry({ entry }: { entry: Doc<'storybook'> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[#3a3a3a]/15 px-3 py-2">
      <div className="text-sm font-semibold">{entry.title}</div>
      <div className="text-xs text-[#6b6b6b]">
        {entry.participants.map((p) => p.name).join(' & ')} ·{' '}
        {new Date(entry.ended).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </div>
      <p className="mt-1 text-sm leading-snug">{entry.summary}</p>
      <button className="mt-1 text-xs text-[#6b6b6b] underline" onClick={() => setOpen(!open)}>
        {open ? 'Hide conversation' : 'Read the conversation'}
      </button>
      {open && <Transcript worldId={entry.worldId} conversationId={entry.conversationId} />}
    </div>
  );
}

function Transcript(props: { worldId: Id<'worlds'>; conversationId: string }) {
  const messages = useQuery(api.messages.listMessages, props);
  return (
    <div className="mt-2 space-y-2 border-t border-[#3a3a3a]/10 pt-2 text-sm">
      {messages?.map((m) => (
        <div key={m._id}>
          <span className="font-semibold">{m.authorName}: </span>
          {m.text}
        </div>
      ))}
    </div>
  );
}
