# Yash Dev — Portfolio

A simple, fast personal portfolio. It has a black theme with a pink fluid glow, a pill-shaped glass navbar and a live India-time clock. Plain HTML, CSS and JavaScript, with no build step and no 3D or heavy libraries.

## Structure

```
index.html            all sections: hero, work carousel, about, experience, skills, testimonials, contact
css/style.css         all styles; theme colours are at the top in :root
js/main.js            clock, active nav, carousel, animations, contact form
assets/bg.webp        pink fluid background (desktop)
assets/bg-mobile.webp pink fluid background (phones)
```

## Quick edits

- **Your links:** fill in `email`, `instagram` and `whatsapp` in the `CONFIG` block at the top of `js/main.js`. The WhatsApp, Email and Instagram buttons and the contact form start working once these are set.
- **Your photo:** save a square photo as `assets/avatar.jpg`. It replaces the "Y" circle automatically.
- **Colours:** change the variables in `:root` at the top of `css/style.css`.
- **Testimonials:** the three in `index.html` are demo placeholders. Replace them with real client reviews before sharing the site.

## Run locally

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

## Deploy on Vercel

Import this repository in Vercel and keep the default settings (framework: **Other**, no build command). It deploys as a static site.
