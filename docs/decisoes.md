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

## 4c. Pong (DEV, provisório)
- **Duelo de raquetes** num campo 100×60: o 1º jogador da sala fica à esquerda, o 2º à direita; com 1 jogador, a raquete da direita é a **CPU**; do 3º em diante só assistem.
- **Controles:** botões ▲ (esquerda) e ▼ (direita) nos cantos; cada comando move a raquete um passo fixo (o celular repete enquanto o botão está pressionado).
- **Bola:** o ângulo de saída depende do ponto de contato na raquete; cada rebatida acelera até um limite. Quem tomou o ponto recebe o saque.
- **Fim:** o primeiro a fazer **7 pontos** vence; o ranking é pelos pontos. Sem pausa.

## 4d. Space Invaders (DEV, provisório)
- **Cooperativo:** todos defendem a mesma arena 100×70, cada um com sua nave (cor do jogador) embaixo; pelotão de 9×4 invasores.
- **Controles:** ◀ ▶ movem a nave (repete ao segurar) e **FOGO** atira; só **1 tiro por vez** por jogador.
- **Pelotão:** anda para o lado e desce ao bater na borda; acelera conforme sobram menos invasores e a cada onda. Os invasores soltam bombas.
- **Vidas:** 3 por jogador, com ~2 s de invulnerabilidade após ser atingido. Sem vidas, o jogador está eliminado.
- **Pontos:** 30 (linha de cima), 20 (duas do meio), 10 (linha de baixo) para quem acertou. Limpar a onda inicia outra mais rápida e mais baixa.
- **Fim:** todos eliminados **ou** os invasores chegam à linha das naves (todos perdem). Ranking pelos pontos. Sem pausa.

## 4e. Pac-Man (DEV, provisório)
- **Cooperativo:** todos os jogadores comem os pontos do **mesmo labirinto** 19×21 e fogem dos mesmos fantasmas. Jogadores não colidem entre si.
- **Controles:** cruz ▲ ◀ ▶ ▼ no celular; o Pac-Man **segue andando** até bater numa parede e vira quando a direção pedida estiver livre. O túnel da linha central liga as bordas.
- **Ritmo:** jogador a ~3,75 casas/s; fantasmas a 2,5 casas/s no nível 1 (aceleram a cada 2 níveis); o desenho desliza entre as casas (o servidor envia posição fracionária). **Fantasmas:** 1 no nível 1 e +1 a cada nível (máx. 8); sempre mais lentos que o jogador. Vagam pelo labirinto e só **perseguem** quem chega a até 6 casas (de caminho); se o jogador se afasta mais de 10 casas, **perdem o rastro** e voltam a vagar. **Até o jogador fazer o 1º movimento ele fica invencível e invisível aos fantasmas, e a casa dos fantasmas não libera ninguém** (o Pac-Man pisca na TV nesse período).
- **Pontos:** 10 por ponto, 50 por pílula, 200 por fantasma assustado (para quem comeu). Pílula assusta todos os fantasmas (~8 s no nível 1, menos nos seguintes); o fantasma comido volta à casa.
- **Vidas:** 3 por jogador; ao ser pego, reaparece no ponto de partida com ~3 s de invulnerabilidade. Sem vidas, está eliminado.
- **Níveis:** limpar todos os pontos reinicia o labirinto com fantasmas mais rápidos e pílulas mais curtas.
- **Fim:** todos eliminados. Ranking pelos pontos. Sem pausa. Novo comando `up` no protocolo (`InputAction`).

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
