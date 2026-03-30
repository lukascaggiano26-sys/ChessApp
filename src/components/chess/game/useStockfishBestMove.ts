import { useEffect, useMemo, useState } from 'react';
import type { LastMove, Square } from '../board';
import stockfishUrl from 'stockfish/bin/stockfish-18-lite-single.js?url';

const SEARCH_DEPTH = 15;
const EVAL_TIMEOUT_MS = 5000;

const parseBestMove = (line: string): LastMove | null => {
  const match = /^bestmove\s([a-h][1-8][a-h][1-8])\b/.exec(line.trim());
  if (!match) {
    return null;
  }
  const uci = match[1];
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
  };
};

export const useStockfishBestMove = (fen: string, enabled: boolean): LastMove | null => {
  const [bestMove, setBestMove] = useState<LastMove | null>(null);

  useEffect(() => {
    if (!enabled || !fen) {
      setBestMove(null);
      return;
    }
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      setBestMove(null);
      return;
    }

    const worker = new Worker(stockfishUrl, { type: 'classic' });
    let finished = false;

    const timeoutId = window.setTimeout(() => {
      if (!finished) {
        setBestMove(null);
        worker.terminate();
      }
    }, EVAL_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<string>) => {
      const raw = typeof event.data === 'string' ? event.data : '';
      const nextBestMove = parseBestMove(raw);
      if (!nextBestMove) {
        return;
      }
      finished = true;
      window.clearTimeout(timeoutId);
      setBestMove(nextBestMove);
      worker.terminate();
    };

    worker.onerror = () => {
      finished = true;
      window.clearTimeout(timeoutId);
      setBestMove(null);
      worker.terminate();
    };

    worker.postMessage('uci');
    worker.postMessage('isready');
    worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${SEARCH_DEPTH}`);

    return () => {
      finished = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
    };
  }, [enabled, fen]);

  return useMemo(() => bestMove, [bestMove]);
};
