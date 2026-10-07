# PRD: Multi-Player Video Game

## 1. Resumo Executivo

**Produto:** Plataforma de jogos retro multiplayer acessível via QR code  
**Público:** Jovens adultos nostálgicos (18-40 anos)  
**MVP:** Tetris + Pac-Man, até 4 jogadores, leaderboard global  
**Timeline:** 14 semanas  
**Sucesso:** Latência <200ms, 4 players sincronizados, ranking em tempo real  

---

## 2. Problemas que Resolve

| Problema | Solução |
|----------|---------|
| Jogos retro não são acessíveis (emuladores complicados) | Plataforma web 100% online, sem instalação |
| Multiplayer local é difícil em um controle | Cada jogador usa seu celular como controle |
| Sem competição social | Ranking de sessão + leaderboard global |
| Configuração complexa | Escaneie QR → informe nome → pronto |
| Não há nostalgia + conveniência juntas | Jogos clássicos, interface moderna, sem fricção |

---

## 3. Requisitos Funcionais

### 3.1 Fluxo de Entrada (Fase 2)

**RF-001: Geração de Sessão**
- Host abre página da TV
- Clica "Nova Sessão" → gera QR code único
- QR válido por 10 minutos
- QR aponta para `https://seu-dominio/join?session_id=xyz`

**RF-002: Entrada via Celular**
- Jogador escaneia QR
- Pede nome do jogador (campo de texto)
- Oferece 4 cores/avatares (vermelho, azul, amarelo, verde)
- Botão "Conectar"
- Limite: máximo 4 jogadores por sessão

**RF-003: Sincronização de Jogadores**
- TV mostra lista em tempo real de quem conectou
- Nome + cor de cada jogador
- Feedback ao conectar e desconectar
- Status: "aguardando", "pronto", "em jogo"

**RF-004: Início do Jogo**
- Botão "Iniciar" aparece quando ≥1 jogador conectado
- Host clica → countdown 3s na TV + celulares
- Todos recebem `game:start` simultâneamente
- Jogo começa sincronizado

---

### 3.2 Controle via Celular (Fase 3)

**RF-005: Botões de Controle**
- 4 botões grandes no celular:
  - **← Esquerda** | **Direita →** (topo)
  - **⟳ Rotacionar** (centro)
  - **↓ Descer Rápido** (abaixo)
- Feedback visual ao pressionar (cor muda, botão "pressionado")
- Sem gestos (MVP usa botões, mais previsível)

**RF-006: Envio de Input**
- Ao pressionar botão, emite evento `player:input`
- Inclui: session_id, player_id, ação (left, right, rotate, drop)
- Latência alvo: <200ms fim a fim

**RF-007: Validação de Input**
- Servidor valida se movimento é legal no grid
- Se válido: atualiza estado, broadcast para TV
- Se inválido: descarta silenciosamente (sem erro visual)

---

### 3.3 Tetris Multiplayer (Fase 1 + 3)

**RF-008: Game Loop Tetris**
- 7 peças (I, O, T, S, Z, J, L) em cores diferentes
- Grid 10x20 por jogador
- Peça cai automaticamente
- Velocidade aumenta a cada N linhas limpas (ex: a cada 5)

**RF-009: Mecânicas de Tetris**
- Rotação: clockwise, validação de colisão
- Limpeza de linhas: detecta linhas completas, remove e desce linhas acima
- Animação de "pisca" antes de remover
- Próxima peça visível no celular (preview)

**RF-010: Game Over Individual**
- Game over quando peça nova não cabe no topo do grid
- Jogador vira "inativo" (grid cinzento na TV)
- Outros continuam jogando normalmente
- Celular exibe "Você perdeu! Aguarde o final…"

**RF-011: Score Tetris**
- 10 pts por peça colocada
- 100 pts por linha limpa
- Cálculo feito no servidor (source of truth)
- Score exibido em tempo real na TV (embaixo de cada grid)

---

### 3.4 Pac-Man Multiplayer (Fase 4)

**RF-012: Game Loop Pac-Man**
- Grid 21x21 (mazelike)
- 4 Pac-Mans (um por jogador, cores diferentes)
- 1-2 fantasmas compartilhados (sincronizados para todos)
- Pellets espalhados pelo mapa

**RF-013: Mecânicas de Pac-Man**
- Movimento: ↑ ↓ ← → via botões no celular
- Coleta de pellets: desaparecem do mapa, +10 pts
- Power-ups: pellet especial = fantasmas vulneráveis por 5s, +50 pts
- IA de fantasmas: movimento aleatório ou chase simples

**RF-014: Game Over Pac-Man**
- 3 vidas por jogador
- Colisão com fantasma = -1 vida
- 0 vidas = game over, vira espectador
- Condição de vitória: todos pellets coletados OU tempo limite (3 min)

---

### 3.5 TV - Exibição de Gameplay (Fase 3)

**RF-015: Layout de 4 Grids**
- 4 mini-grids lado a lado (ou 2x2 conforme tamanho)
- Cada grid mostra:
  - Nome do jogador + cor (identificação clara)
  - Grid do jogo (Tetris ou Pac-Man)
  - Score atual
  - Status (ativo/game over)
- Fonte grande, legível de 2-3 metros

**RF-016: Ranking em Tempo Real**
- Ranking (1º, 2º, 3º, 4º) embaixo dos grids
- Atualiza conforme scores mudam
- Destaque visual para líder (borda colorida ou fundo)

**RF-017: Feedback Visual**
- Transições suaves entre telas (menu → jogo → resultados)
- Cores retro (fundo preto, peças coloridas, UI clara)
- Sem ambiguidades visuais

---

### 3.6 Resultados & Persistência (Fase 3-4)

**RF-018: Tela de Resultados**
- Exibe ranking final (1º, 2º, 3º, 4º) com scores
- Botões: "Novo Jogo" ou "Voltar ao Menu"
- Mostra por 5-10 segundos automaticamente

**RF-019: Persistência de Resultado**
- Salva no PostgreSQL:
  - player_name, game_type (tetris/pacman), score, position, timestamp
  - session_id (opcional, para rastrear sessão)
- Preparado para leaderboard global

**RF-020: Leaderboard Global**
- GET `/api/leaderboard?game=tetris&limit=10`
- Exibe Top 10 all-time por jogo
- Acessível após cada partida (QR code no celular)
- Ranking: score descending

---

### 3.7 Seleção de Jogo (Fase 4)

**RF-021: Menu de Jogo**
- Tela pré-sessão: escolher entre Tetris ou Pac-Man
- Host seleciona, todos veem qual jogo vai ser
- UI clara, sem confusão

---

## 4. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-001 | Performance | 30+ FPS na TV com 4 grids |
| RNF-002 | Latência | <200ms fim a fim (input → feedback visual) |
| RNF-003 | Escalabilidade | Mínimo 100 sessões simultâneas |
| RNF-004 | Confiabilidade | Reconexão automática em <30s |
| RNF-005 | Disponibilidade | 99.5% uptime (exceto manutenção) |
| RNF-006 | Usabilidade | Zero treinamento necessário |
| RNF-007 | Acessibilidade | WCAG 2.1 AA (contraste, fonte grande) |
| RNF-008 | Segurança | Sem dados sensíveis, apenas score/nome |

---

## 5. Escopo & Out-of-Scope

### ✅ IN-SCOPE

- 2 jogos: Tetris, Pac-Man
- Multiplayer até 4 jogadores
- QR code para entrada
- Ranking de sessão + leaderboard global
- Score individual por jogador
- Reconexão automática
- UI acessível (fonts grandes, contraste)

### ❌ OUT-OF-SCOPE (MVP)

- Chat entre jogadores
- Convites por link/email
- Histórico completo de partidas
- Cosmetics/skins payable
- Social login (Google, Facebook)
- Mobile app nativa (só web)
- Modo offline
- Comentários/replay de partidas
- Pontos de experiência (XP) ou badges

---

## 6. Dependências Externas

- **CDN:** Para assets (imagens, sons retro)
- **WebSocket Server:** Node.js + Socket.io
- **Banco de Dados:** PostgreSQL + Redis
- **Cloud Hosting:** AWS, Railway, Vercel ou similar
- **Monitoramento:** Sentry (erro tracking)

---

## 7. Critérios de Aceite (MVP)

✅ Tetris single e multiplayer funcionais  
✅ Pac-Man multiplayer funcional  
✅ QR code gera e conecta até 4 jogadores  
✅ Latência <200ms testada em 3G/4G  
✅ Ranking sincronizado em tempo real  
✅ Leaderboard global salvo no banco  
✅ Reconexão automática <30s  
✅ UI acessível (WCAG 2.1 AA)  
✅ Zero crashes com 100 sessões simultâneas  
✅ Deploy em staging + produção  

---

## 8. Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Sincronização fora de ordem | Alta | Alto | Server-side source of truth, event sourcing |
| Latência >200ms em 3G | Média | Alto | Throttling de inputs, compressão de dados |
| Desconexões abruptas | Média | Médio | Reconexão automática + cleanup de estado |
| Perda de score em crash | Baixa | Médio | Persistência imediata no PostgreSQL |
| Cheating (manipulação de score) | Baixa | Médio | Validação server-side de todos os inputs |

---

## 9. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Latência P95 | <150ms |
| Taxa de reconexão bem-sucedida | >95% |
| Uptime | 99.5% |
| Partidas completadas sem lag | >98% |
| Usuários únicos por semana | >100 (fase 1) |
| Taxa de retorno (play again) | >60% |

---

## 10. Timeline Resumida

- **Sprint 1-2 (Fase 1):** Tetris single-player
- **Sprint 3-4 (Fase 2):** Infraestrutura multiplayer + QR
- **Sprint 5-6 (Fase 3):** Tetris multiplayer + ranking
- **Sprint 7-10 (Fase 4):** Pac-Man + leaderboard + polish + deploy

---

**Versão:** 1.0  
**Data:** 2026  
**Owner:** Marina (Product Owner)  
**Revisão:** A cada sprint
