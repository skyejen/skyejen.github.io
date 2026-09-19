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


## AI twin widget (`sj-twin-*`)

A launcher and chat panel for the AI digital twin, added to this repo rather than
the shared theme. Everything lives in `docs/javascripts/local.js` and
`docs/stylesheets/local.css`, in one IIFE and one CSS block at the end of each.

**Why it is here and not in sj-theme.** Iterating on a streaming UI through a
submodule means a commit in sj-theme plus a bump in every site that wants it.
It belongs in the theme once it stops moving. **Port it when it is stable**, and
it should then appear on all five sites unchanged, because it depends on nothing
in this repo beyond the `--sj-*` tokens.

**Scoping.** Every class is `sj-twin-*` and the only global touched is
`html.sj-twin-open`, which locks page scroll behind the full-screen panel on
phones. No Material class is styled.

**Colours** come from the theme tokens, so night mode follows with no extra rules.

**Third-party code.** `DOMPurify` and `marked` are loaded from cdnjs on first
open, at pinned versions with an `integrity` hash and `crossorigin="anonymous"`.
The hashes were verified against the files themselves. If you bump a version you
must recompute the hash, or the script silently stops loading and answers fall
back to plain text.

**Do not hardcode the starter questions.** They come from `GET /api/chips` on the
twin API, which serves the same list the eval suite generates its cases from. A
copy here would drift from the tests.

**Sanitising happens in the browser**, deliberately. The API returns markdown and
does not render it. See `API.md` in the ai-digital-twin repo for the full
contract, including the 429 that is not JSON.

## Conventions
Shares the theme and authoring conventions of the sibling repos — see
`cybersecurity/AGENTS.md` for the full set (tiles, typography, the no-em-dashes voice,
editing safety, etc.).
