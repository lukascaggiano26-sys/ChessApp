import stockfishUrl from 'stockfish/bin/stockfish-18-lite-single.js?url';
import { parseBestMove, parseInfoLine, type StockfishEvaluation } from './stockfishAnalysis';
import type { PositionAnalyzer, PositionAnalysis } from './moveReviewTypes';

export interface StockfishMoveReviewAnalyzerOptions {
  depth?: number;
  timeoutMs?: number;
}

const DEFAULT_DEPTH = 14;
const DEFAULT_TIMEOUT_MS = 5000;

export class StockfishMoveReviewAnalyzer implements PositionAnalyzer {
  private readonly worker: Worker;

  private isReady = false;

  private readonly depth: number;

  private readonly timeoutMs: number;

  constructor(options?: StockfishMoveReviewAnalyzerOptions) {
    this.depth = options?.depth ?? DEFAULT_DEPTH;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.worker = new Worker(stockfishUrl, { type: 'classic' });
    this.worker.postMessage('uci');
    this.worker.postMessage('isready');
  }

  public analyzePosition = async (fen: string): Promise<PositionAnalysis> => {
    await this.ensureReady();

    return await new Promise<PositionAnalysis>((resolve) => {
      let evaluation: StockfishEvaluation | null = null;
      let bestMoveUci: string | null = null;
      let bestLine: string[] | null = null;

      const timerId = window.setTimeout(() => {
        this.worker.postMessage('stop');
        cleanup();
        resolve({ bestMoveUci, bestLine, evaluation });
      }, this.timeoutMs);

      const cleanup = () => {
        window.clearTimeout(timerId);
        this.worker.removeEventListener('message', onMessage);
      };

      const onMessage = (event: MessageEvent<unknown>) => {
        const line = typeof event.data === 'string' ? event.data : '';
        if (!line) {
          return;
        }

        const info = parseInfoLine(line, fen);
        if (info?.evaluation) {
          evaluation = info.evaluation;
        }
        if (info?.bestLine) {
          bestLine = info.bestLine;
        }

        const bestMove = parseBestMove(line);
        if (!bestMove) {
          return;
        }

        bestMoveUci = `${bestMove.from}${bestMove.to}`;
        cleanup();
        resolve({ bestMoveUci, bestLine, evaluation });
      };

      this.worker.addEventListener('message', onMessage);
      this.worker.postMessage('stop');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${this.depth}`);
    });
  };

  public terminate = () => {
    this.worker.terminate();
  };

  private ensureReady = async (): Promise<void> => {
    if (this.isReady) {
      return;
    }

    await new Promise<void>((resolve) => {
      const onMessage = (event: MessageEvent<unknown>) => {
        const line = typeof event.data === 'string' ? event.data : '';
        if (line.startsWith('readyok')) {
          this.isReady = true;
          this.worker.removeEventListener('message', onMessage);
          resolve();
        }
      };

      this.worker.addEventListener('message', onMessage);
      this.worker.postMessage('isready');
    });
  };
}
