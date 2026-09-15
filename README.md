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


## WordChain Ultimate Dictionary V12

- Kkuko/끄코 API 의존을 제거했습니다.
- 5종 공개/GitHub 한국어 단어 데이터셋을 병렬 수집해 union DB를 구성합니다.
- `data/wordchain-dictionaries.json`에 출처를 기록합니다.
- 한방 단어는 첫 턴부터 허용합니다.
- `션샤인`은 명시적으로 차단합니다.
- 최대 100글자 장문을 지원합니다.
