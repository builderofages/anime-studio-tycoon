# Dependency audit - 2026-09-16

Root and desktop npm lockfiles were generated with `--package-lock-only --ignore-scripts` and are now eligible for version control. No packages were installed and no dependency lifecycle scripts ran.

- Desktop: 270 audited packages, zero reported vulnerabilities.
- Root: 201 audited packages, two high-severity affected package entries: `sharp@0.32.6` and its parent development dependency `@capacitor/assets@3.0.5`.
- Sharp advisories: [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) and [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c). The latter requires sharp 0.35.4 or later.
- npm reports `fixAvailable: false` for both affected entries. No untested sharp override or breaking dependency upgrade was applied. A patched asset-generation dependency, or a separately validated sharp upgrade, is still required.

`npm run audit:check` retains the project's policy of failing on fixable advisories; it can therefore pass while these unresolved high-severity build-tool advisories remain. A passing result does not mean zero vulnerabilities. The repaired check fails when npm cannot produce a valid report.

These are registry results for the recorded lockfiles, not proof of native build compatibility or a complete application security review. Native asset generation and desktop packaging have not been run in this audit.
