import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
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
import { EvaluationBar } from './EvaluationBar';
import { getMaterialBalanceFromFen } from './materialBalance';
import type { MoveReviewReport, ReviewMove } from './moveReview';
import { buildMoveReviewFromHistory } from './useMoveReview';
import { useStockfishAnalysis } from './useStockfishAnalysis';
import { useChessGame } from './useChessGame';
import './ChessBoardWithControls.css';
import type { StockfishEvaluation } from './stockfishAnalysis';

const formatUciMove = (uci: string | null): string | null => {
  if (!uci || uci.length < 4) {
    return null;
  }
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? `=${uci.slice(4).toUpperCase()}` : '';
  return `${from}→${to}${promotion}`;
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
  const { redoMove, undoMove, jumpToPly } = controller;
  const [displayPerspective, setDisplayPerspective] = useState<'white' | 'black'>(orientation);
  const [showBestMove, setShowBestMove] = useState(false);
  const [chessComUsername, setChessComUsername] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [selectedGameUrl, setSelectedGameUrl] = useState('');
  const [loadingGames, setLoadingGames] = useState(false);
  const [activeGame, setActiveGame] = useState<ChessComGame | null>(null);
  const [moveReview, setMoveReview] = useState<MoveReviewReport | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDebugMode, setReviewDebugMode] = useState(false);
  const analysis = useStockfishAnalysis(controller.fen, true);
  const bestMoveArrow = showBestMove ? analysis.bestMove : null;
  const reviewRequestIdRef = useRef(0);
  
  const lastEvaluationRef = useRef<StockfishEvaluation | null>(null);
  const stableEvaluation = analysis.evaluation ?? lastEvaluationRef.current;
  if (analysis.evaluation !== null) {
    lastEvaluationRef.current = analysis.evaluation;
  }

  useEffect(() => {
    setDisplayPerspective(orientation);
  }, [orientation]);

  const groupedMoves = useMemo(() => {
    const rows: Array<{
      moveNumber: number;
      white: ReviewMove | null;
      black: ReviewMove | null;
      whitePly: number;
      blackPly: number;
      hasWhiteMove: boolean;
      hasBlackMove: boolean;
    }> = [];
    const reviewMoves = moveReview?.moves ?? [];

    for (let i = 0; i < controller.movesSan.length; i += 2) {
      const moveNumber = i / 2 + 1;
      const whitePly = i + 1;
      const blackPly = i + 2;
      rows.push({
        moveNumber,
        white: reviewMoves[i] ?? null,
        black: reviewMoves[i + 1] ?? null,
        whitePly,
        blackPly,
        hasWhiteMove: Boolean(controller.movesSan[i]),
        hasBlackMove: Boolean(controller.movesSan[i + 1]),
      });
    }

    return rows;
  }, [controller.movesSan, moveReview]);

  const selectedReviewedMove = useMemo(() => {
    if (!moveReview || controller.currentPly <= 0) {
      return null;
    }
    return moveReview.moves[controller.currentPly - 1] ?? null;
  }, [controller.currentPly, moveReview]);

  const materialBalance = useMemo(() => getMaterialBalanceFromFen(controller.fen, 'white'), [controller.fen]);
  const materialLeader: 'white' | 'black' | null =
    materialBalance.whiteMinusBlack === 0 ? null : materialBalance.whiteMinusBlack > 0 ? 'white' : 'black';
  const materialLead = Math.abs(materialBalance.whiteMinusBlack);
  
  const playerInfo = useMemo(
    () => ({
      white: {
        name: activeGame?.white?.username?.trim() || 'White',
        rating: activeGame?.white?.rating ?? null,
      },
      black: {
        name: activeGame?.black?.username?.trim() || 'Black',
        rating: activeGame?.black?.rating ?? null,
      },
    }),
    [activeGame],
  );
  
  const topSide = displayPerspective === 'white' ? 'black' : 'white';
  const bottomSide = displayPerspective;

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

  const runMoveReview = useCallback(async () => {
    if (!controller.movesSan.length) {
      setMoveReview(null);
      return;
    }

    setReviewLoading(true);
    setReviewError(null);
    const requestId = reviewRequestIdRef.current + 1;
    reviewRequestIdRef.current = requestId;

    try {
      const replay = new Chess(controller.startingFen);
      const history = controller.movesSan
        .map((san) => {
          const move = replay.move(san, { strict: false });
          if (!move) {
            return null;
          }
          return { from: String(move.from), to: String(move.to) };
        })
        .filter(Boolean) as Array<{ from: string; to: string }>;

      if (history.length !== controller.movesSan.length) {
        throw new Error('Unable to parse move history for review.');
      }

      const report = await buildMoveReviewFromHistory({
        startingFen: controller.startingFen,
        history,
        playerRatings: {
          white: activeGame?.white?.rating,
          black: activeGame?.black?.rating,
        },
        debugMode: reviewDebugMode,
      });
      if (reviewRequestIdRef.current !== requestId) {
        return;
      }
      setMoveReview(report);
      if (report.moves.length > 0) {
        jumpToPly(report.moves.length);
      }
      if (reviewDebugMode && typeof console !== 'undefined' && report.debugRows) {
        console.table(
          report.debugRows.map((row) => ({
            ply: row.plyIndex + 1,
            side: row.playedBy,
            final: row.finalLabel,
            base: row.baseLabel,
            epLoss: row.expectedPointsLoss,
            cpLoss: row.centipawnLoss,
            best: row.bestMoveUci,
            book: row.checks.isBook,
            brilliant: row.checks.isBrilliant,
            great: row.checks.isGreat,
            miss: row.checks.isMiss,
          })),
        );
      }
    } catch {
      if (reviewRequestIdRef.current !== requestId) {
        return;
      }
      setReviewError('Move review failed.');
    } finally {
      if (reviewRequestIdRef.current === requestId) {
        setReviewLoading(false);
      }
    }
  }, [
    activeGame?.black?.rating,
    activeGame?.white?.rating,
    controller.movesSan,
    controller.startingFen,
    jumpToPly,
    reviewDebugMode,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const fromQuery = new URLSearchParams(window.location.search).get('reviewDebug') === '1';
    const fromStorage = window.localStorage.getItem('reviewDebugMode') === '1';
    setReviewDebugMode(fromQuery || fromStorage);
  }, []);

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

  useEffect(() => {
    void runMoveReview();
  }, [runMoveReview]);

  return (
    <section className={`chess-shell ${className ?? ''}`.trim()}>
      <div className="chess-toolbar">
        <button
          type="button"
          className="chess-btn"
          onClick={() => {
            controller.newGame();
            setActiveGame(null);
            setMoveReview(null);
            setReviewError(null);
          }}
        >
          New game
        </button>
        <button
          type="button"
          className="chess-btn"
          onClick={() => {
            controller.reset(initialFen);
            setActiveGame(null);
            setMoveReview(null);
            setReviewError(null);
          }}
        >
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
          <div className="board-with-players">
            <div className="player-row player-row--top">
              <div className="player-name-wrap">
                <strong className="player-name">{playerInfo[topSide].name}</strong>
                {playerInfo[topSide].rating !== null ? (
                  <span className="player-rating">({playerInfo[topSide].rating})</span>
                ) : null}
              </div>
              {materialLeader === topSide ? <span className="player-material">+{materialLead}</span> : null}
            </div>
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
            <div className="player-row player-row--bottom">
              <div className="player-name-wrap">
                <strong className="player-name">{playerInfo[bottomSide].name}</strong>
                {playerInfo[bottomSide].rating !== null ? (
                  <span className="player-rating">({playerInfo[bottomSide].rating})</span>
                ) : null}
              </div>
              {materialLeader === bottomSide ? <span className="player-material">+{materialLead}</span> : null}
            </div>
          </div>
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
                setActiveGame(chosen);
                setMoveReview(null);
                setReviewError(null);
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
            {fetchError ? <small>{fetchError}</small> : null}
          </div>

          {showMoveList ? (
            <>
              <div className="-header">
                <h4>Moves</h4>
              </div>
              {reviewError ? <small>{reviewError}</small> : null}
              <ol className="move-list move-list--review">
                {groupedMoves.map((row) => (
                  <li key={row.moveNumber} className="move-row">
                    <span className="move-number">{row.moveNumber}.</span>
                    <span className="move-entry">
                      <button
                        type="button"
                        className={`move-entry-button ${controller.currentPly === row.whitePly ? 'is-active' : ''}`}
                        onClick={() => controller.jumpToPly(row.whitePly)}
                        disabled={!row.hasWhiteMove}
                      >
                        {row.white?.san ?? controller.movesSan[row.whitePly - 1] ?? '--'}
                      </button>
                      {row.white?.moveLabel ? (
                        <span
                          className={`move-label-badge move-label-badge--${row.white.moveLabel.toLowerCase()}`}
                          title={row.white.labelExplanationSeed ?? row.white.labelReason ?? ''}
                        >
                          {row.white.moveLabel}
                        </span>
                      ) : moveReview ? (
                        <span className="move-label-placeholder">—</span>
                      ) : (
                        <span className="move-label-placeholder">…</span>
                      )}
                    </span>
                    <span className="move-entry">
                      <button
                        type="button"
                        className={`move-entry-button ${controller.currentPly === row.blackPly ? 'is-active' : ''}`}
                        onClick={() => controller.jumpToPly(row.blackPly)}
                        disabled={!row.hasBlackMove}
                      >
                        {row.black?.san ?? controller.movesSan[row.blackPly - 1] ?? '--'}
                      </button>
                      {row.black?.moveLabel ? (
                        <span
                          className={`move-label-badge move-label-badge--${row.black.moveLabel.toLowerCase()}`}
                          title={row.black.labelExplanationSeed ?? row.black.labelReason ?? ''}
                        >
                          {row.black.moveLabel}
                        </span>
                      ) : moveReview && controller.movesSan[(row.moveNumber - 1) * 2 + 1] ? (
                        <span className="move-label-placeholder">—</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
              <section className="-panel" aria-live="polite">
                <h4>Move Review</h4>
                {selectedReviewedMove ? (
                  <div className="move-review-panel__content">
                    <div className="move-review-panel__label-row">
                      <span className="move-review-panel__title">
                        {Math.floor((selectedReviewedMove.plyIndex + 2) / 2)}.
                        {selectedReviewedMove.playedBy === 'white' ? ' White' : ' Black'} {selectedReviewedMove.san}
                      </span>
                      {selectedReviewedMove.moveLabel ? (
                        <span
                          className={`move-label-badge move-label-badge--${selectedReviewedMove.moveLabel.toLowerCase()}`}
                        >
                          {selectedReviewedMove.moveLabel}
                        </span>
                      ) : (
                        <span className="move-label-placeholder">Unlabeled</span>
                      )}
                    </div>
                    <p className="move-review-panel__explanation">
                      {selectedReviewedMove.labelExplanationSeed ??
                        selectedReviewedMove.labelReason ??
                        'No move-review explanation available.'}
                    </p>
                    {selectedReviewedMove.bestMoveUci ? (
                      <p>
                        <strong>Best move:</strong> {formatUciMove(selectedReviewedMove.bestMoveUci)}
                      </p>
                    ) : null}
                    {selectedReviewedMove.expectedPointsLoss !== null ? (
                      <p>
                        <strong>Expected-points loss:</strong> {selectedReviewedMove.expectedPointsLoss.toFixed(3)}
                      </p>
                    ) : null}
                    {selectedReviewedMove.metadata.centipawnLoss !== null ? (
                      <p>
                        <strong>Evaluation loss:</strong> {selectedReviewedMove.metadata.centipawnLoss} cp
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="move-review-panel__placeholder">
                    {!moveReview ? (reviewLoading ? 'Reviewing moves…' : 'Play a move to generate review.') : 'Navigate to a move to see its review.'}
                  </p>
                )}
              </section>
              {reviewDebugMode && moveReview?.debugRows ? (
                <details className="review-debug-panel">
                  <summary>Review debug ({moveReview.debugRows.length} rows)</summary>
                  <pre>{JSON.stringify(moveReview.debugRows.slice(0, 20), null, 2)}</pre>
                </details>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
};
