# skyejen / skyejen.github.io

The landing page for my portfolio: **[skyejen.github.io](https://skyejen.github.io)**. A bespoke MkDocs Material site (custom theme, featured carousel, discipline hubs) that ties together my cybersecurity, Python, DevOps, and generalist work.

## Jen's AI twin

The landing page carries a chat widget that answers questions about my
background. The UI is here (`docs/javascripts/local.js`, `docs/stylesheets/local.css`);
the agent behind it is a separate repo, `ai-digital-twin`, deployed on Vercel.

| Link | Opens |
| --- | --- |
| [skyejen.github.io/?twin=1](https://skyejen.github.io/?twin=1) | the panel |
| [skyejen.github.io/?twin=2](https://skyejen.github.io/?twin=2) | the panel, maximised |

`#twin` does the same as `?twin=1`. To point the widget at a local or preview
API while developing, set `localStorage.setItem("sj-twin-api", "http://127.0.0.1:8010")`
in the console. It is read per request, and per origin, so clearing it on the
live site does not clear it on `127.0.0.1`.

## Local development

This site shares a design system with my other repos via the `sj-theme` git submodule.

```bash
git clone https://github.com/skyejen/skyejen.github.io.git
cd skyejen.github.io
git submodule update --init            # pull in sj-theme
uv venv --python 3.12                  # or python -m venv .venv
.venv\Scripts\activate                 # source .venv/bin/activate on macOS
uv pip install "mkdocs-material>=9.7,<10" "pymdown-extensions>=10,<11"
mkdocs serve                           # http://127.0.0.1:8000
```

## Structure

- `docs/` — landing page, About, and shared assets
- `docs/sj-theme/` — shared theme (git submodule)
- `overrides/` — home template + theme customisations

Deploys automatically to GitHub Pages on push to `main` (see `.github/workflows/deploy.yml`).
