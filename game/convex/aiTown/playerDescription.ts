import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, playerId } from './ids';

export const serializedPlayerDescription = {
  playerId,
  name: v.string(),
  description: v.string(),
  character: v.string(),
  // The Nomad-Cafe customer this player is, if any.
  travelerId: v.optional(v.string()),
};
export type SerializedPlayerDescription = ObjectType<typeof serializedPlayerDescription>;

export class PlayerDescription {
  playerId: GameId<'players'>;
  name: string;
  description: string;
  character: string;
  travelerId?: string;

  constructor(serialized: SerializedPlayerDescription) {
    const { playerId, name, description, character, travelerId } = serialized;
    this.playerId = parseGameId('players', playerId);
    this.name = name;
    this.description = description;
    this.character = character;
    this.travelerId = travelerId;
  }

  serialize(): SerializedPlayerDescription {
    const { playerId, name, description, character, travelerId } = this;
    return {
      playerId,
      name,
      description,
      character,
      travelerId,
    };
  }
}
