# skyejen / skyejen.github.io

The landing page for my portfolio: **[skyejen.github.io](https://skyejen.github.io)**. A bespoke MkDocs Material site (custom theme, featured carousel, discipline hubs) that ties together my cybersecurity, Python, DevOps, and generalist work.

## Local development

This site shares a design system with my other repos via the `sj-theme` git submodule.

```bash
git clone https://github.com/skyejen/skyejen.github.io.git
cd skyejen.github.io
git submodule update --init            # pull in sj-theme
pip install "mkdocs-material>=9.7,<10" "pymdown-extensions>=10,<11"
mkdocs serve                           # http://127.0.0.1:8000
```

## Structure

- `docs/` — landing page, About, and shared assets
- `docs/sj-theme/` — shared theme (git submodule)
- `overrides/` — home template + theme customisations

Deploys automatically to GitHub Pages on push to `main` (see `.github/workflows/deploy.yml`).
