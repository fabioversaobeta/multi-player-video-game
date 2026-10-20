// Contrato de mensagens WebSocket entre servidor, TV e celulares.
// O celular envia apenas INPUTS; o servidor é a fonte da verdade.

export type InputAction = 'up' | 'left' | 'right' | 'down' | 'a' | 'b' | 'pause';

export type GameId = 'tetris' | 'snake' | 'pong' | 'invaders' | 'pacman' | 'bomberman' | 'topgear' | 'doodle' | 'asteroids';

export interface GameOption {
  id: GameId;
  name: string;
}

export type Phase = 'lobby' | 'countdown' | 'playing' | 'results';

export interface PlayerInfo {
  id: string;
  name: string;
  color: string;
  ready: boolean;
  connected: boolean;
  // Preenchidos durante/depois da partida
  score: number;
  over: boolean;
}

export interface RankingEntry {
  position: number;
  playerId: string;
  name: string;
  color: string;
  score: number;
}

/** Estado leve da sala: enviado a TV e celulares quando algo muda. */
export interface RoomState {
  code: string;
  phase: Phase;
  /** Jogo escolhido para a próxima (ou atual) partida. */
  game: GameId;
  /** Jogos disponíveis para escolher no lobby. */
  games: GameOption[];
  maxPlayers: number;
  /** O jogo atual aceita pausa? Se falso, o controle não exibe o botão. */
  canPause: boolean;
  countdown: number | null;
  /** Id único da partida atual (muda a cada partida); permite ao cliente não gravar o mesmo resultado duas vezes. */
  matchId: string | null;
  players: PlayerInfo[];
  ranking: RankingEntry[] | null;
}

export interface BoardFrame {
  /** 10x20 achatado (linha a linha); 0 = vazio, 1..7 = tipo da peça (inclui a peça ativa). */
  cells: number[];
  next: number;
  score: number;
  lines: number;
  level: number;
  over: boolean;
}

export interface SnakeView {
  id: string;
  /** Casas [x, y] ocupadas, cabeça primeiro; vazio se a cobra morreu. */
  cells: [number, number][];
  alive: boolean;
  lives: number;
  score: number;
}

/** Quadro do jogo: enviado apenas à TV. O formato depende do jogo (campo `game`). */
export type GameFrame =
  | { game: 'tetris'; boards: Record<string, BoardFrame> }
  | { game: 'snake'; cols: number; rows: number; foods: [number, number][]; snakes: SnakeView[] }
  | {
      game: 'pong';
      w: number;
      h: number;
      paddleH: number;
      ball: { x: number; y: number };
      /** Esquerda e direita; `id` nulo = raquete controlada pelo servidor (CPU). */
      paddles: { id: string | null; x: number; y: number; score: number }[];
    }
  | {
      game: 'invaders';
      w: number;
      h: number;
      shipY: number;
      shipW: number;
      shipH: number;
      alienW: number;
      alienH: number;
      wave: number;
      /** Centro de cada invasor vivo; `row` define a cor. */
      aliens: { x: number; y: number; row: number }[];
      shots: { x: number; y: number; enemy: boolean }[];
      ships: { id: string; x: number; lives: number; score: number; blink: boolean }[];
    }
  | {
      game: 'pacman';
      cols: number;
      rows: number;
      /** Uma string por linha: '#' parede, '.' ponto, 'o' pílula, 'H' casa dos fantasmas, ' ' vazio. */
      grid: string[];
      level: number;
      /** Fantasmas assustados (pílula ativa); `flash` = prestes a acabar. */
      frightened: boolean;
      flash: boolean;
      /** `face`: 0 cima, 1 direita, 2 baixo, 3 esquerda. Jogador eliminado tem lives 0. */
      pacs: { id: string; x: number; y: number; face: number; lives: number; score: number; blink: boolean }[];
      ghosts: { x: number; y: number; kind: number; scared: boolean }[];
    }
  | {
      game: 'bomberman';
      cols: number;
      rows: number;
      /** Uma string por linha: '#' pilar/borda, 'B' bloco destrutível, ' ' livre. */
      grid: string[];
      secondsLeft: number;
      /** `urgent` = prestes a explodir. */
      bombs: { x: number; y: number; urgent: boolean }[];
      flames: { x: number; y: number }[];
      /** Jogador morto tem alive falso e posição -1. */
      players: { id: string; x: number; y: number; alive: boolean; score: number }[];
    }
  | {
      game: 'topgear';
      /** Comprimento da pista e do trecho de cada curva. */
      length: number;
      segLen: number;
      /** Curva de cada trecho: -1 (esquerda) a 1 (direita). */
      curves: number[];
      /** Carros parados na pista (x de -1 a 1). */
      obstacles: { x: number; z: number }[];
      secondsLeft: number;
      /** `x` de -1 a 1 = pista; `place` 0 até cruzar a chegada; `blink` = batida recente. */
      cars: { id: string; x: number; z: number; speed: number; charges: number; turbo: boolean; finished: boolean; place: number; blink: boolean; score: number }[];
    }
  | {
      game: 'doodle';
      w: number;
      h: number;
      platformW: number;
      secondsLeft: number;
      /** Cada jogador tem a sua visão: `cam` = altura da base da tela; só as plataformas visíveis (frágeis já quebradas somem). */
      jumpers: {
        id: string; x: number; y: number; vy: number; face: number; cam: number; alive: boolean; score: number;
        platforms: { x: number; y: number; kind: 'normal' | 'moving' | 'fragile' }[];
      }[];
    }
  | {
      game: 'asteroids';
      /** Arena única que dá a volta; `angle` em radianos (0 = direita, y para cima). */
      w: number;
      h: number;
      shipR: number;
      secondsLeft: number;
      ships: { id: string; x: number; y: number; angle: number; alive: boolean; lives: number; invuln: boolean; thrusting: boolean; score: number }[];
      rocks: { x: number; y: number; r: number }[];
      bullets: { x: number; y: number; owner: string }[];
    };

export interface ClientToServer {
  'tv:create': (ack: (r: { code: string; tvToken: string }) => void) => void;
  'tv:resume': (
    p: { code: string; tvToken: string },
    ack: (r: { ok: boolean }) => void,
  ) => void;
  'player:join': (
    p: { code: string; name: string; token?: string },
    ack: (r: { ok: true; playerId: string; token: string } | { ok: false; error: string }) => void,
  ) => void;
  'player:ready': (p: { ready: boolean }) => void;
  'player:input': (p: { action: InputAction }) => void;
  'room:back': () => void;
  /** Escolhe o jogo (só vale no lobby). */
  'room:game': (p: { game: GameId }) => void;
}

export interface ServerToClient {
  'room:state': (s: RoomState) => void;
  'game:frame': (f: GameFrame) => void;
  /** Enviado só ao celular do jogador (para tocar o som): linhas fechadas, comida, batida. */
  'player:sfx': (p: { kind: 'lines' | 'eat' | 'crash' | 'drop'; value: number }) => void;
}
