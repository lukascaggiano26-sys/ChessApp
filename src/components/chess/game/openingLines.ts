export interface OpeningLineEntry {
  eco: string;
  name: string;
  moves: string[];
}

// Lightweight, maintainable starter ECO dataset (SAN move sequences).
// Matching is prefix-based and favors the longest line.
export const OPENING_LINES: OpeningLineEntry[] = [
  // Open games (1.e4 e5)
  { eco: 'C20', name: "King's Pawn Game", moves: ['e4', 'e5'] },
  { eco: 'C21', name: 'Center Game', moves: ['e4', 'e5', 'd4', 'exd4'] },
  { eco: 'C22', name: 'Center Game Accepted', moves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4'] },
  { eco: 'C23', name: "Bishop's Opening", moves: ['e4', 'e5', 'Bc4'] },
  { eco: 'C24', name: "Bishop's Opening, Berlin Defense", moves: ['e4', 'e5', 'Bc4', 'Nf6'] },
  { eco: 'C25', name: 'Vienna Game', moves: ['e4', 'e5', 'Nc3'] },
  { eco: 'C27', name: 'Vienna Game, Frankenstein-Dracula', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'Bc4', 'Nxe4'] },
  { eco: 'C30', name: "King's Gambit", moves: ['e4', 'e5', 'f4'] },
  { eco: 'C33', name: "King's Gambit Accepted", moves: ['e4', 'e5', 'f4', 'exf4'] },
  { eco: 'C34', name: "King's Gambit Accepted, Fischer Defense", moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'd6'] },
  { eco: 'C40', name: "King's Knight Opening", moves: ['e4', 'e5', 'Nf3'] },
  { eco: 'C41', name: 'Philidor Defense', moves: ['e4', 'e5', 'Nf3', 'd6'] },
  { eco: 'C42', name: 'Petrov Defense', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { eco: 'C44', name: 'Scotch Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { eco: 'C45', name: 'Scotch Game, Schmidt Variation', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6'] },
  { eco: 'C50', name: 'Italian Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { eco: 'C53', name: 'Italian Game, Classical', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
  { eco: 'C54', name: 'Italian Game, Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3'] },
  { eco: 'C55', name: 'Italian Game, Two Knights Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { eco: 'C57', name: 'Italian Game, Two Knights, Fried Liver', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'] },
  { eco: 'C60', name: 'Ruy Lopez', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'C65', name: 'Ruy Lopez, Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { eco: 'C66', name: 'Ruy Lopez, Berlin Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4'] },
  { eco: 'C68', name: 'Ruy Lopez, Exchange Variation', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6'] },
  { eco: 'C70', name: 'Ruy Lopez, Morphy Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
  { eco: 'C78', name: 'Ruy Lopez, Archangel', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'b5', 'Bb3', 'Bc5'] },
  { eco: 'C84', name: 'Ruy Lopez, Closed Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] },

  // Sicilian Defense
  { eco: 'B20', name: 'Sicilian Defense', moves: ['e4', 'c5'] },
  { eco: 'B21', name: 'Sicilian Defense, Smith-Morra Gambit', moves: ['e4', 'c5', 'd4', 'cxd4', 'c3'] },
  { eco: 'B22', name: 'Sicilian Defense, Alapin', moves: ['e4', 'c5', 'c3'] },
  { eco: 'B23', name: 'Sicilian Defense, Closed', moves: ['e4', 'c5', 'Nc3'] },
  { eco: 'B27', name: 'Sicilian Defense, Hyperaccelerated Dragon', moves: ['e4', 'c5', 'Nf3', 'g6'] },
  { eco: 'B30', name: 'Sicilian Defense, Old Sicilian', moves: ['e4', 'c5', 'Nf3', 'Nc6'] },
  { eco: 'B31', name: 'Sicilian Defense, Rossolimo', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'B32', name: 'Sicilian Defense, Open', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4'] },
  { eco: 'B33', name: 'Sicilian Defense, Sveshnikov', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'] },
  { eco: 'B40', name: 'Sicilian Defense, Kan', moves: ['e4', 'c5', 'Nf3', 'e6'] },
  { eco: 'B44', name: 'Sicilian Defense, Taimanov', moves: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'Nc6'] },
  { eco: 'B50', name: 'Sicilian Defense, Modern', moves: ['e4', 'c5', 'Nf3', 'd6'] },
  { eco: 'B56', name: 'Sicilian Defense, Classical', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nc6'] },
  { eco: 'B70', name: 'Sicilian Defense, Dragon', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B90', name: 'Sicilian Defense, Najdorf', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },

  // French Defense
  { eco: 'C00', name: 'French Defense', moves: ['e4', 'e6'] },
  { eco: 'C01', name: 'French Defense, Exchange Variation', moves: ['e4', 'e6', 'd4', 'd5', 'exd5'] },
  { eco: 'C02', name: 'French Defense, Advance Variation', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { eco: 'C03', name: 'French Defense, Tarrasch', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'] },
  { eco: 'C10', name: 'French Defense, Rubinstein', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'dxe4'] },
  { eco: 'C11', name: 'French Defense, Burn Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
  { eco: 'C15', name: 'French Defense, Winawer', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },

  // Caro-Kann Defense
  { eco: 'B10', name: 'Caro-Kann Defense', moves: ['e4', 'c6'] },
  { eco: 'B12', name: 'Caro-Kann Defense, Advance Variation', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { eco: 'B13', name: 'Caro-Kann Defense, Exchange Variation', moves: ['e4', 'c6', 'd4', 'd5', 'exd5'] },
  { eco: 'B14', name: 'Caro-Kann Defense, Panov Attack', moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5', 'c4'] },
  { eco: 'B15', name: 'Caro-Kann Defense, Two Knights', moves: ['e4', 'c6', 'Nc3', 'd5', 'Nf3'] },
  { eco: 'B17', name: 'Caro-Kann Defense, Classical', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },
  { eco: 'B18', name: 'Caro-Kann Defense, Classical Main Line', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'] },

  // Scandinavian, Pirc, Modern, Alekhine
  { eco: 'B01', name: 'Scandinavian Defense', moves: ['e4', 'd5'] },
  { eco: 'B01', name: 'Scandinavian Defense, Main Line', moves: ['e4', 'd5', 'exd5', 'Qxd5'] },
  { eco: 'B01', name: 'Scandinavian Defense, Modern Variation', moves: ['e4', 'd5', 'exd5', 'Nf6'] },
  { eco: 'B06', name: 'Modern Defense', moves: ['e4', 'g6'] },
  { eco: 'B07', name: 'Pirc Defense', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B08', name: 'Pirc Defense, Austrian Attack', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4'] },
  { eco: 'B04', name: 'Alekhine Defense', moves: ['e4', 'Nf6'] },

  // Queen's Gambit / d4-d5 systems
  { eco: 'D00', name: "Queen's Pawn Game", moves: ['d4', 'd5'] },
  { eco: 'D02', name: "Queen's Pawn Game, London System", moves: ['d4', 'd5', 'Bf4'] },
  { eco: 'D02', name: 'London System Setup', moves: ['d4', 'Nf6', 'Nf3', 'd5', 'Bf4'] },
  { eco: 'D05', name: 'Colle System', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'e3'] },
  { eco: 'D06', name: "Queen's Gambit", moves: ['d4', 'd5', 'c4'] },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: ['d4', 'd5', 'c4', 'e6'] },
  { eco: 'D31', name: "QGD, Alapin Variation", moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5'] },
  { eco: 'D35', name: 'QGD, Exchange Variation', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5'] },
  { eco: 'D37', name: 'QGD, Classical', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7'] },
  { eco: 'D43', name: 'Semi-Slav Defense', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'c6'] },
  { eco: 'D10', name: 'Slav Defense', moves: ['d4', 'd5', 'c4', 'c6'] },
  { eco: 'D15', name: 'Slav Defense, Three Knights', moves: ['d4', 'd5', 'c4', 'c6', 'Nc3', 'Nf6', 'Nf3'] },

  // Indian defenses and related
  { eco: 'A40', name: "Queen's Pawn", moves: ['d4', 'Nf6'] },
  { eco: 'E00', name: 'Catalan Opening', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3'] },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { eco: 'E32', name: 'Nimzo-Indian, Classical', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'Qc2'] },
  { eco: 'E60', name: "King's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { eco: 'E62', name: "King's Indian Defense, Fianchetto", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nf3', 'Bg7', 'g3'] },
  { eco: 'E70', name: "King's Indian Defense, Classical", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'] },
  { eco: 'A60', name: 'Benoni Defense', moves: ['d4', 'Nf6', 'c4', 'c5'] },
  { eco: 'A57', name: 'Benko Gambit', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'] },
  { eco: 'E10', name: 'Bogo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+'] },
  { eco: 'E11', name: 'Bogo-Indian, Main Line', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+', 'Bd2'] },
  { eco: 'E12', name: "Queen's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
  { eco: 'E15', name: "Queen's Indian, Petrosian", moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'a3'] },
  { eco: 'E01', name: 'Catalan, Open', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'dxc4'] },

  // English / Réti / flank systems
  { eco: 'A10', name: 'English Opening', moves: ['c4'] },
  { eco: 'A15', name: 'English Opening, Anglo-Indian', moves: ['c4', 'Nf6'] },
  { eco: 'A20', name: 'English Opening, Reversed Sicilian', moves: ['c4', 'e5'] },
  { eco: 'A30', name: 'English Opening, Symmetrical', moves: ['c4', 'c5'] },
  { eco: 'A34', name: 'English Opening, Symmetrical fianchetto', moves: ['c4', 'c5', 'Nc3', 'Nc6', 'g3'] },
  { eco: 'A04', name: 'Réti Opening', moves: ['Nf3'] },
  { eco: 'A05', name: 'Réti Opening, Kingside Fianchetto', moves: ['Nf3', 'd5', 'g3'] },
  { eco: 'A06', name: 'Réti Opening, Anglo-Slav', moves: ['Nf3', 'd5', 'c4', 'c6'] },
  { eco: 'A07', name: "King's Indian Attack", moves: ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'e6', 'O-O'] },
];
