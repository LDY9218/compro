# COMTIME PRO V12

## Developer code
Set the same developer/admin code in `.env`:

```env
ADMIN_CODE=your-code
DEV_CODE=your-code
```

The in-game developer code button verifies the code on the server. The actual `.env` file is intentionally not included in the ZIP.

## Run

```bash
npm install
npm run start
```

## V12 gameplay updates
- Endless Survivor: 100 unique upgrade choices.
- Boss time pauses during boss combat and resumes after the boss dies.
- Boss XP now grants real XP and scales with Gold XP / Boss XP upgrades.
- Knockback and Repulse cannot push bosses outside the boss arena fence.
- Higher-numbered bosses gain stronger projectile patterns and dash attacks.
- Enemy separation prevents stationary enemies from visually merging into one mass.
- Player/enemy contact damages both sides.
- Homing upgrades also apply to drone shots and drone missiles.
- Pause menu: resume or quit.
- Persistent survival high score.
- Developer code unlocks a MAX build.
- Worm Arena enters practice immediately while connecting, then switches to live state when the server responds.
- Worm practice movement uses a real trail history for smooth body following.
- Worm leaderboard dynamically assigns gold/silver/bronze crowns to ranks 1/2/3.
- Worm best mass is saved locally.
