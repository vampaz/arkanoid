# Arkanoid Improvement Plan

## Gameplay
- [x] 1. Add delta time to normalize physics across refresh rates
- [x] 2. Add more stages (10 total) with progressive difficulty curves
- [x] 3. Ball trail effect for fireball/speed changes
- [x] 4. Screen shake on brick destruction for impact feel
- [x] 5. Power-up preview tooltip on first encounter
- [x] 6. Progressive ball speed per stage (not just per paddle hit)
- [x] 7. Laser fires when stationary too

## Visual Polish
- [x] 8. Animated brick destruction with staggered particle burst + flash
- [x] 9. Background parallax or subtle animation instead of static grid
- [x] 10. Paddle hit flash on contact
- [x] 11. Ball trajectory preview on launch
- [x] 12. Stage-specific color themes
- [x] 13. Animated score counter (numbers roll up)

## Audio
- [x] 14. Background music (procedural loop per stage)
- [x] 15. Pitch variation on brick hits based on row
- [x] 16. Volume controls / mute toggle

## UX / Quality of Life
- [x] 17. Pause menu with resume/restart/quit options
- [x] 18. Stage select after completing the game once
- [x] 19. Difficulty modes (easy/normal/hard)
- [x] 20. Mobile HUD improvements
- [x] 21. Clean up unused boilerplate files
- [x] 22. Fix shrink timer to use frame counting
- [x] 23. Use STATE constants in input.js instead of string literals

## Technical
- [x] 24. Add vite.config.js with TLS for dev server
- [x] 25. Object pooling for particles and lasers
- [x] 26. Spatial partitioning for collision detection (evaluated: unnecessary for 11x8 grid, brute-force is optimal at this scale)
