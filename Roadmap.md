# JSON Debugger Roadmap & Release Board

A developer-first timeline for the JSON Debugger extension.

## Release Milestones

| Version | Status | Milestone Focus | Target Date |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | Shipped | Initial Production Release & Core Parser | May 2026 |
| **v2.0.0** | Shipped | DevTools Panel, Code Gen, Diff & Decoder | July 2026 |
| **v3.0.0** | Planned | Cloud Sync & Custom Rule Engine | Q4 2026 |

---

## Version 2.0.0 (Major Release - Shipped July 2026)

- [x] **Chrome DevTools Panel Integration**: Real-time network HAR request log inspection directly in F12 DevTools.
- [x] **Multi-Language Code Generator**: Export JSON payloads to TypeScript, Zod, Go, and Python Pydantic models.
- [x] **Side-by-Side Visual Diff Tool**: Color-coded line-by-line payload comparison (Added, Removed, Modified, Unchanged).
- [x] **Smart JWT & Base64 Decoder**: Auto-detect and decode JWT tokens and Base64-encoded strings.
- [x] **JSONPath Query Engine**: Search and filter deep JSON structures using standard JSONPath notation (`$.users[0]`).
- [x] **Fetch Remote URL Tool**: Integrated remote payload fetcher inside the Tools tab.
- [x] **Extension Context Invalidation Hardening**: Top-level exception suppression ensuring 100% clean console outputs.

---

## Future Horizon (v3.0.0 & Beyond)

- [ ] **Custom Auto-Fix Rules**: Allow users to write custom replacement rules for proprietary payload formats.
- [ ] **Encrypted Cloud Snippet Sync**: Optional end-to-end encrypted sync for saved workspace snippets across devices.
- [ ] **GraphQL Response Inspector**: Specialized parser and schema generator for GraphQL responses.

Thank you for helping make JSON Debugger the ultimate developer workspace!
