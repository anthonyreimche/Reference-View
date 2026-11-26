// What activate() registers, and how the reference is pinned, shown and shared:
// the toolbar button and Shift+R toggle it, the Library's menu pins a photo,
// another window's change is followed, and "reference.photo" names the photo
// in the pane while it shows.

import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { activate, deactivate } from "../src/index";
import { MENU_ID, PANE_ID, REFERENCE_VARIABLE, TOGGLE_ACTION, TOOLBAR_ID } from "../src/model";
import { fakeApi, photo, type Rig } from "./support/fake-api";

afterEach(() => {
  cleanup();
  deactivate();
});

function started(): Rig {
  const rig = fakeApi();
  activate(rig.api);
  return rig;
}

const open = (rig: Rig, id: string | null) => act(() => rig.catalogue.setState({ activePhotoId: id }));
const shortcut = (rig: Rig) => act(() => rig.keybindings.find((k) => k.id === TOGGLE_ACTION)!.handler());
const reference = (rig: Rig) => rig.variables.get(REFERENCE_VARIABLE);

describe("activate", () => {
  it("registers the pane beside the canvas, the toolbar button, the menu item and Shift+R", () => {
    const rig = started();
    expect(rig.slots.map((s) => [s.id, s.slot])).toEqual([
      [PANE_ID, "develop-canvas-beside"],
      [TOOLBAR_ID, "develop-toolbar"],
    ]);
    expect(rig.menuItems.map((m) => m.id)).toEqual([MENU_ID]);
    expect(rig.keybindings).toEqual([
      expect.objectContaining({ id: TOGGLE_ACTION, label: "Show reference photo", category: "Develop", defaultCombo: "Shift+R" }),
    ]);
  });

  it("registers reference.photo, null while no reference shows", () => {
    const rig = started();
    expect(rig.variables.has(REFERENCE_VARIABLE)).toBe(true);
    expect(reference(rig)).toBeNull();
  });
});

describe("Shift+R", () => {
  it("pins the open photo and shows it, then hides it again, keeping it pinned", () => {
    const rig = started();
    open(rig, "A");
    shortcut(rig);
    expect(rig.settings.get("photoId")).toBe("A");
    expect(rig.settings.get("shown")).toBe(true);
    expect(reference(rig)).toEqual({ photoId: "A", name: "A.NEF" });

    open(rig, "B");
    expect(reference(rig)).toEqual({ photoId: "A", name: "A.NEF" });
    shortcut(rig);
    expect(rig.settings.get("shown")).toBe(false);
    expect(rig.settings.get("photoId")).toBe("A");
    expect(reference(rig)).toBeNull();
  });

  it("does nothing outside Develop", () => {
    const rig = started();
    open(rig, "A");
    act(() => rig.module.setState({ current: "library" }));
    shortcut(rig);
    expect(rig.settings.get("shown")).toBeUndefined();
  });
});

describe("the Library's Use as reference photo", () => {
  it("pins the chosen photo and shows it, for one photo only", () => {
    const rig = started();
    const item = rig.menuItems[0];
    expect(typeof item.label === "function" ? item.label(["B"]) : item.label).toBe("Use as reference photo");
    expect(item.enabled?.(["B"])).toBe(true);
    expect(item.enabled?.(["A", "B"])).toBe(false);

    act(() => item.onClick(["B"]));
    expect(rig.settings.get("photoId")).toBe("B");
    expect(rig.settings.get("shown")).toBe(true);
    expect(reference(rig)).toEqual({ photoId: "B", name: "B.NEF" });
  });
});

describe("reference.photo", () => {
  it("clears when the reference leaves the catalogue", () => {
    const rig = started();
    act(() => rig.menuItems[0].onClick(["B"]));
    act(() => rig.catalogue.setState({ photos: [photo("A")] }));
    expect(reference(rig)).toBeNull();
  });

  it("follows another window's settings", () => {
    const rig = started();
    act(() => {
      rig.setFromElsewhere("photoId", "A");
      rig.setFromElsewhere("shown", true);
    });
    expect(reference(rig)).toEqual({ photoId: "A", name: "A.NEF" });
  });

  it("is left alone after deactivate", () => {
    const rig = started();
    deactivate();
    act(() => rig.setFromElsewhere("photoId", "A"));
    act(() => rig.setFromElsewhere("shown", true));
    expect(reference(rig)).toBeNull();
  });
});

describe("the toolbar button", () => {
  it("toggles the reference, pressed while it shows", () => {
    const rig = started();
    open(rig, "A");
    const Toolbar = rig.slots.find((s) => s.id === TOOLBAR_ID)!.component;
    render(<Toolbar />);
    const button = screen.getByRole("button", { name: "Reference" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("title")).toBe("Show a reference photo beside this one (Shift+R)");

    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(reference(rig)).toEqual({ photoId: "A", name: "A.NEF" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
