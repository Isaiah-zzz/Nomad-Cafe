import { seats } from '../../data/cafe';
import { distance } from '../util/geometry';
import { Point } from '../util/types';
import type { Conversation } from './conversation';
import { Game } from './game';
import { Player } from './player';

type Seat = (typeof seats)[number];

const seatAt = (p: Point) => seats.find((s) => s.x === p.x && s.y === p.y);
const across = (seat: Seat) => seats.find((s) => s.table === seat.table && s !== seat)!;

export const isAt = (player: Player, seat: Seat) =>
  player.position.x === seat.x && player.position.y === seat.y;

// Whether a player outside `pair` is sitting on or walking to `seat`.
function taken(game: Game, seat: Seat, pair: Player[]) {
  return [...game.world.players.values()].some(
    (p) =>
      !pair.includes(p) &&
      (isAt(p, seat) ||
        (p.pathfinding?.destination.x === seat.x && p.pathfinding?.destination.y === seat.y)),
  );
}

// The two chairs across a table where a conversation's pair sit to talk, as
// { [playerId]: seat }. Keeps the table the creator is on or heading to if the
// chair opposite is free, else picks the free table nearest the creator.
// Undefined when every table is taken; they then talk standing up.
export function conversationSeats(game: Game, conversation: Conversation) {
  const otherId = [...conversation.participants.keys()].find((id) => id !== conversation.creator)!;
  const creator = game.world.players.get(conversation.creator)!;
  const other = game.world.players.get(otherId)!;
  const pair = [creator, other];
  const free = (s: Seat) => !taken(game, s, pair) && !taken(game, across(s), pair);

  let seat = seatAt(creator.pathfinding?.destination ?? creator.position);
  if (!seat || !free(seat)) {
    const options = seats.filter(free);
    options.sort((a, b) => distance(a, creator.position) - distance(b, creator.position));
    seat = options[0];
  }
  if (!seat) return undefined;
  return { [creator.id]: seat, [other.id]: across(seat) };
}
