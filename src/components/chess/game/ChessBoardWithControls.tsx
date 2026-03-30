import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChessBoard } from '../board';
import type { ChessBoardWithControlsProps } from './types';
import {
  gameLabel,
  getPlayerSideInGame,
  normalizeChessComUsername,
  type ChessComArchivesResponse,
  type ChessComGame,
  type ChessComGamesResponse,
} from './chessComUtils';
import { MaterialAdvantageIndicator } from './MaterialAdvantageIndicator';
import { EvaluationBar } from './EvaluationBar';
import { useStockfishAnalysis } from './useStockfishAnalysis';
import { useChessGame } from './useChessGame';
import './ChessBoardWithControls.css';
import type { StockfishEvaluation } from './stockfishAnalysis';

const turnText = (turn: 'w' | 'b'): string => (turn === 'w' ? 'White to move' : 'Black to move');

const statusText = (status: {
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  insufficientMaterial: boolean;
  inCheck: boolean;
}): string => {
  if (status.checkmate) {
    return 'Checkmate';
  }
  if (status.stalemate) {
    return 'Stalemate';
  }
  if (status.insufficientMaterial) {
    return 'Draw: insufficient material';
  }
  if (status.draw) {
    return 'Draw';
  }
  if (status.inCheck) {
    return 'Check';
  }

  return 'In progress';
};

export const ChessBoardWithControls = ({
  initialFen,
  orientation = 'white',
  className,
  pieceSizeRatio,
  onMove,
  showMoveList = true,
}: ChessBoardWithControlsProps): JSX.Element => {
  const controller = useChessGame({ initialFen, orientation, onMove });
  const { redoMove, undoMove } = controller;
  const [fenInput, setFenInput] = useState(controller.fen);
  const [fenError, setFenError] = useState<string | null>(null);
  const [displayPerspective, setDisplayPerspective] = useState<'white' | 'black'>(orientation);
  const [showBestMove, setShowBestMove] = useState(false);
  const [chessComUsername, setChessComUsername] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [selectedGameUrl, setSelectedGameUrl] = useState('');
  const [loadingGames, setLoadingGames] = useState(false);
  const analysis = useStockfishAnalysis(controller.fen, true);
  const bestMoveArrow = showBestMove ? analysis.bestMove : null;
  
  const lastEvaluationRef = useRef<StockfishEvaluation | null>(null);
  const stableEvaluation = analysis.evaluation ?? lastEvaluationRef.current;
  if (analysis.evaluation !== null) {
    lastEvaluationRef.current = analysis.evaluation;
  }

  useEffect(() => {
    setDisplayPerspective(orientation);
  }, [orientation]);

  const groupedMoves = useMemo(() => {
    const rows: string[] = [];

    for (let i = 0; i < controller.movesSan.length; i += 2) {
      const moveNumber = i / 2 + 1;
      const whiteMove = controller.movesSan[i] ?? '';
      const blackMove = controller.movesSan[i + 1] ?? '';
      rows.push(`${moveNumber}. ${whiteMove}${blackMove ? ` ${blackMove}` : ''}`);
    }

    return rows;
  }, [controller.movesSan]);

  const loadChessComGames = useCallback(async () => {
    const normalizedUsername = normalizeChessComUsername(chessComUsername);
    if (!normalizedUsername) {
      setFetchError('Enter a Chess.com username.');
      return;
    }

    setLoadingGames(true);
    setFetchError(null);

    try {
      const archiveResponse = await fetch(`https://api.chess.com/pub/player/${normalizedUsername}/games/archives`);
      if (!archiveResponse.ok) {
        throw new Error('Could not find archives for that player.');
      }

      const archiveData = (await archiveResponse.json()) as ChessComArchivesResponse;
      const archives = archiveData.archives ?? [];
      if (!archives.length) {
        setGames([]);
        setSelectedGameUrl('');
        setFetchError('No archived games found for that account.');
        return;
      }

      const recentArchives = archives.slice(-3).reverse();
      const archiveGames = await Promise.all(
        recentArchives.map(async (archiveUrl) => {
          const response = await fetch(archiveUrl);
          if (!response.ok) {
            return [] as ChessComGame[];
          }

          const data = (await response.json()) as ChessComGamesResponse;
          return data.games ?? [];
        }),
      );

      const mergedGames = archiveGames
        .flat()
        .filter((game) => Boolean(game.pgn))
        .sort((a, b) => (b.end_time ?? 0) - (a.end_time ?? 0))
        .slice(0, 25);

      setGames(mergedGames);
      setSelectedGameUrl(mergedGames[0]?.url ?? '');

      if (!mergedGames.length) {
        setFetchError('No recent PGN games were returned.');
      }
    } catch {
      setGames([]);
      setSelectedGameUrl('');
      setFetchError('Failed to load games from Chess.com.');
    } finally {
      setLoadingGames(false);
    }
  }, [chessComUsername]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable || tag === 'select';
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        undoMove();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        redoMove();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redoMove, undoMove]);

  return (
    <section className={`chess-shell ${className ?? ''}`.trim()}>
      <div className="chess-toolbar">
        <button type="button" className="chess-btn" onClick={controller.newGame}>
          New game
        </button>
        <button type="button" className="chess-btn" onClick={() => controller.reset(initialFen)}>
          Reset
        </button>
        <button type="button" className="chess-btn" onClick={controller.undoMove} disabled={!controller.canUndo}>
          Undo
        </button>
        <button type="button" className="chess-btn" onClick={controller.redoMove} disabled={!controller.canRedo}>
          Redo
        </button>
        <button
          type="button"
          className="chess-btn"
          onClick={() =>
            setDisplayPerspective((value) => (value === 'white' ? 'black' : 'white'))
          }
        >
          Flip board ({displayPerspective === 'white' ? 'White' : 'Black'} view)
        </button>
        <button
          type="button"
          className="chess-btn"
          onClick={async () => {
            try {
              if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(controller.fen);
              }
            } catch {
              // no-op clipboard fallback
            }
          }}
        >
          Copy FEN
        </button>
      </div>

      <div className="chess-meta">
        <span className="chess-pill">{turnText(controller.turn)}</span>
        <span className="chess-pill">{statusText(controller.status)}</span>
        <MaterialAdvantageIndicator
          fen={controller.fen}
          perspective={displayPerspective}
          className="chess-material-pill"
        />
      </div>

      <div className="chess-layout">
        <div className="board-analysis-stack">
          <EvaluationBar
            evaluation={stableEvaluation}
            perspective={displayPerspective}
            depth={analysis.depth}
            isAnalyzing={analysis.isAnalyzing}
            error={analysis.error}
            className="board-evalbar"
          />
          <ChessBoard
            fen={controller.fen}
            orientation={displayPerspective}
            onSquareClick={controller.onSquareClick}
            selectedSquare={controller.selectedSquare}
            legalMoves={controller.legalMoves}
            lastMove={controller.lastMove}
            checkSquare={controller.checkSquare}
            draggedSquare={controller.draggedSquare}
            dragOverSquare={controller.dragOverSquare}
            onPieceDragStart={controller.onPieceDragStart}
            onPieceDragEnter={controller.onPieceDragEnter}
            onPieceDrop={controller.onPieceDrop}
            onPieceDragEnd={controller.onPieceDragEnd}
            pieceSizeRatio={pieceSizeRatio}
            bestMoveArrow={bestMoveArrow}
          />
        </div>

        <aside className="chess-sidepanel">
          <div className="fen-row">
            <label htmlFor="chesscom-username">Chess.com username</label>
            <div className="inline-row">
              <input
                id="chesscom-username"
                className="fen-input"
                value={chessComUsername}
                onChange={(event) => setChessComUsername(event.target.value)}
                placeholder="e.g. hikaru"
              />
              <button type="button" className="chess-btn" onClick={loadChessComGames} disabled={loadingGames}>
                {loadingGames ? 'Loading...' : 'Fetch'}
              </button>
            </div>

            <label htmlFor="chesscom-game-select">Recent games</label>
            <select
              id="chesscom-game-select"
              className="fen-input"
              value={selectedGameUrl}
              onChange={(event) => setSelectedGameUrl(event.target.value)}
              disabled={!games.length}
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game.url} value={game.url}>
                  {gameLabel(game)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="chess-btn"
              disabled={!selectedGameUrl}
              onClick={() => {
                const chosen = games.find((game) => game.url === selectedGameUrl);
                if (!chosen) {
                  return;
                }

                const loaded = controller.loadPgn(chosen.pgn);
                if (!loaded) {
                  setFetchError('Unable to load the selected PGN.');
                  return;
                }

                setFetchError(null);
                const searchedPlayerSide = getPlayerSideInGame(chosen, chessComUsername);
                if (searchedPlayerSide) {
                  setDisplayPerspective(searchedPlayerSide);
                }
              }}
            >
              Load selected game
            </button>

            <label className="toggle-row" htmlFor="show-best-move-toggle">
              <input
                id="show-best-move-toggle"
                type="checkbox"
                checked={showBestMove}
                onChange={(event) => setShowBestMove(event.target.checked)}
              />
              <span>Show best move</span>
            </label>
            <label htmlFor="fen-input">Load FEN</label>
            <input
              id="fen-input"
              className="fen-input"
              value={fenInput}
              onChange={(event) => setFenInput(event.target.value)}
              placeholder="Paste FEN and click Load"
            />
            <button
              type="button"
              className="chess-btn"
              onClick={() => {
                const ok = controller.loadFen(fenInput);
                if (!ok) {
                  setFenError('Invalid FEN');
                  return;
                }

                setFenError(null);
              }}
            >
              Load
            </button>
            {fenError ? <small>{fenError}</small> : null}
            {fetchError ? <small>{fetchError}</small> : null}
          </div>

          {showMoveList ? (
            <>
              <h4>Moves</h4>
              <ol className="move-list">
                {groupedMoves.map((move) => (
                  <li key={move}>{move}</li>
                ))}
              </ol>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
};
