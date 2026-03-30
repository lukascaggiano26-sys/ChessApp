import { useEffect, useMemo, useRef, useState } from 'react';
import type { LastMove } from '../board';
import stockfishUrl from 'stockfish/bin/stockfish-18-lite-single.js?url';
import type { StockfishEvaluation } from './stockfishAnalysis';
import { parseBestMove, parseInfoLine } from './stockfishAnalysis';

export interface UseStockfishAnalysisOptions {
  searchDepth?: number;
  timeoutMs?: number;
  debounceMs?: number;
}

export interface StockfishAnalysisResult {
  bestMove: LastMove | null;
  evaluation: StockfishEvaluation | null;
  depth: number;
  isAnalyzing: boolean;
  error: string | null;
}

const DEFAULT_OPTIONS: Required<UseStockfishAnalysisOptions> = {
  searchDepth: 15,
  timeoutMs: 5000,
  debounceMs: 150,
};

const EMPTY_RESULT: StockfishAnalysisResult = {
  bestMove: null,
  evaluation: null,
  depth: 0,
  isAnalyzing: false,
  error: null,
};

const mergeOptions = (options?: UseStockfishAnalysisOptions): Required<UseStockfishAnalysisOptions> => ({
  searchDepth: options?.searchDepth ?? DEFAULT_OPTIONS.searchDepth,
  timeoutMs: options?.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs,
  debounceMs: options?.debounceMs ?? DEFAULT_OPTIONS.debounceMs,
});

export const useStockfishAnalysis = (
  fen: string,
  enabled: boolean,
  options?: UseStockfishAnalysisOptions,
): StockfishAnalysisResult => {
  const [result, setResult] = useState<StockfishAnalysisResult>(EMPTY_RESULT);
  const workerRef = useRef<Worker | null>(null);
  const requestVersionRef = useRef(0);
  const activeVersionRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const latestFenRef = useRef(fen);
  const isSearchRunningRef = useRef(false);
  const runningVersionRef = useRef(0);

  const effectiveOptions = useMemo(() => mergeOptions(options), [options]);

  useEffect(() => {
    latestFenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    if (!enabled || !fen || typeof window === 'undefined' || typeof Worker === 'undefined') {
      requestVersionRef.current += 1;
      activeVersionRef.current = requestVersionRef.current;
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      isSearchRunningRef.current = false;
      setResult(EMPTY_RESULT);
      return;
    }

    if (!workerRef.current) {
      try {
        const worker = new Worker(stockfishUrl, { type: 'classic' });
        workerRef.current = worker;
        readyRef.current = false;

        worker.onmessage = (event: MessageEvent<unknown>) => {
          const line = typeof event.data === 'string' ? event.data : '';
          if (!line) {
            return;
          }

          if (line.startsWith('readyok')) {
            readyRef.current = true;
            return;
          }

          if (!isSearchRunningRef.current || runningVersionRef.current !== activeVersionRef.current) {
            return;
          }

          const bestMove = parseBestMove(line);
          if (bestMove) {
            isSearchRunningRef.current = false;
            setResult((prev) => ({
              ...prev,
              bestMove,
              isAnalyzing: false,
              error: null,
            }));
            return;
          }

          const parsedInfo = parseInfoLine(line, latestFenRef.current);
          if (!parsedInfo) {
            return;
          }

          setResult((prev) => ({
            ...prev,
            evaluation: parsedInfo.evaluation ?? prev.evaluation,
            depth: parsedInfo.depth !== null ? Math.max(prev.depth, parsedInfo.depth) : prev.depth,
            isAnalyzing: true,
            error: null,
          }));
        };

        worker.onerror = () => {
          readyRef.current = false;
          setResult((prev) => ({
            ...prev,
            isAnalyzing: false,
            error: 'Stockfish worker error',
          }));
        };

        worker.postMessage('uci');
        worker.postMessage('isready');
      } catch {
        setResult((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: 'Unable to start Stockfish',
        }));
        return;
      }
    }

    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    activeVersionRef.current = version;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const worker = workerRef.current;
    worker.postMessage('stop');
    isSearchRunningRef.current = false;

    setResult((prev) => ({
      ...prev,
      bestMove: null,
      depth: 0,
      isAnalyzing: true,
      error: null,
    }));

    debounceRef.current = window.setTimeout(() => {
      if (!workerRef.current || version !== activeVersionRef.current) {
        return;
      }

      const liveWorker = workerRef.current;
      if (!readyRef.current) {
        liveWorker.postMessage('isready');
      }

      runningVersionRef.current = version;
      isSearchRunningRef.current = true;
      liveWorker.postMessage('ucinewgame');
      liveWorker.postMessage(`position fen ${fen}`);
      liveWorker.postMessage(`go depth ${effectiveOptions.searchDepth}`);

      timeoutRef.current = window.setTimeout(() => {
        if (!workerRef.current || version !== activeVersionRef.current) {
          return;
        }

        workerRef.current.postMessage('stop');
        isSearchRunningRef.current = false;
        setResult((prev) => ({
          ...prev,
          isAnalyzing: false,
        }));
      }, effectiveOptions.timeoutMs);
    }, effectiveOptions.debounceMs);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      isSearchRunningRef.current = false;
    };
  }, [effectiveOptions.debounceMs, effectiveOptions.searchDepth, effectiveOptions.timeoutMs, enabled, fen]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return result;
};
