# Arquitetura

## Princípios
- **Servidor autoritativo:** o celular envia apenas **inputs**; o servidor valida, calcula e transmite o estado. Sem lógica de jogo no cliente.
- **Game loop a 30 ticks/s** (com acumulador de tempo, para não atrasar em timers lentos).
- **Estado imutável por tick:** cada transição devolve um novo estado (facilita testes e depuração).
- **Estado completo do tabuleiro** a cada atualização, só quando houve mudança. Delta só se testes reais pedirem.
- **Tudo em memória**, sem banco. Estrutura agnóstica ao número de jogadores.
- **Rejeição silenciosa** de input inválido, com **log de auditoria** por sala (últimos 500 inputs: aceito/rejeitado e motivo).
- **Reconexão:** o jogador volta com um token e recebe o estado atual.

## Stack
Node.js + Express + Socket.io (TypeScript) no backend; Vite + React + TypeScript no frontend. Hospedagem: Railway (backend) e Vercel (frontend); configurar `CORS_ORIGIN` no backend.

## Estrutura do código
| Caminho | Responsabilidade |
|---|---|
| `server/src/engine.ts` | Interface `GameEngine`: contrato que todo jogo implementa (`start`, `input`, `step`, `isOver`, `score`, `playerOver`, `frame`, `drainEvents`) |
| `server/src/games.ts` | Registro dos jogos disponíveis (`GAMES`); para adicionar um jogo, implementar `GameEngine` e registrar aqui |
| `server/src/tetris.ts`, `tetris-engine.ts` | Regras do Tetris (funções puras) e seu adaptador `GameEngine` (um tabuleiro por jogador) |
| `server/src/snake.ts`, `snake-engine.ts` | Regras do Snake (arena compartilhada) e seu adaptador `GameEngine` |
| `server/src/pong.ts`, `pong-engine.ts` | Regras do Pong (duelo de raquetes, CPU quando há 1 jogador) e seu adaptador `GameEngine` |
| `server/src/invaders.ts`, `invaders-engine.ts` | Regras do Space Invaders (arena cooperativa, uma nave por jogador) e seu adaptador `GameEngine` |
| `server/src/pacman.ts`, `pacman-engine.ts` | Regras do Pac-Man (labirinto cooperativo, 4 fantasmas) e seu adaptador `GameEngine` |
| `server/src/bomberman.ts`, `bomberman-engine.ts` | Regras do Bomberman simplificado (arena em grade, todos contra todos) e seu adaptador `GameEngine` |
| `server/src/topgear.ts`, `topgear-engine.ts` | Regras do Top Gear simplificado (corrida com curvas, carros parados e turbo) e seu adaptador `GameEngine` |
| `server/src/doodle.ts`, `doodle-engine.ts` | Regras do Doodle Jump simplificado (subida por plataformas, uma visão por jogador) e seu adaptador `GameEngine` |
| `server/src/asteroids.ts`, `asteroids-engine.ts` | Regras do Asteroids simplificado (arena única, todos contra todos) e seu adaptador `GameEngine` |
| `server/src/rooms.ts` | `Room` (lobby, contagem, partida, ranking, auditoria) e `RoomManager` (códigos únicos, limpeza) |
| `server/src/protocol.ts` | Tipos das mensagens WebSocket (compartilhados com o frontend) |
| `server/src/index.ts` | Servidor HTTP/Socket.io e loop de 30 ticks |
| `web/src/Tv.tsx` | Tela da TV: QR, lobby, tabuleiros, ranking |
| `web/src/Controller.tsx` | Tela do celular: entrada, "pronto", controles, resultado, recordes |
| `web/src/Board.tsx`, `SnakeArena.tsx`, `PacmanMaze.tsx`, `BombermanArena.tsx`, `TopGearRoad.tsx`, `DoodleTower.tsx`, `AsteroidsField.tsx` | Desenho do Tetris e da arena do Snake em canvas |
| `web/src/storage.ts` | localStorage (nome, top 5 de recordes) |

## Fluxo
1. A TV abre `/`, cria a sala e exibe o QR para `/j/CODIGO`.
2. O celular entra com o nome; TV ou celular escolhem o jogo (trocar o jogo zera os "prontos") e cada um marca "pronto".
3. Todos os presentes prontos → contagem de 3 s → partida.
4. Quem perde vê sua pontuação e espera os demais (Tetris: um tabuleiro por jogador; Snake: arena compartilhada).
5. Todos terminaram → ranking final → "A" no celular (ou botão na TV) volta ao lobby.

Fases da sala: `lobby` → `countdown` → `playing` → `results` → `lobby`. Entrada de novos jogadores só em `lobby`/`countdown`; quem sai no lobby é removido, quem sai durante a partida segue no jogo.

## Protocolo WebSocket
Tipos em [`server/src/protocol.ts`](../server/src/protocol.ts).

| Evento | Direção | Conteúdo |
|---|---|---|
| `tv:create` / `tv:resume` | TV → servidor | Cria a sala / retoma com `tvToken` |
| `player:join` | celular → servidor | `{ code, name, token? }`; resposta com `playerId` e `token` |
| `player:ready` | celular → servidor | `{ ready }` |
| `player:input` | celular → servidor | `{ action: left \| right \| down \| a \| b \| pause }` |
| `room:back` | TV → servidor | Volta ao lobby (a partir dos resultados) |
| `room:game` | TV ou celular → servidor | `{ game }`; só vale no lobby |
| `room:state` | servidor → todos | Fase, jogo escolhido e disponíveis, jogadores, pontuação, contagem, ranking (só quando muda) |
| `game:frame` | servidor → TV | União discriminada por `game`: `tetris` (tabuleiros 10×20 achatados, próxima peça, pontos, nível) ou `snake` (arena, cobras, comidas) |
| `player:sfx` | servidor → celular | `{ kind: lines \| eat \| crash, value }` para tocar o som |

## Segurança (baixa prioridade por ora)
Nome sanitizado (12 caracteres, sem controle/`<>`). Pendentes: limite de requisições por IP, expiração do código da sala, LGPD.

## Evolução
A interface de jogo genérica (`GameEngine`) já existe e é usada por Tetris e Snake. Escala horizontal (Redis pub/sub) só se necessário.
