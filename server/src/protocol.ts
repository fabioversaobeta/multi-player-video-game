// Contrato de mensagens WebSocket entre servidor, TV e celulares.
// O celular envia apenas INPUTS; o servidor é a fonte da verdade.

export type InputAction = 'left' | 'right' | 'down' | 'a' | 'b' | 'pause';

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

/** Quadro do jogo: enviado apenas à TV. */
export interface GameFrame {
  boards: Record<string, BoardFrame>;
}

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
}

export interface ServerToClient {
  'room:state': (s: RoomState) => void;
  'game:frame': (f: GameFrame) => void;
}
