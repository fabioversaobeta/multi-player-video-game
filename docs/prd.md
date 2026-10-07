# PRD - Multi-Player Video Game

## 📋 Visão Geral

**Nome:** Multi-Player Video Game  
**Objetivo:** Plataforma de jogos retro multiplayer para jogar em grupo na TV, onde cada jogador controla via celular. Experiência social nostálgica, competitiva e sem fricção.

**Público-alvo:** Jovens adultos (18-40 anos) que cresceram com consoles clássicos (Super Nintendo, Playstation 1) ou têm interesse em jogos retro.

**Diferencial competitivo:**
- One-click entry via QR code (sem cadastro complicado)
- Multiplayer até 4 jogadores simultâneos
- Ranking de sessão + leaderboard global
- Jogos retro clássicos com controle adaptado para celular

---

## 🎮 Escopo - Fase 1 até 4

### **Jogos Suportados**
1. **Tetris** (MVP - Fase 1)
2. **Pac-Man** (Fase 4)
3. **Snake** (Fase futura)
4. **Space Invaders** (Fase futura)
5. **Pong** (Fase futura)
6. **Top Gear Simplificado** (Fase futura)

### **Mecânica Competitiva**
- **Score Individual:** Cada jogador tem seu próprio score
- **Ranking de Sessão:** Ao final do jogo, ranking visível (1º, 2º, 3º, 4º)
- **Leaderboard Global:** Top 10 all-time persistido no banco
- **Nome Customizável:** Cada jogador escolhe seu nome ao conectar

### **Conectividade**
- **Internet:** Cada jogador pode usar seu próprio plano de dados ou Wi-Fi compartilhado
- **Requisito:** Conexão estável para WebSocket (latência <200ms aceitável)
- **Autenticação:** Simples por nome (sem login/senha no MVP)

### **Features Principais**

#### **Entrada & Sessão**
- [x] Host gera QR code na TV
- [x] Jogador escaneia QR com celular
- [x] Inserir nome e escolher avatar/cor
- [x] Máximo 4 jogadores por sessão
- [x] Lista em tempo real de conectados na TV

#### **Gameplay**
- [x] Tetris: 10x20 grid, 7 peças, limpeza de linhas, aumento de dificuldade
- [x] Controles: Botões grandes (← → ⟳ ↓) no celular
- [x] Score em tempo real na TV
- [x] Game over individual (outros continuam jogando)
- [x] Ranking atualiza conforme jogadores terminam

#### **Persistência & Dados**
- [x] Score salvo por partida (player, game, score, posição, timestamp)
- [x] Leaderboard global (Top 10 por jogo)
- [x] Histórico de partidas do jogador (opcional MVP)

---

## 🚫 Out of Scope - Fase 1 a 4

- ❌ Login/Autenticação com senha (nome simples apenas)
- ❌ Cosmetics ou skins premium (validar primeiro com usuários)
- ❌ Replay de partidas
- ❌ Chat/Comunicação entre jogadores
- ❌ Suporte a mobile-only (requer tela principal em TV)
- ❌ Offline mode
- ❌ Suporte a mais de 4 jogadores por sessão

---

## 📱 Plataformas & Dispositivos

| Contexto | Plataforma | Requisitos |
|----------|-----------|-----------|
| **TV/Host** | Navegador (Chrome, Firefox, Safari) | Tela ≥32", conexão internet estável |
| **Celular** | iOS/Android (navegador ou app web) | Tela ≥4", internet (dados/Wi-Fi) |
| **Servidor** | Node.js + Socket.io | Latência <200ms para jogabilidade |

---

## 🎯 Requisitos Funcionais por Fase

### **Fase 1 - Tetris Single-Player (MVP Mecânica)**
**Objetivo:** Validar game loop antes de multiplayer

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| RF-001 | Game loop Tetris: peças caem, rotação, colisão | CRÍTICA |
| RF-002 | Limpeza de linhas automática | CRÍTICA |
| RF-003 | Score atualiza por peça e linha | CRÍTICA |
| RF-004 | Dificuldade aumenta (velocidade) | ALTA |
| RF-005 | Game over detecta quando peça não cabe | CRÍTICA |
| RF-006 | Botão "Novo Jogo" reinicia tudo | ALTA |
| RF-007 | Melhor score persistido localmente | MÉDIA |

### **Fase 2 - Infraestrutura Multiplayer**
**Objetivo:** Backend + entrada de jogadores

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| RF-008 | Gerar QR code para sessão (TTL 10 min) | CRÍTICA |
| RF-009 | Celular: escanear QR, inserir nome, escolher cor | CRÍTICA |
| RF-010 | TV: lista de jogadores conectados em tempo real | CRÍTICA |
| RF-011 | Máximo 4 jogadores por sessão (rejeitar 5º) | CRÍTICA |
| RF-012 | Host: botão "Iniciar Jogo" com countdown 3s | ALTA |
| RF-013 | Reconexão automática em 30s após desconexão | ALTA |
| RF-014 | Timeout: desconectar após 30s sem atividade | MÉDIA |

### **Fase 3 - Tetris Multiplayer Sincronizado**
**Objetivo:** 4 grids sincronizados, ranking, persistência

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| RF-015 | Inputs do celular sincronizam com servidor (<200ms) | CRÍTICA |
| RF-016 | TV: 4 mini-grids lado a lado | CRÍTICA |
| RF-017 | Score individual por jogador, atualiza em tempo real | CRÍTICA |
| RF-018 | Ranking em tempo real (1º, 2º, 3º, 4º) | ALTA |
| RF-019 | Game over individual (grid fica inativo) | CRÍTICA |
| RF-020 | Resultado final salvo no banco (player, score, posição) | CRÍTICA |
| RF-021 | Tela de resultados com ranking e botão "Novo Jogo" | ALTA |

### **Fase 4 - 2º Jogo + Leaderboard Global**
**Objetivo:** Pac-Man + dados globais

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| RF-022 | Menu pré-sessão: escolher Tetris ou Pac-Man | ALTA |
| RF-023 | Pac-Man: grid 21x21, pellets, fantasmas com IA | ALTA |
| RF-024 | Controles Pac-Man: ↑ ↓ ← → sincronizados | ALTA |
| RF-025 | Coleta de pellets: +10 pts, power-up: +50 pts | ALTA |
| RF-026 | Game over: 3 vidas, colisão com fantasma = -1 | ALTA |
| RF-027 | Leaderboard global: Top 10 all-time | ALTA |
| RF-028 | Estatísticas do jogador: total partidas, melhor score | MÉDIA |

---

## 🎨 Requisitos Não-Funcionais

| Atributo | Critério | Justificativa |
|----------|----------|---|
| **Latência** | <200ms entre input celular e atualização TV | Gameplay em tempo real |
| **Disponibilidade** | 99.5% uptime | Sessões não podem cair no meio do jogo |
| **Performance** | 30+ FPS na TV com 4 grids | Experiência fluida |
| **Escalabilidade** | 100+ sessões simultâneas | Suportar crescimento inicial |
| **Acessibilidade** | WCAG 2.1 AA (cores + padrões, fontes grandes) | Público misto (idade/deficiências) |
| **Segurança** | Validação server-side de inputs | Evitar cheating (score falso) |
| **Usabilidade** | Fluxo QR → nome → jogo em <30s | Sem fricção |

---

## 📊 Métricas de Sucesso

| Métrica | Alvo | Período |
|---------|------|---------|
| Taxa de conclusão de jogo | >80% | 1º mês |
| Tempo médio de sessão | 10-15 min | 1º mês |
| Retenção (volta no mês seguinte) | >40% | 3 meses |
| NPS (Net Promoter Score) | >50 | 3 meses |
| Tempo de entrada (QR → jogo) | <30s | Launch |
| Uptime | >99.5% | Contínuo |

---

## 🔄 Glossário

| Termo | Definição |
|-------|-----------|
| **Sessão** | Uma instância de jogo com até 4 jogadores |
| **Host/TV** | Tela principal (navegador desktop/tablet) que exibe jogo e controla sessão |
| **Celular** | Dispositivo móvel (iOS/Android) que controla o jogador via botões |
| **Ranking de Sessão** | Posição final dos 4 jogadores após jogo terminar |
| **Leaderboard Global** | Top 10 all-time scores, persistido no banco |
| **Score** | Pontos acumulados durante partida (Tetris: linhas; Pac-Man: pellets) |
| **Game Over** | Momento em que jogador perde (Tetris: peça no topo; Pac-Man: 0 vidas) |
| **QR Code** | Código para celular escanear e entrar na sessão |
| **Avatar/Cor** | Identificação visual do jogador (vermelho, azul, amarelo, verde) |
| **Pellet** | Item a coletar em Pac-Man (+10 pts) |
| **Power-up** | Item especial que muda gameplay (Pac-Man: fantasmas vulneráveis) |

---

## 📝 Próximos Passos

1. ✅ PRD aprovado pelo chefe
2. ⏳ Documentos técnicos: arquitetura, design, backlog detalhado
3. ⏳ Prototipagem de UI (wireframes TV + celular)
4. ⏳ Estrutura de banco de dados
5. ⏳ Planning da Sprint 1 (Fase 1 - Tetris single-player)

---

**Versão:** 1.0  
**Última atualização:** 2026-10-07  
**Proprietário:** Marina (Product Owner)
