# Decisões do produto

Fonte de verdade das regras do projeto. Decisões do dono do produto (DP) e escolhas provisórias da equipe de desenvolvimento (DEV), que podem ser revistas.

## 1. Sessão e jogadores (DP)
- Sessão síncrona, de **1 a 4 jogadores**. A arquitetura não deve se limitar a 4 (talvez 6 no futuro).
- **Sem timeout de espera.** Cada jogador entra e marca **"pronto"**; quando **todos os presentes** estão prontos, a partida começa (com 1, 2, 3 ou 4). Todos começam simultaneamente.
- **Entrada somente por QR Code** (leva ao código/endereço da sala).
- **Tudo anônimo, sem autenticação.** O jogador só informa um **nome** (para identificar quem pontua), que pode mudar a cada sessão. Fica no localStorage para facilitar a próxima vez.
- **Fluxo da sala:** a TV cria a sala → código/QR no celular → jogadores prontos → partida → fim → volta para a sala. **A sala desaparece quando todos saem.**
- **Tudo é efêmero** no servidor. O que está no localStorage pode ser resetado sem problema.
- Escala inicial pequena (mínimo de 2 sessões simultâneas), sem limitar a aplicação a um número. Escala global só perto da comercialização.

## 2. Desconexão e inatividade (DP)
- Se o jogador cair, ficar parado, fechar a tela ou perder bateria: **nada pausa e nada muda**. O jogo dele continua como se nenhum comando fosse enviado.
- **Não punir pela aplicação** e **não exibir alerta** de desconexão. O efeito aparece só na pontuação final.
- A pontuação final mostra **todos que iniciaram a sessão**, inclusive quem desconectou.
- Ao reconectar, o jogador recebe o estado atual completo.

## 3. Regras de jogo e pontuação (DP)
- Pontuação por jogo; **quem tem mais pontos vence**.
- O vencedor de cada partida ganha **1 ponto de vitória** (troféu). Vitórias se acumulam na sessão, entre jogos iguais ou diferentes.
- **Placar da sessão (Fase 4):** todos os jogadores, ordenados por vitórias, apenas em memória. Sem leaderboard global.
- **Recorde local:** só no navegador (localStorage), **top 5 por jogo** com posição, nome e pontuação. Configurações permite **resetar**. Não precisa ser seguro.
- **Tabuleiro compartilhado (jogos futuros):** quem perde as vidas espera os demais; a partida termina quando todos perdem ou cumprem o objetivo. **Sem colisão entre jogadores** (friendly-fire desligado), salvo exceção por jogo.
- Fim individual ou geral; se individual, a partida só encerra quando todos chegarem ao fim.

## 4. Tetris — Fase 1 (DP)
- Tabuleiro **10×20**, **7 peças** (I, O, T, S, Z, J, L), **um tabuleiro por jogador**.
- **Aceleração** progressiva com o tempo. **Sem limite de tempo**: a partida de cada jogador acaba quando o tabuleiro enche.
- Quem termina vê um **aviso com sua pontuação** até todos terminarem.
- No fim: **ranking final (1º a 4º) com pontuações** e volta ao lobby.
- Entrada inválida (mover contra a parede, rotação impossível) é **rejeitada silenciosamente** pelo servidor.

## 4b. Snake (DEV, provisório; 2º jogo ainda a confirmar em reunião)
- **Arena compartilhada** 32×18, 1 a 4 jogadores (a estrutura aceita 6), cada um com sua cobra.
- **Controles:** esquerda/direita giram a cobra em relação ao sentido em que ela anda (não há reversão possível). Demais botões são ignorados.
- **Pontuação:** +10 por comida; há sempre `max(2, jogadores)` comidas na arena. Comer faz a cobra crescer.
- **Eliminação:** bater na parede ou em qualquer cobra (inclusive a própria); cabeça contra cabeça elimina as duas. Exceção à regra de "sem colisão entre jogadores" (§3), pois a colisão é central no Snake.
- **Fim:** a partida termina quando todas as cobras morrem; quem morre espera os demais (§3). Ranking por pontos.
- **Velocidade:** 5 casas/s, acelerando até 10 casas/s a cada 25 s de partida.
- **Escolha do jogo:** feita no lobby, pela TV ou por qualquer celular; trocar o jogo zera os "prontos".

## 5. Controles no celular (DP)
- **Setas** (esquerda, direita, descer rápido), **Pausa**, **Botão A** (confirma) e **Botão B** (volta).
- Botões grandes, feedback visual ao toque (e vibração quando disponível), modo escuro.
- TV: fonte legível a 2–3 m, fundo escuro com cores retrô; **não depender só de cor** para identificar jogadores (nome + cor + número).

## 6. Latência (DP)
- **Não bloqueante.** Será avaliada só depois de testes reais do dono do produto (Fase 3). Se for problema, ele avisa, mesmo exigindo refatoração.
- Os números citados (150–200 ms) são referência, não critério de aceite.

## 7. Segurança (DP)
Sem autenticação; manipulação não é preocupação inicial. O jogador só envia comandos e o **servidor decide**. Pontuação do localStorage pode ser adulterada sem consequência.

## 8. Infraestrutura (DP)
- Hospedagem: **Railway** (backend) + **Vercel** (frontend). Tempo real: **WebSocket** (Socket.io).
- Sem monetização no MVP.
- Testes com usuários reais: com a família, em data definida pelo dono do produto.

## 9. Escolhas provisórias de desenvolvimento (DEV)
Pontos que estavam em aberto e foram decididos para destravar a Fase 1:

| Tema | Escolha |
|---|---|
| Pontuação do Tetris | +10 por peça travada, +1 por célula em "descer"; linhas: 100 / 300 / 500 / 800 (1–4) |
| Botões | A = girar a peça; B = queda instantânea (Tetris); nos menus, A confirma (ex.: voltar à sala) |
| Pausa | Ignorada no multiplayer (nada pausa); registrada na auditoria |
| Feedback de input inválido | Nenhum (rejeição silenciosa); só aparece no log de auditoria |
| Estado do backend | Só memória; sala some 30 s após ficar sem TV e sem jogadores |
| Aceleração | Nível sobe a cada 10 linhas **e** a cada 30 s de jogo (máx. 15) |
| Frontend | Vite + React + TypeScript, canvas simples para o tabuleiro |

## 10. Ainda em aberto
- Feedback sutil de input inválido (flash/vibração) proposto pela designer vs. rejeição silenciosa.
- CI/CD e ambientes; cobertura mínima para merge (proposta: 80% backend / 70% frontend).
- Datas e público dos testes reais.
- Fase 4: qual será o 2º jogo e as regras de tabuleiro compartilhado.
