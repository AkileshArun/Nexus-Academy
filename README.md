# Nexus Academy — playable prototype

Plain HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no
backend. Open it and play.

## Run
1. Keep the whole `nexus-academy` folder together.
2. Double-click **`index.html`** (any modern browser). No server needed.
   (Optional: `python3 -m http.server` then open `http://localhost:8000`.)
3. Sound turns on after your first tap (browser rule); use the 🔊 button to mute.

## What's in it
- **Title** with multiple **access-code saves** (switch or delete) and a first-run **tutorial**.
- **Shadow-Fight-style map**: circular gates → story card → Start.
- **10 episodes**, each a comic page with **6 unique challenges + a boss**.
- **16 mini-game types** (each episode has its own lineup): Recall, Reflex,
  Pattern, Odd One Out, Rhythm, Memory Grid, Wire Connect, Maze, Lights Out,
  Memory Pairs, Sort, Unscramble, **Color Trap**, **Quick Math**, **Order Up**,
  and the **Stick Fight** (educational duel with per-episode hero/villain cosplay).
- **Power-ups**: every episode rewards a **unique signature power-up**. Use them
  in the power-up bar: *solve* (clear a challenge / boss phase), *guard* (block a
  boss mistake), *life* (+1 boss life). You start with a small kit.
- **Boss**: 3-phase, with **unique dialogue per villain** and a **lives** system
  (boss never heals; lose all lives → redo the boss).
- **Juice**: confetti on **every** level cleared (plus a big burst per episode),
  level-complete animations, a points counter (⬡), and **synthesized sound
  effects** (no audio files).
- **NOVA**, a built-in **AI helper** (the “?” button). No API key — it answers
  from a knowledge base and gives tips for the exact game you’re on.

## Add your images (black & white → colour)
See **`assets/HOW_TO_ADD_IMAGES.txt`**. Drop COLOUR art into `assets/e1 … e10`
as `cover.png`, `panel-1.png … panel-6.png`, `boss.png`. Panels show black &
white until cleared, then reveal in colour. Missing files fall back to a
gradient, so add art episode by episode.

## Files
```
index.html · tutorial.html · map.html · episode.html
css/styles.css
js/main.js · js/sfx.js · js/chatbot.js · js/tutorial.js · js/map.js · js/episode.js · js/minigames.js
assets/e1..e10/   (your images)
```
