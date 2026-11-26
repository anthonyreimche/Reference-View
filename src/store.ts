// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The pinned reference, whether it shows, and the layout: kept in the
// extension's settings, so it lasts between sessions and every window follows
// a change made in another. "reference.photo" is kept in step with it.

import { KEYS, REFERENCE_DESCRIPTION, REFERENCE_VARIABLE, readState, referenceValue, toggled, type ReferencePhoto, type ReferenceState } from "./model";
import { api } from "./rt";
import type { AppStore, CatalogPhoto } from "./safelight";

let instance: AppStore<ReferenceState> | null = null;

export function store(): AppStore<ReferenceState> {
  if (!instance) throw new Error("Reference View's store is used before activate()");
  return instance;
}

const isKey = (key: string): key is keyof ReferenceState => (KEYS as readonly string[]).includes(key);

const catalogue = () => api.stores.useCatalogStore.getState();
const findPhoto = (id: string | null): CatalogPhoto | undefined =>
  id === null ? undefined : catalogue().photos.find((p) => p.id === id);

/** Stores the keys of `next` that differ from the state. */
export function write(next: Partial<ReferenceState>): void {
  const now = store().getState();
  for (const key of KEYS) {
    if (key in next && next[key] !== now[key]) api.settings.set(key, next[key]);
  }
  store().setState(next);
}

/** The toolbar button's and Shift+R's toggle. */
export function toggle(): void {
  write(toggled(store().getState(), catalogue().activePhotoId, (id) => findPhoto(id) !== undefined));
}

/** Pins `photoId` and shows it. */
export function pin(photoId: string): void {
  write({ photoId, shown: true });
}

const same = (a: ReferencePhoto | null, b: ReferencePhoto | null) =>
  a === b || (a !== null && b !== null && a.photoId === b.photoId && a.name === b.name);

function publish(): void {
  const { photoId } = store().getState();
  const next = referenceValue(store().getState(), findPhoto(photoId));
  const current = api.variables.get<ReferencePhoto | null>(REFERENCE_VARIABLE)?.value ?? null;
  if (!same(current, next)) api.variables.update<ReferencePhoto | null>(REFERENCE_VARIABLE, () => next);
}

/** Reads the stored state, follows other windows and keeps the shared
 *  variable in step; returns the stop. */
export function startStore(): () => void {
  instance = api.stores.create<ReferenceState>()(() => readState((key) => api.settings.get<unknown>(key, undefined)));
  api.variables.register<ReferencePhoto | null>(REFERENCE_VARIABLE, { initial: null, description: REFERENCE_DESCRIPTION });
  const stops = [
    api.settings.onChange((key, value) => {
      if (!isKey(key)) return;
      const next = readState((k) => (k === key ? value : store().getState()[k]));
      store().setState({ [key]: next[key] });
    }),
    store().subscribe(publish),
    api.stores.useCatalogStore.subscribe((state, prev) => {
      if (state.photos !== prev.photos) publish();
    }),
  ];
  publish();
  return () => {
    for (const stop of stops) stop();
    instance = null;
  };
}
