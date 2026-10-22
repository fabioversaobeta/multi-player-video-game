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
| `server/src/core/engine.ts` | Interface `GameEngine`: contrato que todo jogo implementa (`start`, `input`, `step`, `isOver`, `score`, `playerOver`, `frame`, `drainEvents`) |
| `server/src/core/rng.ts` | Gerador pseudoaleatório determinístico (semente) usado pelas regras |
| `server/src/games/index.ts` | Registro dos jogos disponíveis (`GAMES`); para adicionar um jogo, criar `games/<jogo>/` com `rules.ts` e `engine.ts` e registrar aqui |
| `server/src/games/tetris/` | `rules.ts` (regras puras do Tetris, um tabuleiro por jogador), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/snake/` | `rules.ts` (regras puras do Snake: arena compartilhada), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/pong/` | `rules.ts` (regras puras do Pong: duelo de raquetes, CPU quando há 1 jogador), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/invaders/` | `rules.ts` (regras puras do Space Invaders: arena cooperativa, uma nave por jogador), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/pacman/` | `rules.ts` (regras puras do Pac-Man: labirinto cooperativo, 4 fantasmas), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/bomberman/` | `rules.ts` (regras puras do Bomberman simplificado: arena em grade, todos contra todos), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/topgear/` | `rules.ts` (regras puras do Top Gear simplificado: corrida com curvas, carros parados e turbo), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/games/doodle/` | `rules.ts` (regras puras do Doodle Jump simplificado: subida por plataformas, uma visão por jogador), `engine.ts` (adaptador `GameEngine`) e testes |
| `server/src/rooms/` | `room.ts` (`Room`: lobby, contagem, partida, ranking, auditoria), `room-manager.ts` (`RoomManager`: códigos únicos, limpeza) e `index.ts` |
| `shared/src/protocol.ts` | Tipos das mensagens WebSocket, pacote `@mpvg/shared` importado por servidor e web |
| `server/src/index.ts` | Servidor HTTP/Socket.io e loop de 30 ticks |
| `web/src/screens/Tv.tsx`, `screens/tv/` | Tela da TV: `Tv.tsx` escolhe a fase; `Lobby`, `Results` e o hook `useTvRoom` (conexão e estado) ficam em `tv/` |
| `web/src/screens/Controller.tsx`, `screens/controller/` | Tela do celular: `Controller.tsx` escolhe a fase; `JoinForm`, `LobbyPhone`, `GamePad` (botões por jogo), `ResultsPhone` e o hook `useController` ficam em `controller/` |
| `web/src/games/` | `TvView.tsx` escolhe a visão de TV pelo jogo do quadro; `<jogo>/` tem o canvas e a visão de TV (`<Jogo>Tv.tsx`, com placar e layout) de cada jogo; `types.ts` define `TvViewProps` |
| `web/src/games/<jogo>/` | Componente de desenho em canvas de cada jogo (`Board`, `SnakeArena`, `PongCourt`, `InvadersField`, `PacmanMaze`, `BombermanArena`, `TopGearRoad`, `DoodleTower`) |
| `web/src/components/` | `ScoreBar.tsx`: placar compartilhado pelas visões de TV (`PlayerScore`, `StatScore`) |
| `web/src/lib/` | `socket.ts` (cliente Socket.io), `sounds.ts` (efeitos sonoros), `storage.ts` (localStorage: nome, top 5 de recordes), `useViewport.ts` |

## Fluxo
1. A TV abre `/`, cria a sala e exibe o QR para `/j/CODIGO`.
2. O celular entra com o nome; TV ou celular escolhem o jogo (trocar o jogo zera os "prontos") e cada um marca "pronto".
3. Todos os presentes prontos → contagem de 3 s → partida.
4. Quem perde vê sua pontuação e espera os demais (Tetris: um tabuleiro por jogador; Snake: arena compartilhada).
5. Todos terminaram → ranking final → "A" no celular (ou botão na TV) volta ao lobby.

Fases da sala: `lobby` → `countdown` → `playing` → `results` → `lobby`. Entrada de novos jogadores só em `lobby`/`countdown`; quem sai no lobby é removido, quem sai durante a partida segue no jogo.

## Protocolo WebSocket
Tipos em [`shared/src/protocol.ts`](../shared/src/protocol.ts).

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
