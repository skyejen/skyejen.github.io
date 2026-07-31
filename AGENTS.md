# Agent instructions — skyejen.github.io (landing)

The root landing / portfolio page for skyejen.github.io. A mostly single-page MkDocs
Material site that links out to the sibling repos (cybersecurity, 100-days-of-python,
projects like Detective Buggy).

## Shared theme — don't edit theme JS here
`extra.js` is **not** in this repo. It comes from the **sj-theme** submodule mounted at
`docs/sj-theme/`. Edit the theme in the sj-theme repo, never inside `docs/sj-theme/` here
(edits there are detached and get lost). Pull theme updates with:

    git submodule update --remote docs/sj-theme

See sj-theme's README. (`extra.css` and `overrides/` are still local for now.)

## Conventions
Shares the theme and authoring conventions of the sibling repos — see
`cybersecurity/AGENTS.md` for the full set (tiles, typography, the no-em-dashes voice,
editing safety, etc.).
