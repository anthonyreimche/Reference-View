// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Reference View: pins a reference photo beside the one being edited in
// Develop. The pane goes in core's "develop-canvas-beside" slot, a toolbar
// button and Shift+R show and hide it, and the Library's photo menu pins any
// photo. The shared "reference.photo" variable names the photo while it shows,
// for an extension that matches against it (Colour Mapping).

import { ReferenceIcon } from "./icons";
import { MENU_ID, PANE_ID, TOGGLE_ACTION, TOOLBAR_ID } from "./model";
import { ReferencePane } from "./ReferencePane";
import { React, api, initRuntime } from "./rt";
import type { SafelightAPI } from "./safelight";
import { pin, startStore, store, toggle } from "./store";

function ReferenceToolbar() {
  const shown = store()((s) => s.shown);
  const combo = api.keybindings.getBinding(TOGGLE_ACTION);
  return (
    <api.ui.Button
      size="sm"
      variant="ghost"
      active={shown}
      aria-pressed={shown}
      title={`Show a reference photo beside this one${combo ? ` (${combo})` : ""}`}
      onClick={toggle}
    >
      <ReferenceIcon />
      <span>Reference</span>
    </api.ui.Button>
  );
}

let stop: (() => void) | null = null;

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  stop = startStore();
  host.registerSlot({ id: PANE_ID, slot: "develop-canvas-beside", component: ReferencePane });
  host.registerSlot({ id: TOOLBAR_ID, slot: "develop-toolbar", component: ReferenceToolbar });
  host.registerGridMenuItem({
    id: MENU_ID,
    label: "Use as reference photo",
    enabled: (ids) => ids.length === 1,
    onClick: (ids) => {
      if (ids.length === 1) pin(ids[0]);
    },
  });
  host.registerKeybinding({
    id: TOGGLE_ACTION,
    label: "Show reference photo",
    category: "Develop",
    defaultCombo: "Shift+R",
    handler: () => {
      if (host.navigation.current() === "develop") toggle();
    },
  });
}

export function deactivate(): void {
  stop?.();
  stop = null;
}
