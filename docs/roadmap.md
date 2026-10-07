# ROADMAP - Multi-Player Video Game

## 🗓️ Timeline Geral

**Duração Total:** 14 semanas (3,5 meses)  
**Start:** Semana 1  
**MVP (Tetris Multiplayer):** Fim da Semana 10  
**Launch (2 Jogos):** Fim da Semana 14

```
Sem 1-4:   FASE 1 (Tetris Single)
Sem 5-6:   FASE 2 (Infra Multiplayer)
Sem 7-10:  FASE 3 (Tetris Multiplayer)
Sem 11-14: FASE 4 (2º Jogo + Polish)
```

---

## 📍 FASE 1: MVP Mecânica - Tetris Single-Player
**Duração:** 4 semanas (Semanas 1-4)  
**Objetivo:** Validar game loop e UI base antes de multiplayer  
**Saída esperada:** Tetris jogável no navegador, sem multiplayer

### Marcos
- **Sem 1 (Sprint 1):** Game loop, peças, rotação, colisão ✅
- **Sem 2 (Sprint 1 cont.):** Limpeza de linhas, score, UI básica ✅
- **Sem 3 (Sprint 2):** Game over, persistência local, testes ✅
- **Sem 4 (Sprint 2 cont.):** Polish visual, acessibilidade, pronto pra Fase 2 ✅

### Recursos Alocados
- **Dev Frontend:** 1 dev (60% Phaser/Canvas, 40% UI React)
- **QA:** Testes básicos de game loop
- **Designer:** Validação de paleta de cores retro

### User Stories
Veja `backlog-fase-1.md`

### Entregáveis
- ✅ Game Tetris funcional
- ✅ Score persistido localmente
- ✅ Prototipagem testada com usuários (opcional)

### Critérios de Saída
- Tetris completamente jogável
- Latência <16ms local
- UI responsiva em diferentes resoluções
- Paleta de cores validada com acessibilidade WCAG AA

---

## 📍 FASE 2: Infraestrutura Multiplayer
**Duração:** 2 semanas (Semanas 5-6)  
**Objetivo:** Backend + sessões + entrada de jogadores (sem game logic)  
**Saída esperada:** Infraestrutura pronta para sincronizar jogo

### Marcos
- **Sem 5 (Sprint 3):** QR code gerador, backend Socket.io, TV/celular básicos ✅
- **Sem 6 (Sprint 4):** Sincronização de conexão, botão "Iniciar", testes de latência ✅

### Recursos Alocados
- **Dev Backend:** 1 dev (60% Socket.io, 40% QR/sessão)
- **Dev Frontend:** 1 dev (80% UI TV/celular)
- **DevOps:** Setup CI/CD, Redis, variáveis de ambiente

### User Stories
Veja `backlog-fase-2.md`

### Entregáveis
- ✅ Backend Node.js + Socket.io rodando
- ✅ Fluxo QR code: geração → validação → entrada
- ✅ Sincronização de lista de jogadores (TV ↔ Celular)
- ✅ CI/CD básico configurado

### Critérios de Saída
- Latência WebSocket <100ms (local)
- 4 jugadores conseguem conectar simultaneamente
- Desconexão tratada gracefully
- Deploy em staging possível

---

## 📍 FASE 3: Tetris Multiplayer Sincronizado (MVP Completo)
**Duração:** 4 semanas (Semanas 7-10)  
**Objetivo:** Sincronizar Tetris para 4 jogadores, ranking, persistência  
**Saída esperada:** Tetris multiplayer 100% funcional, pronto para usuários

### Marcos
- **Sem 7 (Sprint 5):** Sincronização de inputs, 4 grids na TV, controles celular ✅
- **Sem 8 (Sprint 6):** Score sincronizado, ranking real-time, game over individual ✅
- **Sem 9 (Sprint 7):** Persistência no banco, resultados salvos ✅
- **Sem 10 (Sprint 8):** Testes de escalabilidade, bugs, latência real ✅

### Recursos Alocados
- **Dev Frontend:** 1 dev (60% TV layout 4 grids, 40% atualizações real-time)
- **Dev Backend:** 1 dev (70% sincronização, 30% persistência banco)
- **QA:** Testes multiplayer, sincronização, edge cases
- **DevOps:** Monitoramento, logs, alerts

### User Stories
Veja `backlog-fase-3.md`

### Entregáveis
- ✅ Tetris multiplayer 4 jugadores sincronizado
- ✅ Ranking de sessão em tempo real
- ✅ Resultados persistidos no PostgreSQL
- ✅ Leaderboard de sessão (Top 4)
- ✅ Testes de sincronização com latência simulada

### Critérios de Saída
- Latência <200ms aceitável para gameplay
- Sincronização consistente em 100 partidas
- Zero race conditions em score/ranking
- Database escalável (100+ partidas/dia)
- 99.5% uptime em staging

---

## 📍 FASE 4: 2º Jogo + Leaderboard Global + Polish
**Duração:** 4 semanas (Semanas 11-14)  
**Objetivo:** Adicionar Pac-Man, leaderboard global, deploy produção  
**Saída esperada:** Plataforma com 2 jogos, pronta para launch

### Marcos
- **Sem 11 (Sprint 9):** Menu de seleção, Pac-Man game loop, IA fantasmas ✅
- **Sem 12 (Sprint 10):** Pac-Man multiplayer sincronizado, coleta de pellets ✅
- **Sem 13 (Sprint 11):** Leaderboard global, persistência all-time ✅
- **Sem 14 (Sprint 12):** Deploy produção, monitoramento, documentação final ✅

### Recursos Alocados
- **Dev Frontend:** 1 dev (50% Pac-Man, 50% UI leaderboard)
- **Dev Backend:** 1 dev (60% Pac-Man logic, 40% leaderboard/analytics)
- **QA:** Testes multiplayer Pac-Man, leaderboard, edge cases
- **Designer:** Validação visual Pac-Man, leaderboard UI
- **DevOps:** Deploy produção, monitoring, alerts
- **Tech Writer:** Documentação final, runbooks

### User Stories
Veja `backlog-fase-4.md`

### Entregáveis
- ✅ Pac-Man game funcional (single + multiplayer)
- ✅ Menu de seleção de jogo
- ✅ Leaderboard global (Top 10 all-time)
- ✅ Persistência de histórico de jogadores
- ✅ Deploy em produção
- ✅ Monitoring e alertas configurados
- ✅ Documentação técnica completa

### Critérios de Saída
- Plataforma suporta 2 jogos completamente
- Leaderboard funcional e escalável
- 99.5% uptime em produção
- <200ms latência em condições reais (3G/4G simulado)
- Pronto para 1.000+ usuários/mês

---

## 📊 Dependências Entre Fases

```
Fase 1 (Tetris SP)
    ↓ (codigo pronto pra multiplayer)
Fase 2 (Infra)
    ↓ (backend + sessões prontos)
Fase 3 (Tetris MP)
    ↓ (plataforma base validada)
Fase 4 (2º Jogo + Leaderboard)
    ↓
LAUNCH
```

**Nenhuma fase pode pular** — cada uma prepara infra para a próxima.

---

## 🎯 Recursos por Fase

| Fase | Front | Back | QA | Designer | DevOps | Duração |
|------|-------|------|----|---------|---------|---------:|
| 1 | 1 | — | 0.5 | 0.5 | — | 4 sem |
| 2 | 1 | 1 | 0.5 | — | 0.5 | 2 sem |
| 3 | 1 | 1 | 1 | — | 0.5 | 4 sem |
| 4 | 1 | 1 | 1 | 0.5 | 1 | 4 sem |
| **TOTAL** | 1 FTE | 1 FTE | 0.75 FTE | 0.5 FTE | 0.5 FTE | **14 sem** |

---

## 🚨 Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Latência rede >200ms desincroniza jogo | CRÍTICO | Testes de latência real semana 6; delta compression; server-side validation |
| Redis/WebSocket cai com 100+ sessões | ALTO | Load testing na fase 2; horizontal scaling configurado |
| Peças/fantasmas dessincronizados | ALTO | Server é source of truth; client apenas envia input |
| Bug de score no meio do jogo | ALTO | Testes unitários de score; audit log de todas pontuações |
| Celular perde conexão mid-game | MÉDIO | Auto-reconnect em 30s; reconectar sem perder progresso |
| UX confusa no celular | MÉDIO | Testes com usuários na semana 4; prototipagem Luna semana 1 |

---

## 📈 Métricas por Fase

### Fase 1
- ✅ Game loop estável (0 crashes em 1h gameplay)
- ✅ Score calcula correto (100% acuracy)
- ✅ FPS >30 em navegador moderno

### Fase 2
- ✅ Conexão estabelecida <2s
- ✅ Lista de jogadores sincroniza <500ms
- ✅ QR code válido 100% das vezes

### Fase 3
- ✅ Input latência <200ms (p95)
- ✅ Score sincronizado 100% (audit log)
- ✅ Zero race conditions em ranking

### Fase 4
- ✅ Uptime >99.5%
- ✅ Leaderboard atualiza <5s
- ✅ Suporta 100+ sessões simultâneas
- ✅ Deploy 0-downtime possível

---

## 🎓 Lições Aprendidas & Loops de Feedback

Após cada fase, a equipe faz:
1. **Sprint Review** com stakeholders
2. **Retrospectiva** para melhorias de processo
3. **Testes com usuários** (especialmente fase 1 e 3)
4. **Análise de métricas** (uptime, latência, usabilidade)

Feedback incorporado na próxima fase.

---

## ✅ Aprovações

| Papel | Nome | Data | OK? |
|------|------|------|-----|
| Product Owner | Marina | 2026-10-07 | ✅ Aguardando chefe |
| Tech Lead | Carlos | — | ⏳ |
| Scrum Master | Helena | — | ⏳ |
| Chefe | — | — | ⏳ |

---

**Versão:** 1.0  
**Última atualização:** 2026-10-07  
**Proprietário:** Marina (Product Owner)  
**Próxima revisão:** Após aprovação + Kick-off Fase 1
