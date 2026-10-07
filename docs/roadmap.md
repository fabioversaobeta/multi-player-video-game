# Roadmap: Multi-Player Video Game

**Versão:** 1.0  
**Data:** 2026  
**Owner:** Marina (Product Owner)  
**Próxima revisão:** A cada final de sprint

---

## 📅 Timeline Geral: 14 Semanas

```
Semana 1-4   │ Semana 5-6   │ Semana 7-10  │ Semana 11-14
─────────────┼──────────────┼──────────────┼─────────────
  FASE 1     │   FASE 2     │   FASE 3     │  FASE 4
 (MVP Single)│(Infraestrutura)(Multiplayer)│(2º Jogo+Deploy)
```

---

## 🎯 FASE 1: MVP Single-Player Tetris (4 Semanas)

**Objetivo:** Validar game loop, UI base e mecânicas de Tetris antes de multiplayer.

**O que será entregue:**
- ✅ Tetris jogável no navegador (desktop/mobile)
- ✅ Score tracking local
- ✅ UI clara e acessível (dark mode, fonts grandes)
- ✅ Restart game funcional
- ✅ Dificuldade progredindo

**Arquitetura:**
- Frontend: React + Canvas/Phaser
- Backend: Node.js (setup inicial, sem real-time ainda)
- Banco: SQLite local (preparação para PostgreSQL)

**User Stories (Backlog Detalhado em backlog-fase-1.md):**
- US-001: Jogar Tetris básico (peças caem, rotação, colisão)
- US-002: Limpar linhas e aumentar score
- US-003: Game over e reiniciar
- US-004: Dificuldade progredindo

**Métricas de Saída:**
- ✅ 0 crashes em 1 hora de gameplay
- ✅ FPS >30 em todos os navegadores testados
- ✅ Usável sem tutorial

**Dependências:** Nenhuma (MVP isolado)

**Aprovação:** Testes com usuários reais confirmam entendimento das regras

---

## 🎯 FASE 2: Infraestrutura Multiplayer (2 Semanas)

**Objetivo:** Montar plataforma de real-time, sessões e entrada de jogadores (sem game logic ainda).

**O que será entregue:**
- ✅ QR code gerado e funcional
- ✅ Entrada de 4 jogadores via célular
- ✅ Lista de jogadores sincronizada na TV
- ✅ WebSocket conectando TV + celulares
- ✅ Sessão com TTL (10 min)

**Arquitetura:**
- Backend: Node.js + Express + Socket.io + Redis
- Frontend: React (TV) + React Web (celular)
- Banco: PostgreSQL (sessões armazenadas)
- Real-time: Redis pub/sub para broadcast

**User Stories (Backlog Detalhado em backlog-fase-2.md):**
- US-005: Gerar QR code de sessão
- US-006: Escanear QR e conectar
- US-007: Escolher avatar/cor
- US-008: Sincronizar lista de jogadores na TV
- US-009: Iniciar jogo (countdown 3s)

**Métricas de Saída:**
- ✅ QR code escaneia e conecta em <5s
- ✅ 4 jogadores entram simultaneamente sem erro
- ✅ Latência de sincronização <100ms
- ✅ Sessão limpa automaticamente após 10 min

**Dependências:** 
- Fase 1 completa (UI base)
- Infra cloud (servidor Node.js, Redis, PostgreSQL)

**Aprovação:** Teste de carga: 50 sessões simultâneas sem erro

---

## 🎯 FASE 3: Tetris Multiplayer Funcional (4 Semanas)

**Objetivo:** Sincronizar Tetris para 4 jogadores, ranking de sessão e persistência.

**O que será entregue:**
- ✅ Tetris com 4 grids simultâneos na TV
- ✅ Controles no celular latência <200ms
- ✅ Ranking em tempo real
- ✅ Game over individual (outros continuam)
- ✅ Score salvo no banco
- ✅ Tela de resultados com ranking final

**Arquitetura:**
- Game loop sincronizado (20-30 FPS)
- Server-side state (source of truth)
- Event sourcing para sincronização
- Banco: resultados persistidos

**User Stories (Backlog Detalhado em backlog-fase-3.md):**
- US-010: Controles no celular (← → ⟳ ↓)
- US-011: 4 grids na TV lado a lado
- US-012: Score sincronizado em tempo real
- US-013: Ranking durante e após jogo
- US-014: Game over individual
- US-015: Voltar ao menu após jogo
- US-016: Reconectar à sessão se desconectar

**Métricas de Saída:**
- ✅ Latência input-feedback <200ms em 3G/4G
- ✅ 4 grids renderizando a 30+ FPS
- ✅ Sincronização sem glitches (0 dessincronia)
- ✅ Reconexão em <30s bem-sucedida
- ✅ Score salvo 100% das vezes (zero perda)

**Dependências:** 
- Fase 1 + Fase 2 completas
- QA setup (testes de sincronização, latência)

**Aprovação:** Teste com 20 sessões simultâneas, 4 players cada, 30 min de gameplay sem erro

---

## 🎯 FASE 4: 2º Jogo + Polish + Deploy (4 Semanas)

**Objetivo:** Adicionar Pac-Man, leaderboard global, refinar UX, fazer deploy em produção.

**O que será entregue:**
- ✅ Pac-Man multiplayer funcional
- ✅ Menu para escolher jogo (Tetris / Pac-Man)
- ✅ Leaderboard global (Top 10)
- ✅ Histórico de partidas do jogador
- ✅ CI/CD pipeline configurado
- ✅ Deploy em produção (staging + live)
- ✅ Monitoramento ativo (Sentry, logs)

**Arquitetura:**
- 2 game loops independentes (Tetris vs Pac-Man)
- Leaderboard com queries otimizadas
- CDN para assets (imagens, sons)
- Monitoramento: Sentry, New Relic ou CloudWatch

**User Stories (Backlog Detalhado em backlog-fase-4.md):**
- US-017: Menu de escolha de jogo
- US-018: Pac-Man controles (↑ ↓ ← →)
- US-019: Histórico de partidas persistido
- US-020: Leaderboard global acessível

**Métricas de Saída:**
- ✅ 2 jogos funcionando em paralelo
- ✅ Leaderboard com >1000 partidas
- ✅ CI/CD green 100% (main sempre deployável)
- ✅ Zero downtime deploy
- ✅ SLA 99.5% uptime comprovado

**Dependências:** 
- Fases 1-3 completas
- DevOps setup (CI/CD, infra cloud)
- QA testes e2e

**Aprovação:** Beta com 100+ usuários reais, taxa de retorno >60%, uptime 99.5% em 1 semana

---

## 📊 Fases Futuras (Pós-MVP, não priorizado ainda)

### Fase 5: Mais Jogos (Semanas 15-18)
- Space Invaders multiplayer
- Snake multiplayer
- Pong multiplayer
- Cada jogo segue template estabelecido

### Fase 6: Social & Persistência (Semanas 19-22)
- Perfil do jogador (histórico completo)
- Convites por link para amigos
- Chat simples durante jogo
- Replay/vídeo de partidas

### Fase 7: Monetização (Semanas 23+)
- Cosmetics (skins, temas, avatares premium)
- Subscription: premium themes, histórico ilimitado
- Branded sessions (logo customizado)

---

## 🚨 Marcos Críticos (Go/No-Go)

| Marco | Critério | Quando |
|-------|----------|--------|
| **Fase 1 Done** | Tetris funcionando, 0 crashes | Semana 4 |
| **Fase 2 Done** | QR + 4 players conectam | Semana 6 |
| **Fase 3 Done** | Multiplayer testado, leaderboard OK | Semana 10 |
| **MVP Live** | Deploy em produção, SLA 99.5% | Semana 14 |
| **Beta Success** | 100+ usuários, taxa retorno >60% | Semana 16 |

---

## ⚠️ Riscos & Contingências

| Risco | Impacto | Plano B |
|-------|--------|---------|
| Sincronização complexa | Atrasa Fase 3 | Event sourcing; consultar Carlos (Tech Lead) em Semana 7 |
| Latência >200ms em 3G | Frustração do usuário | Throttling agressivo; testar em rede degradada Semana 5 |
| Banco não escala para 1000 partidas | Leaderboard lento | Implementar cache Redis, índices no PG |
| Deploy falha em produção | Downtime | Rollback automático; teste em staging 48h antes |

---

## 📋 Decisões Pendentes

Antes de começar Sprint 1, confirmar com chefe:

1. ✅ **Qual segundo jogo?** → Pac-Man (confirmado)
2. ✅ **Autenticação?** → Nome simples (confirmado)
3. ❓ **Cloud provider?** → AWS / Railway / Vercel? (pendente)
4. ❓ **Monetização MVP?** → Sim ou não? (pendente)
5. ❓ **Testes com usuários?** → Quando e quantos? (pendente)

---

## 📞 Donos por Fase

| Fase | Tech Lead | Dev Backend | Dev Frontend | Designer | QA |
|------|-----------|-------------|--------------|----------|-----|
| 1 | Carlos | Diego | Bianca | Luna | Paula |
| 2 | Carlos | Diego | Bianca | - | Paula |
| 3 | Carlos | Diego | Bianca | - | Paula |
| 4 | Carlos | Diego | Bianca | Luna | Paula |

**DevOps (Bruno):** Ativo a partir de Fase 2  
**Dados (Thiago):** Ativo em Fase 4 (leaderboard)  
**Segurança (Vera):** Review em Fase 4 (dados de score)  
**Tech Writer (Júlia):** Documentação contínua  

---

**Versão:** 1.0  
**Aprovado:** Chefe  
**Próxima revisão:** Fim de Fase 1
