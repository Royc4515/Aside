# Archive

Files kept for reference but **not part of the published extension**.
The build script (`scripts/build-zip.ps1` / `.sh`) does not include this directory.

| File / dir | What it is | Why kept |
|---|---|---|
| `qa-test.js` | Standalone QA harness used during early manual testing. | May be revived for regression checks. |
| `preview/` | `chrome-shim.js` + `test.html` that fake the `chrome.*` APIs so `sidebar.html` can be opened in a regular browser tab. | Useful for visual iteration without reloading the extension. |
| `Extension-Preview.html` | Static preview of the sidebar markup. | Quick visual reference. |
| `FAB-Test.html` | Standalone "Ask Aside" floating button playground. | Useful when tuning FAB positioning. |

If something here is clearly never coming back, delete it and update this table.
