# AGENTS.md

## Lessons

- The landmark arrival views in `landmarks.js` use the same world coordinates as the atlas map. Check each arrival against `canWalk(x, z)` in `world.js` after moving roads, buildings, or the coastline.
- Three.js 0.170.0 renders the scenery locally. The arrival images remain available for browsing when WebGL 2 is unavailable.
