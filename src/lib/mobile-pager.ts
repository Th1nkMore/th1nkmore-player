export type GestureAxis = "horizontal" | "vertical" | null;

const AXIS_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_INTENT_RATIO = 1.15;
const EDGE_RESISTANCE = 0.28;
const MIN_SWIPE_DISTANCE = 48;
const MAX_SWIPE_DISTANCE = 96;
const SWIPE_DISTANCE_RATIO = 0.18;
const SWIPE_VELOCITY = 0.45;

export function getGestureAxis(deltaX: number, deltaY: number): GestureAxis {
  const absoluteX = Math.abs(deltaX);
  const absoluteY = Math.abs(deltaY);

  if (
    Math.max(absoluteX, absoluteY) < AXIS_ACTIVATION_DISTANCE ||
    absoluteX === absoluteY
  ) {
    return null;
  }

  if (absoluteX > absoluteY * HORIZONTAL_INTENT_RATIO) return "horizontal";
  if (absoluteY > absoluteX * HORIZONTAL_INTENT_RATIO) return "vertical";
  return null;
}

export function getEdgeResistedOffset(
  activeIndex: number,
  pageCount: number,
  deltaX: number,
) {
  const isDraggingPastStart = activeIndex === 0 && deltaX > 0;
  const isDraggingPastEnd = activeIndex === pageCount - 1 && deltaX < 0;

  return isDraggingPastStart || isDraggingPastEnd
    ? deltaX * EDGE_RESISTANCE
    : deltaX;
}

type SwipeTargetOptions = {
  activeIndex: number;
  deltaX: number;
  pageCount: number;
  velocityX: number;
  viewportWidth: number;
};

export function resolveSwipeTarget({
  activeIndex,
  deltaX,
  pageCount,
  velocityX,
  viewportWidth,
}: SwipeTargetOptions) {
  const distanceThreshold = Math.min(
    Math.max(viewportWidth * SWIPE_DISTANCE_RATIO, MIN_SWIPE_DISTANCE),
    MAX_SWIPE_DISTANCE,
  );
  const hasEnoughDistance = Math.abs(deltaX) >= distanceThreshold;
  const hasEnoughVelocity = Math.abs(velocityX) >= SWIPE_VELOCITY;

  if (!(hasEnoughDistance || hasEnoughVelocity)) return activeIndex;

  const directionSignal = Math.abs(deltaX) >= 16 ? deltaX : velocityX;
  const direction = directionSignal < 0 ? 1 : -1;

  return Math.min(Math.max(activeIndex + direction, 0), pageCount - 1);
}
