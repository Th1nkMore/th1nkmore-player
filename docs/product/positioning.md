# Sonic IDE Positioning

## Product Summary

Sonic IDE is a personal music portfolio and personal player wrapped in an IDE-like interface.

It is not only a showcase site for original work. It is also a daily-use listening product for the owner. The IDE metaphor is the interaction language, while the real product category remains a music player.

## Core Identity

- A portfolio for self-created songs and audio works
- A personal player for other songs the owner uploads for private listening
- A stylized interface where songs behave like files, lyrics behave like editor content, and playback behaves like a runtime terminal

## Library Model

The music library contains two broad content sources:

1. Portfolio tracks uploaded and managed by the owner
2. Other songs the owner wants to hear inside the same player

From a product perspective, both are first-class library items. The distinction matters for metadata, permissions, sourcing, future filtering, and management workflows.

## Admin Role

The owner acts as an administrator with elevated capabilities. Over time, the admin area should support:

- Uploading songs and maintaining the library
- Editing metadata and playlists
- Fetching and managing lyrics
- Recording audio directly in the product
- Exporting recordings or managed tracks to MP3
- Exporting to additional formats later

## Non-Goals For Now

- Multi-user collaboration
- Public marketplace behavior
- Fine-grained copyright workflow design
- A full DAW-style music production environment

## Product Principles

- Player first: every new feature should reinforce listening and audio management
- Portfolio aware: original works should remain easy to highlight and curate
- Single owner workflow: admin operations should optimize for one trusted operator
- IDE language, not IDE burden: the interface can feel like a development environment without becoming confusing or overly technical
