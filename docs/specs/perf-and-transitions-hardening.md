# Perf And Transitions Hardening

## Goal

Reduce perceived load cost on `music.th1nkmore.space` and improve panel-switch feedback without changing the existing IDE-style visual language.

## Lighthouse Baseline

- Date: 2026-04-23
- URL: `https://music.th1nkmore.space`
- Performance: `78`
- FCP: `1.4s`
- LCP: `4.0s`
- TBT: `70ms`
- Speed Index: `8.9s`

## Findings

- The locale home route was forced dynamic, which prevented static caching for the main shell.
- The locale layout was also forced dynamic, which kept `/en`, `/zh`, `/ja`, `/de` server-rendered instead of prerendered.
- The playlist API and client cache TTL were shorter than necessary for a mostly static listening surface.
- Explorer, lyrics editor, and inspector panel switches had no visible loading or transition affordance.

## Checklist

- [x] Remove unnecessary forced dynamic rendering from the locale home route
- [x] Add route-level loading fallback for the main IDE shell
- [x] Extend playlist cache strategy on the API and client
- [x] Add lightweight panel transition overlay and motion for explorer/editor/inspector switches
- [x] Localize newly added transition feedback copy
- [x] Re-run validation and verify deployment behavior
