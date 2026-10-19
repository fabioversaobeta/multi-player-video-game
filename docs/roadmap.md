# Roadmap

Referência: 14 semanas em 4 fases **sequenciais**. Sprints sugeridas (não validadas): Fase 1 = 4, Fase 2 = 3, Fase 3 = 2, Fase 4 = 1. O Tetris MVP pode sair em 3–4 semanas (a confirmar).

| Fase | Foco | Status |
|---|---|---|
| 1 | Tetris MVP + lobby | **Em andamento** |
| 2 | Refatoração do backend para múltiplos jogos | **Interface `GameEngine` pronta** (Tetris adaptado; Snake como 2º motor para validar a abstração) |
| 3 | Validação com 4 jogadores reais | Não iniciada |
| 4 | Placar de sessão + 2º jogo | Não iniciada |

## Fase 1 — Tetris MVP + Lobby
Entrada só com nome, lobby/sala via QR, "pronto", Tetris completo ([regras](decisoes.md)), controles no celular, fim de partida e ranking final, localStorage (nome, recordes).

Já implementado: servidor autoritativo (30 ticks/s), salas, lobby com "pronto" e contagem, Tetris 1–4 jogadores, fim individual, ranking final, controle no celular, recorde local top 5, testes unitários do servidor.

Falta: testes de frontend e E2E, polimento visual (TV e celular), deploy em Railway + Vercel, CI.

## Fase 2 — Refatoração do backend
Preparar o backend para **múltiplos jogos** e multiplayer estável com 4 jogadores. Feito: interface de jogo (`GameEngine`) plugável na sala, com Tetris adaptado. O **Snake** foi implementado como segundo motor para validar a abstração (a escolha oficial do 2º jogo, na Fase 4, segue em aberto). Falta: estabilidade com 4 jogadores reais (Fase 3).

## Fase 3 — Validação com 4 jogadores
Validação, não desenvolvimento. Plano aprovado: 4 pessoas simulando os 4 jogadores; 3 sessões de 15–20 min (3 partidas de Tetris); medir latência observada (via log), quedas e sincronização; entrega: relatório simples (o que funcionou, o que falhou, sugestões). Correções entram como histórias de ajuste.

## Fase 4 — Placar de sessão + 2º jogo
Placar de vitórias da sessão (todos os jogadores, por vitórias, em memória). O 2º jogo é escolhido em reunião da equipe.

## Riscos
| Risco | Mitigação |
|---|---|
| Reconexão do celular | Token por jogador; estado completo ao voltar |
| Sincronismo TV↔celular | Servidor autoritativo; tudo validado no backend |
| Salas órfãs | Limpeza de salas vazias (implementado) |
| Latência real | Medir só na Fase 3; mitigar depois (ex.: ajustar velocidade) |
| Escala futura | Redis pub/sub ou particionamento, só se necessário |
