# Mobile Swipe Navigation

## Status

Implemented on `codex/mobile-swipe-pager` and refined on `codex/bottom-nav-swipe`; automated and responsive-browser checks complete, with physical touch-device acceptance pending.

## Goal

Allow mobile users to move naturally between Lyrics, Songs, and Info with a horizontal swipe while preserving the existing bottom navigation as a complete and discoverable control.

## Page Order

```text
Lyrics  <->  Songs  <->  Info
```

The current mobile tab state remains the source of truth. Tapping a bottom-navigation item and completing a swipe must update the same state.

## Interaction Model

- Render the three pages in one horizontal pager
- Keep pages mounted so lyrics position, library search, filters, queue state, and story reading position survive navigation
- Begin swipe navigation only when a drag starts inside the persistent bottom navigation
- Let the page follow the pointer while the accepted bottom-navigation drag is active
- Resolve to the adjacent page based on deliberate distance or velocity
- Move at most one page per gesture
- Add restrained edge resistance at Lyrics and Info; do not wrap
- Use an interruptible spring with zero bounce for settling

## Gesture Arbitration

The content area never begins page navigation. Lyrics, library lists, playback controls, horizontal playback sequence, filter chips, drawers, sheets, and information content keep their native gestures without pager arbitration.

The bottom navigation is the sole swipe trigger. It continues to support direct taps and suppresses the button click only after a horizontal drag has been accepted.

Use axis locking:

- Preserve vertical scrolling until horizontal intent is clear
- Cancel page navigation when vertical movement dominates
- Do not call `preventDefault` before the pager has accepted the gesture

## Layout Rules

- The bottom navigation remains visible and synchronized
- Mini-player and full-player-sheet behavior remains unchanged
- Each page occupies the usable viewport between the header, mini-player, and bottom navigation
- Horizontal translation must not cause body overflow or expose the page background
- Mobile landscape may retain its specialized layout unless acceptance shows that the pager improves it without reducing lyric space

## Motion And Performance

- Use compositor-friendly translation only during the drag
- Avoid `transition: all`
- Do not keep permanent `will-change` without evidence of first-frame stutter
- Reduced-motion mode may use a short fade or immediate switch instead of a full sliding transition
- Do not animate all page contents during every navigation; the pager movement is sufficient

## Accessibility

- Swiping is an enhancement, not the only navigation mechanism
- Bottom-navigation buttons retain their labels, active state, and minimum 40px targets
- Keyboard and assistive technology users can change pages without gesture emulation
- Programmatic page changes move focus only when required by a user action; do not steal focus during passive state updates
- Hidden off-screen pages must not create confusing tab stops or duplicate landmarks

## Acceptance Checklist

- [x] Horizontal swipes resolve to Lyrics, Songs, and Info in the expected direction
- [x] Content-area gestures cannot start page navigation
- [x] Playback sequence, filter chips, sliders, and media controls are outside pager gesture capture
- [ ] Bottom-navigation swiping is accepted on a physical touch device
- [x] The bottom navigation and pager share one active-tab state
- [x] Page-local state survives round trips because all pages remain mounted
- [x] Edge gestures use resistance and cannot wrap into blank content
- [x] Reduced-motion switches page transitions to immediate settling
- [ ] Mobile portrait is accepted at narrow widths and with safe-area insets on a physical touch device
- [x] Mobile landscape retains its existing specialized layout
