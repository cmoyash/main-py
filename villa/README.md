# AZURA — 3D real estate site

A cinematic real estate website for a fictional cliffside villa. As you scroll, a real-time 3D camera flies in from the sea, rises over the headland, glides across the infinity pool, moves through the living room and turns to watch the sunset.

Everything in the 3D world (sea, sky, cliff, trees and the villa with its rooms) is built in code with [three.js](https://threejs.org). There are no image files: the residence cards and the gallery are rendered live from the same 3D model.

## What works

- **3D scroll story**: six chapters, clickable chapter dots, a progress bar, a "skip the intro" link, and a soft camera drift that follows the mouse. Daylight turns to golden hour as you go.
- **Residences**: filter by type and bedrooms, sort by price or size, save favourites with the heart (kept in the browser), and open a detail popup for each one.
- **Gallery**: a full-screen viewer with arrow keys and swipe.
- **Location**: hover a place in the list to highlight it on the map.
- **Payment calculator**: price, down payment, interest rate and term, with a monthly payment and a principal/interest chart.
- **Currency switch**: USD, EUR or INR (using indicative rates), applied everywhere.
- **Book a visit**: a validated form (no Sundays, within the next six months) with a confirmation screen and an "Add to calendar" (.ics) download.
- **Newsletter sign-up**, an FAQ, a mobile menu, and a fallback page for browsers without WebGL.

## Files

```
index.html          all sections
css/style.css       all styles; colours are at the top in :root
js/main.js          page behaviour; residences, gallery and contact details are at the top
js/scene.js         the 3D world: terrain, sea and sky shaders, villa, camera path, time of day
vendor/             three.js (r170, MIT licence)
```

## Quick edits

- **Contact details**: edit `CONFIG` at the top of `js/main.js`.
- **Receive bookings by email**: create a form at a service like Formspree and paste its endpoint into `CONFIG.formEndpoint`. Without it, requests are only stored in the visitor's browser.
- **Residences**: edit the `RESIDENCES` list in `js/main.js`. `view` picks which 3D camera angle is used for the image (see `VIEWS` in `js/scene.js`).
- **Story text**: edit the `.chapter` blocks in `index.html`. Their `data-from` and `data-to` values are the scroll range (0 to 1) where each one shows.
- **Camera path**: edit `KEYS` in `js/scene.js`. Each key has a scroll point `t`, a camera position `p` and a look-at point `l`.
- **Light and colours of the sky**: edit `TOD` in `js/scene.js` (afternoon, golden hour, blue hour).

## Run locally

It uses JavaScript modules, so serve it rather than opening the file directly:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/villa/.

All names, prices and details are illustrative.
