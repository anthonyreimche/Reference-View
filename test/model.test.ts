// The pure rules: what the toolbar's toggle does, what the shared variable
// holds, and how big a frame the pane asks for.

import { describe, expect, it } from "vitest";
import { readState, referenceValue, renderEdge, toggled, type ReferenceState } from "../src/model";

const state = (s: Partial<ReferenceState> = {}): ReferenceState => ({ photoId: null, shown: false, layout: "beside", ...s });
const exists = (...ids: string[]) => (id: string) => ids.includes(id);

describe("toggled", () => {
  it("hides a reference that shows", () => {
    expect(toggled(state({ photoId: "A", shown: true }), "B", exists("A", "B"))).toEqual(state({ photoId: "A", shown: false }));
  });

  it("shows the pinned reference again, whatever photo is open", () => {
    expect(toggled(state({ photoId: "A" }), "B", exists("A", "B"))).toEqual(state({ photoId: "A", shown: true }));
  });

  it("pins the open photo when there is no reference, or it left the catalogue", () => {
    expect(toggled(state(), "B", exists("B"))).toEqual(state({ photoId: "B", shown: true }));
    expect(toggled(state({ photoId: "gone" }), "B", exists("B"))).toEqual(state({ photoId: "B", shown: true }));
  });

  it("does nothing with no reference and no photo open", () => {
    expect(toggled(state(), null, exists())).toEqual(state());
  });
});

describe("referenceValue", () => {
  it("names the reference while it shows", () => {
    expect(referenceValue(state({ photoId: "A", shown: true }), { id: "A", filename: "A.NEF" })).toEqual({ photoId: "A", name: "A.NEF" });
  });

  it("is null while hidden, or when the photo isn't in the catalogue", () => {
    expect(referenceValue(state({ photoId: "A" }), { id: "A", filename: "A.NEF" })).toBeNull();
    expect(referenceValue(state({ photoId: "A", shown: true }), undefined)).toBeNull();
  });
});

describe("readState", () => {
  it("reads stored settings, and falls back on anything else", () => {
    const stored: Record<string, unknown> = { photoId: "A", shown: true, layout: "above" };
    expect(readState((k) => stored[k])).toEqual({ photoId: "A", shown: true, layout: "above" });
    const junk: Record<string, unknown> = { photoId: 3, shown: "yes", layout: "diagonal" };
    expect(readState((k) => junk[k])).toEqual(state());
  });
});

describe("renderEdge", () => {
  it("is the long edge of the photo fitted into the pane, in device pixels, rounded up to 256", () => {
    // A 3:2 landscape photo in a 600 × 800 pane fits 600 × 400; at 1.75 that is 1050, so 1280.
    expect(renderEdge(600, 800, 1.75, 6000, 4000)).toBe(1280);
    // A portrait photo in the same pane fits 533 × 800: 1400 device pixels, so 1536.
    expect(renderEdge(600, 800, 1.75, 4000, 6000)).toBe(1536);
  });

  it("stays between 256 and 4096", () => {
    expect(renderEdge(20, 20, 1, 6000, 4000)).toBe(256);
    expect(renderEdge(4000, 4000, 2, 6000, 4000)).toBe(4096);
  });

  it("is 0 for a pane with no room, or a photo with no size yet", () => {
    expect(renderEdge(0, 800, 1, 6000, 4000)).toBe(0);
    expect(renderEdge(600, 800, 1, 0, 0)).toBe(0);
  });
});
