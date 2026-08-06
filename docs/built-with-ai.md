# :material-creation-outline: This Site, Built with AI

[:material-arrow-left: Back to home](../){ .sj-back }

You're looking at the project. This site is my portfolio, and it's also a portfolio piece on its own. I designed and walked Claude through every change, every fix and every iteration. A few prototypes into the project we landed at this current version.

I used Claude Cowork (instead of Claude Code) as I feel it's more suitable for creative projects, you can brainstorm for a while together, and Claude Cowork tends to explain coding changes to me as it goes, which is a nice bonus as it helps me improve my understanding of programming.

---

<div class="sj-cta" markdown>
[:material-github: Source code](https://github.com/skyejen/skyejen.github.io){ .md-button .md-button--primary }
</div>

## :material-layers-outline: Tech stack

- **MkDocs + Material for MkDocs** - static site generator and base theme.
- **A shared theme layer** - my own theme pulled in as a git submodule, so every one of my sites (this one, cybersecurity, Python etc) shares a single design system instead of copy-pasted styling.
- **Hand-written CSS and vanilla JS** - the landing page is bespoke: the looping featured carousel, the multi-tag filtering, the rotating terminal, and the layout are all custom, layered over Material through overrides.
- **GitHub Pages + GitHub Actions** - hosting, and auto-deploy on every push.

## :material-tools: What I actually built

- A reusable design system shared across repositories, so branding stays consistent as the portfolio grows.
- A custom landing page - hero terminal, a filterable featured carousel that loops cleanly, discipline hubs, and a connect section - none of it out-of-the-box Material.
- A clean override discipline: local styles only, never touching the shared theme, so updates don't break the sites that depend on it.

## :material-school-outline: What I got out of it

Working with a theme system, submodules, and someone else's conventions taught me more about front-end architecture than a blank file ever would. I learned to spot when a layout bug was really a CSS-inheritance problem, to read rendered output critically instead of trusting the code, and to hold a design opinion and push until the implementation matched it - including throwing away semi-ready code. A bit of a confidence boost - there were a few moments when Claude couldn't fix some bugs, so I would rescue him by investigating myself in Dev Tools. Such a small thing, but seeing AI craft so many amazing things so fast one can lose the sight of their own worth... until AI needs them to do something they can't.

## :material-robot-happy-outline: A note on AI

This whole site is my honest answer to "what can you build while pairing with AI?". I used AI as a coding and implementation partner: generating all code, debugging layout, speeding up the tedious parts. The direction was mine - the visual design, the calls about what belongs on the page, the "no, that's not right, do it this way," and the final judgement on every detail. 

It's an interesting time we live in. Something like this used to trigger my imposter syndrome heavily, nowadays this kind of work is considered to be a valuable skill: knowing what good looks like, and being able to direct a fast tool until you get there.

