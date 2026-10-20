import { useEffect, useRef, useState } from 'react';
import type { InputAction } from '@mpvg/shared';

interface Props {
  label: string;
  action: InputAction;
  send: (a: InputAction) => void;
  /** Segurar o botão repete o comando. */
  repeat?: boolean;
  className?: string;
}

export function PadButton({ label, action, send, repeat, className }: Props) {
  const timers = useRef<{ t?: number; i?: number }>({});
  const [down, setDown] = useState(false);
  const stop = () => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
    setDown(false);
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDown(true);
    send(action);
    navigator.vibrate?.(15);
    if (repeat) {
      timers.current.t = window.setTimeout(() => {
        timers.current.i = window.setInterval(() => send(action), 90);
      }, 220);
    }
  };
  useEffect(() => stop, []);
  return (
    <button
      className={`pad-btn ${className ?? ''}${down ? ' down' : ''}`}
      onPointerDown={start} onPointerUp={stop} onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
