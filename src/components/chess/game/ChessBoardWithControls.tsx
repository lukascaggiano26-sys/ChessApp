import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ChessBoard } from '../board';
import type { ChessBoardWithControlsProps } from './types';
import { useChessGame } from './useChessGame';
import './ChessBoardWithControls.css';

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
  const [currentOrientation, setCurrentOrientation] = useState(orientation);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable;
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
            setCurrentOrientation((value) => (value === 'white' ? 'black' : 'white'))
          }
        >
          Flip board ({currentOrientation === 'white' ? 'White' : 'Black'} view)
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
      </div>

      <div className="chess-layout">
        <ChessBoard
          fen={controller.fen}
          orientation={currentOrientation}
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
        />

        <aside className="chess-sidepanel">
          <div className="fen-row">
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
