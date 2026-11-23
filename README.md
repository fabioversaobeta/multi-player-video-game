# 🎮 Multi-Player Video Game

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)

**Retro party games in the browser.** The TV shows the game and each player uses their phone as a controller: scan a QR code, type a name and play. No login, no install, 1–4 players. The lobby offers 8 games (Tetris, Snake, Pong, Space Invaders, Pac-Man, Bomberman, Top Gear and Doodle Jump); Tetris is the most complete.

<p align="center">
  <img src="docs/images/lobby.png" alt="TV lobby with QR code and game picker" width="700" /><br/>
  <img src="docs/images/game.png" alt="Two-player Tetris on the TV" width="700" />
</p>
<p align="center">
  <img src="docs/images/controller.png" alt="Phone controller" width="220" />
</p>

## Highlights

- **Authoritative server:** game rules run on the server at 30 ticks/s; TV and phones only render and send input, which keeps everyone in sync.
- **Real-time over WebSockets** (Socket.io): rooms, lobby with "ready" and countdown, per-player game over and a final ranking.
- **Pluggable game engines:** a `GameEngine` interface lets new games plug into a room. Each game is an engine behind that interface: Tetris came first, and Snake, Pong, Space Invaders, Pac-Man, Bomberman, Top Gear and Doodle Jump followed.
- **Zero-friction onboarding:** the QR code opens `/j/<ROOM_CODE>` on the phone.
- **Server unit tests** with Vitest.

## Architecture

| Folder | Content |
|---|---|
| `server/` | Node + Express + Socket.io: Tetris rules, rooms, 30-tick game loop |
| `web/` | Vite + React: `/` is the TV, `/j/CODE` is the phone controller |
| `shared/` | Types shared between server and web |
| `docs/` | Vision, decisions, architecture, roadmap, testing strategy (in Portuguese) |

## Running locally

```bash
npm install
npm run dev     # server on :3001, web on :5173
npm test        # server tests (Vitest)
```

Open the TV view using your **network IP** (e.g. `http://192.168.x.x:5173`), not `localhost`, because the QR code uses the page address. Phones join by scanning the QR on the same network.

Optional env vars: `VITE_PUBLIC_URL` (public URL encoded in the QR), `VITE_SERVER_URL` (server URL, default `http://<host>:3001`), `CORS_ORIGIN` and `PORT` (server).

## Status

Phase 1 (Tetris MVP + lobby) is largely implemented: rooms, lobby, Tetris for 1–4 players, rankings, phone controller and local high scores. Still to do: frontend and E2E tests, visual polish, deployment (Railway + Vercel), CI, and validation sessions with 4 real players. See [docs/roadmap.md](docs/roadmap.md).

## Documentation

| Document | Purpose |
|---|---|
| [docs/visao.md](docs/visao.md) | Product vision, audience, scope |
| [docs/decisoes.md](docs/decisoes.md) | Product rules and decisions (source of truth) |
| [docs/arquitetura.md](docs/arquitetura.md) | Architecture, code structure, WebSocket protocol |
| [docs/roadmap.md](docs/roadmap.md) | Phases, status and risks |
| [docs/testes.md](docs/testes.md) | Testing strategy |
