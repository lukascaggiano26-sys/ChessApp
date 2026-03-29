import type { JSX } from 'react';
import { ChessBoardWithControls } from './components/chess';

export const App = (): JSX.Element => {
  return (
    <main className="app-shell">
      <header>
        <h1>Interactive Chess Board UI</h1>
        <p>Click or drag pieces to play legal moves.</p>
      </header>

      <ChessBoardWithControls />
    </main>
  );
};
