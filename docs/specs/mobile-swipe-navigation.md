# Mobile Swipe Navigation

## Status

Product semantics accepted; implementation not started.

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
- Let the page follow the pointer during a valid horizontal drag
- Resolve to the adjacent page based on deliberate distance or velocity
- Move at most one page per gesture
- Add restrained edge resistance at Lyrics and Info; do not wrap
- Use an interruptible spring with zero bounce for settling

## Gesture Arbitration

Do not begin a page swipe when the gesture originates from:

- Playback progress or volume controls
- The horizontal playback-sequence strip
- Album or tag chip scrollers
- Other intentional horizontal scrolling regions
- A drawer, sheet, or open modal
- Interactive media controls that already own the gesture

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

- [ ] Horizontal swipes switch Lyrics, Songs, and Info in the expected direction
- [ ] Vertical lyrics and library scrolling remain reliable
- [ ] Playback sequence and filter-chip scrolling do not change pages
- [ ] Sliders and media controls retain their gestures
- [ ] The bottom navigation and pager never disagree
- [ ] Page-local state survives round trips
- [ ] Edge gestures do not wrap or overscroll into blank content
- [ ] Reduced-motion behavior is available
- [ ] Mobile portrait works at narrow widths and with safe-area insets
- [ ] Landscape behavior is explicitly accepted rather than changed accidentally
