# Yash — Portfolio

A simple, fast personal portfolio website (dark theme, purple accent). Plain HTML, CSS and JavaScript, so there's no build step.

## Structure

```
index.html     page content: hero, about, skills, journey, testimonials, contact
css/style.css  all styles; theme colours are at the top in :root
js/main.js     menu, scroll animations, counters and contact form
```

## Quick edits

- **Your links:** fill in `email`, `instagram` and `whatsapp` in the `CONFIG` block at the top of `js/main.js`.
- **Colours:** change the variables in `:root` at the top of `css/style.css`.
- **Testimonials:** the three in `index.html` are demo placeholders. Replace them with real client reviews before sharing the site.

## Run locally

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

## Deploy on Vercel

Import this repository in Vercel and keep the default settings (framework: **Other**, no build command). It deploys as a static site.
