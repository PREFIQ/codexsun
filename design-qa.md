**Findings**

- No remaining P0, P1, or P2 issues.
  Location: tenant workspace bootstrap state.
  Evidence: the issue reference (`C:/Users/sunda/AppData/Local/Temp/codex-clipboard-936baee5-3fe0-4d9f-84b4-e445fd8ad252.png`) shows a centered “Preparing your workspace” card. The revised capture (`C:/Users/sunda/AppData/Local/Temp/codexsun-global-workspace-loader-qa.png`) shows the shared full-screen CODEXSUN loader instead, with one accessible `status` named `Loading`. The settled workspace capture (`C:/Users/sunda/AppData/Local/Temp/codexsun-workspace-after-loader-qa.png`) confirms the loader clears and the requested Mail workspace renders normally.
  Impact: bootstrap loading now matches the application-wide loading language and removes implementation-detail copy from the transient state.
  Fix: completed by rendering `GlobalLoader` for tenant bootstrap loading while retaining the dedicated setup error card for genuine failures.

**Required Fidelity Surfaces**

- Fonts and typography: the unwanted bootstrap title/body copy is absent; the shared loader intentionally has no visible text.
- Spacing and layout rhythm: the loader mark is centered in the full viewport and uses the existing global loader dimensions and motion.
- Colors and visual tokens: background, rings, shadow, and logo use the shared `@codexsun/ui` loader styles without local overrides.
- Image quality and asset fidelity: the existing `/logo/logo.svg` asset remains sharp and centered; no placeholder or recreated asset was introduced.
- Copy and content: “Preparing your workspace” and its setup-detail sentence no longer appear during normal loading; the accessible label remains `Loading`.

**Open Questions**

- None.

**Implementation Checklist**

- [x] Replace normal tenant bootstrap card with the shared global loader.
- [x] Preserve useful setup error feedback.
- [x] Verify the delayed loading state in the browser.
- [x] Verify transition to the requested workspace and a clean browser console.

**Follow-up Polish**

- None required for this focused change.

final result: passed
