// Tudo aqui é conveniência local: pode ser resetado e adulterado sem consequência.
const NAME_KEY = 'mpvg:name';
const RECORDS_KEY = 'mpvg:records';

export interface RecordEntry { pos: number; player: string; score: number }
type Records = Record<string, RecordEntry[]>;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignora */ }
}

export const getName = (): string => read<string>(NAME_KEY, '');
export const saveName = (name: string): void => write(NAME_KEY, name);

export function getRecords(game: string): RecordEntry[] {
  return read<Records>(RECORDS_KEY, {})[game] ?? [];
}

const SAVED_MATCH_KEY = 'mpvg:lastSavedMatch';

/**
 * Grava a pontuação de uma partida no máximo uma vez, mesmo após recarregar a página,
 * reconectar ou abrir duas abas. Persiste o id da última partida gravada.
 */
export function addRecordOnce(game: string, matchId: string, player: string, score: number): RecordEntry[] {
  const key = `${game}:${matchId}:${player}`;
  if (read<string>(SAVED_MATCH_KEY, '') === key) return getRecords(game);
  write(SAVED_MATCH_KEY, key); // marca antes de gravar: a 2ª chamada já encontra a marca
  return addRecord(game, player, score);
}

/** Insere a pontuação no top 5 do jogo. */
export function addRecord(game: string, player: string, score: number): RecordEntry[] {
  if (score <= 0) return getRecords(game);
  const all = read<Records>(RECORDS_KEY, {});
  const list = [...(all[game] ?? []), { pos: 0, player, score }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r, i) => ({ ...r, pos: i + 1 }));
  all[game] = list;
  write(RECORDS_KEY, all);
  return list;
}

export function resetRecords(): void {
  write(RECORDS_KEY, {});
}
