import { describe, expect, it } from "vitest";
import {
  getEdgeResistedOffset,
  getGestureAxis,
  resolveSwipeTarget,
} from "@/lib/mobile-pager";

describe("mobile pager gestures", () => {
  it("waits for clear movement before locking an axis", () => {
    expect(getGestureAxis(4, 2)).toBeNull();
    expect(getGestureAxis(10, 10)).toBeNull();
    expect(getGestureAxis(11, 10)).toBeNull();
  });

  it("locks horizontal and vertical intent independently", () => {
    expect(getGestureAxis(18, 6)).toBe("horizontal");
    expect(getGestureAxis(6, 18)).toBe("vertical");
  });

  it("changes one adjacent page after a deliberate drag", () => {
    expect(
      resolveSwipeTarget({
        activeIndex: 1,
        deltaX: -80,
        pageCount: 3,
        velocityX: -0.2,
        viewportWidth: 390,
      }),
    ).toBe(2);
    expect(
      resolveSwipeTarget({
        activeIndex: 1,
        deltaX: 80,
        pageCount: 3,
        velocityX: 0.2,
        viewportWidth: 390,
      }),
    ).toBe(0);
  });

  it("uses velocity for a short intentional flick", () => {
    expect(
      resolveSwipeTarget({
        activeIndex: 1,
        deltaX: -20,
        pageCount: 3,
        velocityX: -0.6,
        viewportWidth: 390,
      }),
    ).toBe(2);
  });

  it("settles back after an indecisive gesture", () => {
    expect(
      resolveSwipeTarget({
        activeIndex: 1,
        deltaX: 30,
        pageCount: 3,
        velocityX: 0.2,
        viewportWidth: 390,
      }),
    ).toBe(1);
  });

  it("never skips a page or wraps at an edge", () => {
    expect(
      resolveSwipeTarget({
        activeIndex: 0,
        deltaX: -600,
        pageCount: 3,
        velocityX: -2,
        viewportWidth: 390,
      }),
    ).toBe(1);
    expect(
      resolveSwipeTarget({
        activeIndex: 0,
        deltaX: 600,
        pageCount: 3,
        velocityX: 2,
        viewportWidth: 390,
      }),
    ).toBe(0);
    expect(
      resolveSwipeTarget({
        activeIndex: 2,
        deltaX: -600,
        pageCount: 3,
        velocityX: -2,
        viewportWidth: 390,
      }),
    ).toBe(2);
  });

  it("applies restrained resistance only beyond the outer pages", () => {
    expect(getEdgeResistedOffset(0, 3, 100)).toBeCloseTo(28);
    expect(getEdgeResistedOffset(2, 3, -100)).toBeCloseTo(-28);
    expect(getEdgeResistedOffset(1, 3, 100)).toBe(100);
  });
});
