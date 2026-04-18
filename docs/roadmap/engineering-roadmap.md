# Engineering And Performance Roadmap

## CI/CD

- Add automated install, lint, type-check, test, and build validation
- Define promotion gates for `feat/*`, `dev`, `main`, and `live`
- Make deployment synchronization to `live` explicit and repeatable

## Quality Gates

- Keep type-check required for merge readiness
- Reduce existing lint debt so lint can become a reliable merge gate
- Expand test coverage around audio state, admin APIs, and lyrics workflows

## Performance

- Improve first-screen rendering performance
- Reduce unnecessary client work during initial load
- Review audio asset loading strategy, caching, and metadata fetch behavior
- Measure and optimize lyrics rendering and heavy player UI interactions

## Backend Evolution

- Formalize media-processing responsibilities
- Prepare for export and recording pipelines
- Strengthen storage and asset URL management

## Observability

- Add clearer operational logs for admin actions and failed media workflows
- Prepare for runtime monitoring and error reporting once deployment flow is stabilized

## Delivery Order

1. Branching and release process baseline
2. CI validation basics
3. Lint debt reduction where it blocks automation
4. Performance measurement and top bottleneck fixes
5. Media-processing improvements for recording and export
