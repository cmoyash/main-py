# Yash Patil — Portfolio

A simple, fast personal portfolio in an iOS-style liquid glass look: a live pink fluid background, glass navbar with a sliding indicator, glass buttons and cards, and a live India-time clock. Plain HTML, CSS and JavaScript, with no build step and no libraries.

## Structure

```
index.html            all sections: hero, work carousel, about, experience, skills, testimonials, contact
css/style.css         all styles; theme colours are at the top in :root
js/main.js            clock, glass nav, live fluid background (WebGL), carousel, animations, contact form
assets/avatar.jpg     profile photo
assets/bg.webp        still background (shown until the live fluid starts, or if it can't run)
assets/bg-mobile.webp still background for phones
```

## Quick edits

- **Your links:** fill in `email`, `instagram` and `whatsapp` in the `CONFIG` block at the top of `js/main.js`. The WhatsApp, Email and Instagram buttons and the contact form start working once these are set.
- **Your photo:** replace `assets/avatar.jpg` with any square photo (face in the middle).
- **Colours and glass:** change the variables in `:root` at the top of `css/style.css` (`--scrim` controls how bright the pink background is, `--glass-*` controls the glass look).
- **Background speed:** in `js/main.js`, change `uTime * 0.16` in the shader (higher is faster).
- **Testimonials:** the three in `index.html` are demo placeholders. Replace them with real client reviews before sharing the site.

## Run locally

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

## Deploy on Vercel

Import this repository in Vercel and keep the default settings (framework: **Other**, no build command). It deploys as a static site.
