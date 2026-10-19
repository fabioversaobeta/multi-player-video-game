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
| `server/src/tetris.ts` | Regras do Tetris, funções puras (movimento, rotação, colisão, linhas, pontuação, gravidade) |
| `server/src/rooms.ts` | `Room` (lobby, contagem, partida, ranking, auditoria) e `RoomManager` (códigos únicos, limpeza) |
| `server/src/protocol.ts` | Tipos das mensagens WebSocket (compartilhados com o frontend) |
| `server/src/index.ts` | Servidor HTTP/Socket.io e loop de 30 ticks |
| `web/src/Tv.tsx` | Tela da TV: QR, lobby, tabuleiros, ranking |
| `web/src/Controller.tsx` | Tela do celular: entrada, "pronto", controles, resultado, recordes |
| `web/src/Board.tsx` | Desenho do tabuleiro em canvas |
| `web/src/storage.ts` | localStorage (nome, top 5 de recordes) |

## Fluxo
1. A TV abre `/`, cria a sala e exibe o QR para `/j/CODIGO`.
2. O celular entra com o nome e marca "pronto".
3. Todos os presentes prontos → contagem de 3 s → partida.
4. Cada jogador tem seu tabuleiro; ao encher, vê sua pontuação e espera os demais.
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
| `room:state` | servidor → todos | Fase, jogadores, pontuação, contagem, ranking (só quando muda) |
| `game:frame` | servidor → TV | Tabuleiros (10×20 achatado), próxima peça, pontos, nível |

## Segurança (baixa prioridade por ora)
Nome sanitizado (12 caracteres, sem controle/`<>`). Pendentes: limite de requisições por IP, expiração do código da sala, LGPD.

## Evolução prevista (Fase 2)
Interface de jogo genérica (`createState`, `applyInput`, `tick`, `frame`) para plugar novos jogos na `Room`; escala horizontal (Redis pub/sub) só se necessário.
