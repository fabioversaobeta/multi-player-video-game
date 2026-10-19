# Multi-Player Video Game

Jogos retrô multiplayer no navegador: a **TV** mostra o jogo e cada jogador usa o **celular como controle** (1 a 4 jogadores, entrada por QR Code, sem login). Começa com Tetris.

## Rodar localmente

```bash
npm install
npm run dev     # servidor em :3001, web em :5173
npm test        # testes do servidor (Vitest)
```

Abra a TV pelo **IP da rede** (ex.: `http://192.168.x.x:5173`), não por `localhost`, pois o QR usa o endereço da página. Os celulares entram escaneando o QR, na mesma rede.

Variáveis opcionais: `VITE_PUBLIC_URL` (URL pública no QR), `VITE_SERVER_URL` (URL do servidor; padrão `http://<host>:3001`), `CORS_ORIGIN` e `PORT` (servidor).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `server/` | Node + Express + Socket.io: regras do Tetris, salas, loop de 30 ticks/s |
| `web/` | Vite + React: `/` é a TV, `/j/CODIGO` é o celular |
| `docs/` | Documentação do projeto |

## Documentação

| Documento | Para quê |
|---|---|
| [docs/visao.md](docs/visao.md) | O que é o produto, público, escopo |
| [docs/decisoes.md](docs/decisoes.md) | **Regras e decisões do produto** (fonte de verdade) e escolhas provisórias de dev |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura, estrutura do código, protocolo WebSocket |
| [docs/roadmap.md](docs/roadmap.md) | Fases, status e riscos |
| [docs/testes.md](docs/testes.md) | Estratégia de testes e teste manual rápido |

Em caso de conflito entre documentos, vale `docs/decisoes.md`.
