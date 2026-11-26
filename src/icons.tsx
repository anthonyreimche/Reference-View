// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Line glyphs drawn like Image Comparison's: a 24-unit box, round 2-unit strokes.

import { React } from "./rt";

function Glyph({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Two frames side by side, the left one pinned. */
export const ReferenceIcon = ({ size = 13 }: { size?: number }) => (
  <Glyph size={size}>
    <rect x={2} y={6} width={9} height={12} rx={1.5} />
    <rect x={13} y={6} width={9} height={12} rx={1.5} />
    <line x1={6.5} y1={3} x2={6.5} y2={6} />
  </Glyph>
);

/** The panes in a row. */
export const BesideIcon = ({ size = 13 }: { size?: number }) => (
  <Glyph size={size}>
    <rect x={3} y={4} width={18} height={16} rx={2} />
    <line x1={12} y1={4} x2={12} y2={20} />
  </Glyph>
);

/** The panes in a column. */
export const AboveIcon = ({ size = 13 }: { size?: number }) => (
  <Glyph size={size}>
    <rect x={3} y={4} width={18} height={16} rx={2} />
    <line x1={3} y1={12} x2={21} y2={12} />
  </Glyph>
);

export const CloseIcon = ({ size = 13 }: { size?: number }) => (
  <Glyph size={size}>
    <line x1={6} y1={6} x2={18} y2={18} />
    <line x1={18} y1={6} x2={6} y2={18} />
  </Glyph>
);
