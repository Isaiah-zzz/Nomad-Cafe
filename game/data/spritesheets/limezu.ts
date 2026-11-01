import { Frame, SpritesheetData } from './types';

// LimeZu Modern Interiors "<Name>_run_16x16.png" sheets: one row of 24
// 16x32 frames, 6 per direction in the order right, up, left, down.
// meta.scale 0.5 draws them at 2x so they match the café's 32px tiles.
const DIRECTIONS = ['right', 'up', 'left', 'down'];
const FRAMES_PER_DIRECTION = 6;

const frames: Record<string, Frame> = {};
const animations: Record<string, string[]> = {};
DIRECTIONS.forEach((dir, d) => {
  animations[dir] = [];
  for (let i = 0; i < FRAMES_PER_DIRECTION; i++) {
    const name = `${dir}${i}`;
    frames[name] = {
      frame: { x: (d * FRAMES_PER_DIRECTION + i) * 16, y: 0, w: 16, h: 32 },
      sourceSize: { w: 16, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    };
    animations[dir].push(name);
  }
});

export const data: SpritesheetData = {
  frames,
  animations,
  meta: { scale: '0.5' },
};

// "<Name>_sit2_16x16.png" (seated on a chair, legs forward): 12 slots 32px
// wide, 6 idle frames facing right then 6 facing left. The figure is offset within each slot, so crop 16px around it.
const sitFrames: Record<string, Frame> = {};
const sitAnimations: Record<string, string[]> = { right: [], left: [] };
(['right', 'left'] as const).forEach((dir, d) => {
  for (let i = 0; i < FRAMES_PER_DIRECTION; i++) {
    const name = `sit_${dir}${i}`;
    sitFrames[name] = {
      frame: { x: (d * FRAMES_PER_DIRECTION + i) * 32 + (dir === 'right' ? 6 : 10), y: 0, w: 16, h: 32 },
      sourceSize: { w: 16, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    };
    sitAnimations[dir].push(name);
  }
});

export const sitData: SpritesheetData = {
  frames: sitFrames,
  animations: sitAnimations,
  meta: { scale: '0.5' },
};
