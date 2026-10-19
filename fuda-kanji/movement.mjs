export const STEP_MS = 170;
export function interpolate(from, to, started, now, duration = STEP_MS) {
  const progress = Math.max(0, Math.min(1, (now - started) / duration));
  return { x: from.x + (to.x-from.x)*progress, y: from.y + (to.y-from.y)*progress, progress };
}
export function cameraFor(position, viewWidth, viewHeight, worldWidth, worldHeight) {
  return { x: Math.max(0,Math.min(worldWidth-viewWidth,position.x-viewWidth/2+.5)), y:Math.max(0,Math.min(worldHeight-viewHeight,position.y-viewHeight/2+.5)) };
}
