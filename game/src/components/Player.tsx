import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { Player as ServerPlayer } from '../../convex/aiTown/player.ts';
import { GameId } from '../../convex/aiTown/ids.ts';
import { Id } from '../../convex/_generated/dataModel';
import { Location, locationFields, playerLocation } from '../../convex/aiTown/location.ts';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';
import { PlayerDescription } from '../../convex/aiTown/playerDescription.ts';
import { WorldMap } from '../../convex/aiTown/worldMap.ts';
import { ServerGame } from '../hooks/serverGame.ts';
import { seats } from '../../data/cafe';

export type SelectElement = (element?: { kind: 'player'; id: GameId<'players'> }) => void;

const logged = new Set<string>();

export const Player = ({
  game,
  isViewer,
  player,
  onClick,
  historicalTime,
}: {
  game: ServerGame;
  isViewer: boolean;
  player: ServerPlayer;

  onClick: SelectElement;
  historicalTime?: number;
}) => {
  const playerCharacter = game.playerDescriptions.get(player.id)?.character;
  if (!playerCharacter) {
    throw new Error(`Player ${player.id} has no character`);
  }
  const character = characters.find((c) => c.name === playerCharacter);

  const locationBuffer = game.world.historicalLocations?.get(player.id);
  const historicalLocation = useHistoricalValue<Location>(
    locationFields,
    historicalTime,
    playerLocation(player),
    locationBuffer,
  );
  if (!character) {
    if (!logged.has(playerCharacter)) {
      logged.add(playerCharacter);
      toast.error(`Unknown character ${playerCharacter}`);
    }
    return null;
  }

  if (!historicalLocation) {
    return null;
  }

  // "..." over everyone who's chatting; the words are in the side panel.
  const isSpeaking = [...game.world.conversations.values()].some(
    (c) => c.participants.get(player.id)?.status.kind === 'participating',
  );
  // Guests leave their cup behind when they head out.
  const agent = [...game.world.agents.values()].find((a) => a.playerId === player.id);
  const coffee = agent?.leaving ? undefined : agent?.coffee;
  const isMoving = historicalLocation.speed > 0;
  const seat = isMoving
    ? undefined
    : seats.find((s) => s.x === historicalLocation.x && s.y === historicalLocation.y);
  const tileDim = game.worldMap.tileDim;
  const historicalFacing = { dx: historicalLocation.dx, dy: historicalLocation.dy };
  return (
    <>
      <Character
        x={historicalLocation.x * tileDim + tileDim / 2}
        y={historicalLocation.y * tileDim + tileDim / 2}
        orientation={orientationDegrees(historicalFacing)}
        isMoving={isMoving}
        seated={'sitSpritesheetData' in character ? seat?.facing : undefined}
        isSpeaking={isSpeaking}
        coffee={coffee}
        isViewer={isViewer}
        textureUrl={character.textureUrl}
        spritesheetData={character.spritesheetData}
        sitTextureUrl={'sitTextureUrl' in character ? character.sitTextureUrl : undefined}
        sitSpritesheetData={'sitSpritesheetData' in character ? character.sitSpritesheetData : undefined}
        speed={character.speed}
        onClick={() => {
          onClick({ kind: 'player', id: player.id });
        }}
      />
    </>
  );
};
