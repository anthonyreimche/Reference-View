// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The pure rules of Reference View, kept free of the host so the tests import
// them straight into Node: what the toolbar's toggle does, what the shared
// variable holds, and how big a frame the pane asks for.

export const EXT_ID = "reference-view";
export const PANE_ID = `${EXT_ID}.pane`;
export const TOOLBAR_ID = `${EXT_ID}.toolbar`;
export const MENU_ID = `${EXT_ID}.use`;
export const TOGGLE_ACTION = `${EXT_ID}.toggle`;

/** The shared variable naming the photo in the reference pane, for an
 *  extension that works against it (Colour Mapping's Match to reference). */
export const REFERENCE_VARIABLE = "reference.photo";
export const REFERENCE_DESCRIPTION =
  "The photo Reference View shows beside the open photo, or null while it shows none. { photoId, name }.";

/** Beside the canvas, or above it. */
export type Layout = "beside" | "above";

export interface ReferenceState {
  /** The pinned photo; it stays pinned while hidden. */
  photoId: string | null;
  shown: boolean;
  layout: Layout;
}

export interface ReferencePhoto {
  photoId: string;
  name: string;
}

/** The settings keys the state is kept under. */
export const KEYS = ["photoId", "shown", "layout"] as const satisfies readonly (keyof ReferenceState)[];

/** The state from stored settings; a value of the wrong kind is the default. */
export function readState(get: (key: keyof ReferenceState) => unknown): ReferenceState {
  const photoId = get("photoId");
  const shown = get("shown");
  const layout = get("layout");
  return {
    photoId: typeof photoId === "string" ? photoId : null,
    shown: shown === true,
    layout: layout === "above" ? "above" : "beside",
  };
}

/** The toolbar's toggle: hide a reference that shows, show the pinned one,
 *  else pin the open photo and show it. */
export function toggled(state: ReferenceState, openId: string | null, inCatalogue: (id: string) => boolean): ReferenceState {
  if (state.shown) return { ...state, shown: false };
  if (state.photoId !== null && inCatalogue(state.photoId)) return { ...state, shown: true };
  if (openId === null) return state;
  return { ...state, photoId: openId, shown: true };
}

/** What the shared variable holds: the reference while it shows, else null. */
export function referenceValue(state: ReferenceState, photo: { id: string; filename: string } | undefined): ReferencePhoto | null {
  if (!state.shown || !photo || photo.id !== state.photoId) return null;
  return { photoId: photo.id, name: photo.filename };
}

const STEP = 256;
const MIN_EDGE = 256;
const MAX_EDGE = 4096;

/** The long edge, in device pixels, to render the reference at so it is sharp
 *  fitted into a pane of `paneW` × `paneH` CSS pixels; 0 when there is nothing
 *  to fit. Rounded up to a step so a small resize doesn't ask for a new frame. */
export function renderEdge(paneW: number, paneH: number, dpr: number, imageW: number, imageH: number): number {
  if (paneW <= 0 || paneH <= 0 || imageW <= 0 || imageH <= 0) return 0;
  const scale = Math.min(paneW / imageW, paneH / imageH);
  const edge = Math.max(imageW, imageH) * scale * dpr;
  return Math.min(Math.max(Math.ceil(edge / STEP) * STEP, MIN_EDGE), MAX_EDGE);
}
