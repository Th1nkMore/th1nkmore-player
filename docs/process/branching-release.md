# Branching And Release Flow

## Branch Roles

- `main`: stable mainline branch for accepted code
- `live`: deployment branch used for actual release
- `dev`: integration and acceptance branch
- `feat/*`: short-lived feature branches created from `dev`

## Required Workflow

1. Start from the latest `dev`
2. Create a feature branch using the `feat/*` naming convention
3. Complete the feature in isolation
4. Perform independent acceptance for that branch
5. Merge the accepted feature branch back into `dev`
6. Periodically verify the integrated state on `dev`
7. Merge validated `dev` into `main`
8. Sync `live` after `main` is confirmed ready for deployment

## Rules

- Do not branch new features directly from `main`
- Do not merge unfinished work into `dev`
- Keep each `feat/*` branch scoped to one coherent unit of acceptance
- Treat `dev` as the place for integration verification, not long-lived unreviewed experimentation
- Treat `live` as a release artifact branch rather than a daily development branch

## Suggested Naming

- `feat/docs-foundation`
- `feat/library-classification`
- `feat/admin-recording-shell`
- `feat/export-mp3-foundation`
- `feat/lyrics-workflow`
- `feat/cicd-foundation`

## Acceptance Checklist

- Feature scope is complete and coherent
- Core user flow has been manually verified
- Relevant build, lint, type-check, and tests are run as appropriate
- Documentation is updated when behavior or process changes
- Merge target remains `dev` until integrated validation is complete

## Release Rhythm

The intended cadence is:

- Frequent feature work on `feat/*`
- Periodic integration and acceptance on `dev`
- Less frequent promotion from `dev` to `main`
- Deployment sync from `main` to `live`

This keeps feature work isolated while preserving a stable path to release.
