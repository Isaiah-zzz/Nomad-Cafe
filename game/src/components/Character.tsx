import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedSprite, Container, Graphics, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';

const cupTexture = PIXI.Texture.from('/ai-town/assets/coffee/cup.png', {
  scaleMode: PIXI.SCALE_MODES.NEAREST,
});

export const Character = ({
  textureUrl,
  spritesheetData,
  sitTextureUrl,
  sitSpritesheetData,
  seated,
  x,
  y,
  orientation,
  isMoving = false,
  isSpeaking = false,
  coffee,
  isViewer = false,
  speed = 0.1,
  onClick,
}: {
  // Path to the texture packed image.
  textureUrl: string;
  // The data for the spritesheet.
  spritesheetData: ISpritesheetData;
  // Optional sitting sheet with 'left' and 'right' idle animations.
  sitTextureUrl?: string;
  sitSpritesheetData?: ISpritesheetData;
  // Which way the character faces while sitting on a chair, if seated.
  seated?: 'left' | 'right';
  // The pose of the NPC.
  x: number;
  y: number;
  orientation: number;
  isMoving?: boolean;
  // Shows a "..." bubble while they're in a conversation.
  isSpeaking?: boolean;
  // Waiting for a coffee at the counter shows a cup in a bubble; once served
  // they carry the cup, and set it on the table when they sit.
  coffee?: 'waiting' | 'served';
  // Highlights the player.
  isViewer?: boolean;
  // The speed of the animation. Can be tuned depending on the side and speed of the NPC.
  speed?: number;
  onClick: () => void;
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  const [sitSheet, setSitSheet] = useState<Spritesheet>();
  useEffect(() => {
    const parseSheet = async (
      url: string,
      data: ISpritesheetData,
      set: (sheet: Spritesheet) => void,
    ) => {
      const sheet = new Spritesheet(
        BaseTexture.from(url, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        }),
        data,
      );
      await sheet.parse();
      set(sheet);
    };
    void parseSheet(textureUrl, spritesheetData, setSpriteSheet);
    if (sitTextureUrl && sitSpritesheetData) {
      void parseSheet(sitTextureUrl, sitSpritesheetData, setSitSheet);
    }
  }, []);

  // The first "left" is "right" but reflected.
  const roundedOrientation = Math.floor(orientation / 90);
  const direction = ['right', 'down', 'left', 'up'][roundedOrientation];

  // Prevents the animation from stopping when the texture changes
  // (see https://github.com/pixijs/pixi-react/issues/359)
  const ref = useRef<PIXI.AnimatedSprite | null>(null);
  const isSitting = !!seated && !!sitSheet;
  useEffect(() => {
    if (isMoving || isSitting) {
      ref.current?.play();
    }
  }, [direction, isMoving, isSitting]);

  if (!spriteSheet) return null;

  // Tall sprites (LimeZu, 32x64) stand with their feet near the bottom of the
  // tile; square ones are centered. headY is the top of the head relative to
  // the tile center (LimeZu frames have ~20px of empty space above the head).
  const frame0 = spriteSheet.animations[direction][0];
  const tall = frame0.height > frame0.width;
  const anchorY = tall ? 1 - 14 / frame0.height : 0.5;
  const headY = tall ? -frame0.height * anchorY + 20 : -16;
  // Seated: hips on the chair seat (sprite top 48px above the tile center),
  // nudged 4px toward the table so the chair back shows behind them.
  const sitX = seated === 'right' ? 4 : -4;
  const sitAnchorY = 48 / frame0.height;

  let blockOffset = { x: 0, y: 0 };
  switch (roundedOrientation) {
    case 2:
      blockOffset = { x: -20, y: 0 };
      break;
    case 0:
      blockOffset = { x: 20, y: 0 };
      break;
    case 3:
      blockOffset = { x: 0, y: -20 };
      break;
    case 1:
      blockOffset = { x: 0, y: 20 };
      break;
  }

  const cup =
    coffee !== 'served'
      ? undefined
      : isSitting
      ? { x: seated === 'right' ? 22 : -22, y: -6 }
      : { x: direction === 'left' ? -10 : 10, y: -4 };
  // Walking away from us, the cup is hidden behind them.
  const cupBehind = !isSitting && direction === 'up';

  return (
    <Container x={x} y={y} interactive={true} pointerdown={onClick} cursor="pointer">
      {isViewer && <ViewerIndicator />}
      {cup && cupBehind && <Sprite texture={cupTexture} anchor={0.5} {...cup} />}
      <AnimatedSprite
        ref={ref}
        isPlaying={isMoving || isSitting}
        textures={isSitting ? sitSheet.animations[seated] : spriteSheet.animations[direction]}
        animationSpeed={isSitting ? speed / 3 : speed}
        x={isSitting ? sitX : 0}
        anchor={{ x: 0.5, y: isSitting ? sitAnchorY : anchorY }}
      />
      {cup && !cupBehind && <Sprite texture={cupTexture} anchor={0.5} {...cup} />}
      {isSpeaking && <TypingBubble bottom={headY - 4} />}
      {coffee === 'waiting' && <CupBubble bottom={headY - 4} />}
    </Container>
  );
};

function ViewerIndicator() {
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0xffff0b, 0.5);
    g.drawRoundedRect(-10, 10, 20, 10, 100);
    g.endFill();
  }, []);

  return <Graphics draw={draw} />;
}

// A small "..." bubble over someone in a conversation.
function TypingBubble({ bottom }: { bottom: number }) {
  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      g.lineStyle(1, 0x3a3a3a, 0.6);
      g.beginFill(0xffffff, 0.95);
      g.drawRoundedRect(-11, bottom - 15, 22, 11, 5);
      g.endFill();
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.95);
      g.drawPolygon([-3, bottom - 4.5, 3, bottom - 4.5, 0, bottom]);
      g.endFill();
      g.beginFill(0x3a3a3a);
      for (const dx of [-5, 0, 5]) g.drawRect(dx - 1, bottom - 10.5, 2, 2);
      g.endFill();
    },
    [bottom],
  );
  return <Graphics draw={draw} />;
}

// A bubble with a cup over someone waiting for their coffee.
function CupBubble({ bottom }: { bottom: number }) {
  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      g.lineStyle(1, 0x3a3a3a, 0.6);
      g.beginFill(0xffffff, 0.95);
      g.drawRoundedRect(-13, bottom - 20, 26, 16, 5);
      g.endFill();
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.95);
      g.drawPolygon([-3, bottom - 4.5, 3, bottom - 4.5, 0, bottom]);
      g.endFill();
    },
    [bottom],
  );
  return (
    <>
      <Graphics draw={draw} />
      <Sprite texture={cupTexture} anchor={0.5} x={1} y={bottom - 12} />
    </>
  );
}
