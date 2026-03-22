# ⚡ Super Chilalas

An online multiplayer open-world superhero game built with HTML5 Canvas and Node.js. Two pixel-art heroes explore a city, transform into their superhero forms, and fight robot villains together in real time.

![Super Chilalas](generated_image_ad038602-acb0-44e0-95e7-93ec26029825.png)

---

## Heroes

| Hero | Costume | Power |
|---|---|---|
| **Flash Boy** | Blue & gold | ⚡ Lightning dash attack |
| **Super Boy** | Red & blue | 🦸 Super punch shockwave |

Both heroes have a muscular pixel-art design with V-taper shoulders, animated walking, capes, and full hero costumes — plus casual civilian clothes in normal mode.

---

## Gameplay

- **Explore** an open city with a park, school, police HQ, hospital, stadium and more
- **Transform** between normal kid and superhero at any time
- **Fight** robot villains that spawn across the city and chase players
- **Team up** — both players share the same world, see each other in real time, and fight enemies together
- **Score** points for every robot defeated

---

## Multiplayer

The game uses **Socket.io** for real-time multiplayer. Anyone on the same network can join by opening the server's IP address in their browser.

---

## Controls

| Key | Action |
|---|---|
| `WASD` / Arrow Keys | Move |
| `SPACE` | Transform to hero / back to normal |
| `SHIFT` | Use power (hero mode only) |

---

## Getting Started

**Requirements:** Node.js 16+

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

To play with a friend on the same Wi-Fi, share your local IP address (e.g. `http://192.168.1.x:3000`).

---

## Tech Stack

- **Frontend:** HTML5 Canvas, vanilla JavaScript
- **Backend:** Node.js, Express, Socket.io
- **Graphics:** Pixel art rendered on a low-resolution offscreen canvas (560×315) and scaled up with `image-rendering: pixelated` for a crisp retro look
