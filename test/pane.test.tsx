// The pane beside the canvas: it shows the pinned photo with its saved edit,
// the grid preview at once and then a frame rendered for the pane's size,
// drawn again when that photo's edit is stored. Its header names the photo and
// carries the layout and close buttons.

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { activate, deactivate } from "../src/index";
import { PANE_ID, renderEdge } from "../src/model";
import { fakeApi, type Rig } from "./support/fake-api";

const PANE = { width: 600, height: 800 };

class FixedObserver {
  constructor(private readonly cb: ResizeObserverCallback) {}
  observe(target: Element) {
    this.cb([{ target, contentRect: PANE } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

let urls = 0;
const revoked: string[] = [];

beforeEach(() => {
  urls = 0;
  revoked.length = 0;
  vi.stubGlobal("ResizeObserver", FixedObserver);
  URL.createObjectURL = vi.fn(() => `blob:${++urls}`);
  URL.revokeObjectURL = vi.fn((u: string) => void revoked.push(u));
});

afterEach(() => {
  cleanup();
  deactivate();
  vi.unstubAllGlobals();
});

function shown(rig: Rig, settings: Record<string, unknown> = {}) {
  for (const [k, v] of Object.entries({ photoId: "A", shown: true, ...settings })) rig.settings.set(k, v);
  activate(rig.api);
  const Pane = rig.slots.find((s) => s.id === PANE_ID)!.component;
  return render(<Pane />);
}

const image = () => screen.getByRole<HTMLImageElement>("img", { name: "Reference photo A.NEF" });

describe("the reference pane", () => {
  it("draws nothing while hidden, or when the reference left the catalogue", () => {
    const hidden = fakeApi();
    const { container } = shown(hidden, { shown: false });
    expect(container.innerHTML).toBe("");
    deactivate();

    const gone = fakeApi();
    const second = shown(gone, { photoId: "Z" });
    expect(second.container.innerHTML).toBe("");
  });

  it("takes half the stage beside the canvas, or above it", () => {
    const rig = fakeApi();
    const { container } = shown(rig);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.canvasBeside).toBe("beside");
    expect(root.style.flex).toBe("0 0 50%");

    act(() => rig.setFromElsewhere("layout", "above"));
    expect(root.dataset.canvasBeside).toBe("above");
  });

  it("names the photo in its header", () => {
    shown(fakeApi());
    expect(screen.getByText("Reference")).toBeTruthy();
    expect(screen.getByText("A.NEF")).toBeTruthy();
  });

  it("shows the grid preview at once, then a frame rendered for the pane", async () => {
    const rig = fakeApi();
    rig.previews.set("A", new Blob(["preview"]));
    shown(rig);
    await waitFor(() => expect(image().getAttribute("src")).toBe("blob:1"));

    await waitFor(() => expect(rig.renders).toHaveLength(1));
    const [call] = rig.renders;
    expect(call.photoId).toBe("A");
    expect(call.settings).toEqual({
      format: "image/jpeg",
      quality: 0.92,
      longEdge: renderEdge(PANE.width, PANE.height, 1, 6000, 4000),
      colorSpace: "srgb",
      sharpenAmount: 0,
      includeMetadata: false,
    });
    expect(call.options).toEqual(expect.objectContaining({ processors: false }));

    await act(async () => call.resolve(new Blob(["frame"])));
    expect(image().getAttribute("src")).toBe("blob:2");
    expect(revoked).toContain("blob:1");
  });

  it("keeps the preview when the photo can't be rendered", async () => {
    const rig = fakeApi();
    rig.previews.set("A", new Blob(["preview"]));
    shown(rig);
    await waitFor(() => expect(rig.renders).toHaveLength(1));
    await act(async () => rig.renders[0].resolve(null));
    expect(image().getAttribute("src")).toBe("blob:1");
  });

  it("renders again when the reference's edit is stored, not another photo's", async () => {
    const rig = fakeApi();
    shown(rig);
    await waitFor(() => expect(rig.renders).toHaveLength(1));
    await act(async () => rig.renders[0].resolve(new Blob(["frame"])));

    act(() => rig.edits.setState({ B: 1 }));
    await new Promise((r) => setTimeout(r, 400));
    expect(rig.renders).toHaveLength(1);

    act(() => rig.edits.setState({ A: 2 }));
    await waitFor(() => expect(rig.renders).toHaveLength(2));
  });

  it("drops a frame that a newer one overtook", async () => {
    const rig = fakeApi();
    shown(rig);
    await waitFor(() => expect(rig.renders).toHaveLength(1));
    act(() => rig.edits.setState({ A: 2 }));
    await waitFor(() => expect(rig.renders).toHaveLength(2));

    await act(async () => rig.renders[1].resolve(new Blob(["new"])));
    const newer = image().getAttribute("src");
    await act(async () => rig.renders[0].resolve(new Blob(["old"])));
    expect(image().getAttribute("src")).toBe(newer);
  });

  it("swaps the layout, and closes, from its header", () => {
    const rig = fakeApi();
    shown(rig);
    fireEvent.click(screen.getByRole("button", { name: "Show the reference above" }));
    expect(rig.settings.get("layout")).toBe("above");
    fireEvent.click(screen.getByRole("button", { name: "Show the reference beside" }));
    expect(rig.settings.get("layout")).toBe("beside");

    fireEvent.click(screen.getByRole("button", { name: "Close the reference" }));
    expect(rig.settings.get("shown")).toBe(false);
    expect(rig.settings.get("photoId")).toBe("A");
  });
});
