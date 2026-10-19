# Estratégia de testes

| Tipo | Escopo | Ferramenta | Estado |
|---|---|---|---|
| Unitário backend | Regras do Tetris, salas, lobby, ranking, auditoria | Vitest | ✅ 19 testes (`npm test`) |
| Unitário frontend | Componentes e transições de estado | Vitest + React Testing Library | A fazer |
| Integração | Sala → jogadores entram → partida → sincronização via Socket.io simulado | Vitest + socket.io-client | A fazer (existe verificação manual com 3 clientes) |
| E2E | TV + celulares: entrar, jogar, fim, voltar | Playwright (1–2 cenários) | A fazer |
| Usabilidade | Resposta dos botões, feedback visual, legibilidade na TV | Manual | A fazer |
| 4 jogadores | Cenário automatizado + testes reais com a família | Manual + script | Fase 3 |

## Metas
- Cobertura sugerida para merge: ≥ 80% backend, ≥ 70% frontend (aguarda confirmação do dono do produto).
- Latência (< 150 ms) é indicador, **não bloqueia** nenhuma fase.
- Antes do merge na `main`: testes passando + smoke test manual (subir `npm run dev`, entrar com 2 abas e jogar uma partida).

## Teste manual rápido
1. `npm run dev` e abra a TV pelo IP da rede.
2. Entre com 2+ abas/celulares em `/j/CODIGO`, marque "pronto".
3. Confira: contagem, tabuleiros, pontuação, fim individual (aviso), ranking final, volta ao lobby.
4. Feche uma aba durante a partida: o jogo dela segue e ela aparece no ranking.

## Testes reais (Fase 3)
4 pessoas, 3 sessões de 15–20 min. Medir latência observada, desconexões e sincronização. Entrega: relatório simples.
