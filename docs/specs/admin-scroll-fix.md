# Admin Scroll Fix

## Goal

Restore reliable scrolling in the admin upload and playlist workspaces across desktop and mobile layouts.

## Findings

- The admin shell constrained its body with `overflow-hidden` without consistently propagating `min-h-0`.
- The upload workspace wrapped the whole page in a custom `ScrollArea`, which made the main form prone to losing scroll on some browsers and viewport sizes.
- The playlist workspace mixed nested scroll containers without explicit flex height constraints, which could trap scroll in the wrong pane.

## Fixes

- Added `min-h-0` to the admin shell body containers so child workspaces can shrink and scroll correctly.
- Replaced the upload workspace's top-level custom scroll container with a native scrolling content area.
- Tightened playlist list/detail drawer sizing with explicit `min-h-0` and flex-aware scroll regions.

## Checklist

- [x] Fix admin shell height propagation
- [x] Fix upload workspace scrolling
- [x] Fix playlist pane and drawer scrolling
- [x] Re-run validation
