# nabaruns.com

My personal site. Hand-written HTML and one stylesheet — no framework, no build step, no
JavaScript. Fonts (Newsreader, IBM Plex Mono) are self-hosted from `fonts/`, subset to latin.

Served by GitHub Pages at <https://nabaruns.com>. The blog lives separately at
<https://nabaruns.com/blog>.

## Caching

GitHub Pages serves HTML with `max-age=600` but CSS, JS and fonts with `max-age=14400` — four
hours. A returning visitor therefore gets new HTML against stale assets, which silently breaks
anything that depends on both changing together.

So asset URLs carry a `?v=N` token. **Bump it in `index.html` and `css/site.css` together
whenever you change `site.css`, `site.js` or a font file** — the two files must agree, or a
preloaded font is fetched twice.

| Path | |
| --- | --- |
| `index.html` | the site |
| `css/site.css` | design tokens and layout |
| `fonts/` | subset woff2 files |
| `og.png` | 1200×630 social preview card |
| `og-source.html` | template `og.png` is rendered from — edit, then screenshot it at 1200×630 |
| `covid19AppPrivacy.html` | privacy policy for the Covid-19 tracker Android app |
| `img/` | assets referenced by the blog |
