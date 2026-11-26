// A stand-in Safelight API over real React and zustand, with only what
// Reference View uses. The catalogue is a real zustand store; previews,
// headless renders and edit stamps are driven from the test; settings and
// shared variables live in memory and every registration is recorded.

import * as React from "react";
import { create, type StoreApi } from "zustand";
import type {
  ButtonProps,
  CatalogPhoto,
  ExportSettings,
  GridMenuItemContribution,
  KeyActionContribution,
  ModuleId,
  RenderPhotosOptions,
  RenderedPhoto,
  SafelightAPI,
  SharedVariablesAPI,
  SlotContribution,
  VariableSnapshot,
} from "../../src/safelight";

export interface Catalogue {
  photos: CatalogPhoto[];
  activePhotoId: string | null;
}

export interface RenderCall {
  photoId: string;
  settings: Partial<ExportSettings>;
  options: RenderPhotosOptions | undefined;
  resolve(blob: Blob | null): void;
}

export interface Rig {
  api: SafelightAPI;
  catalogue: StoreApi<Catalogue>;
  module: StoreApi<{ current: ModuleId }>;
  edits: StoreApi<Record<string, number>>;
  settings: Map<string, unknown>;
  /** Writes another window makes: stored, then every onChange listener hears it. */
  setFromElsewhere(key: string, value: unknown): void;
  variables: Map<string, unknown>;
  slots: SlotContribution[];
  menuItems: GridMenuItemContribution[];
  keybindings: KeyActionContribution[];
  previews: Map<string, Blob>;
  previewReads: string[];
  renders: RenderCall[];
}

export const photo = (id: string, width = 6000, height = 4000): CatalogPhoto =>
  ({ id, filename: `${id}.NEF`, width, height }) as CatalogPhoto;

export function fakeApi(photos: CatalogPhoto[] = [photo("A"), photo("B")]): Rig {
  const catalogue = create<Catalogue>()(() => ({ photos, activePhotoId: null }));
  const module = create<{ current: ModuleId }>()(() => ({ current: "develop" as ModuleId }));
  const edits = create<Record<string, number>>()(() => ({}));

  const settings = new Map<string, unknown>();
  const settingsListeners = new Set<(key: string, value: unknown) => void>();

  const values = new Map<string, unknown>();
  const listeners = new Map<string, Set<(s: VariableSnapshot<unknown>) => void>>();
  const snapshot = (name: string) => ({ name, value: values.get(name) }) as VariableSnapshot<unknown>;
  const variables = {
    register: <T,>(name: string, init: { initial: T }) => {
      if (!values.has(name)) values.set(name, init.initial);
      return snapshot(name) as VariableSnapshot<T>;
    },
    get: <T,>(name: string) => (values.has(name) ? (snapshot(name) as VariableSnapshot<T>) : undefined),
    subscribe: <T,>(name: string, listener: (s: VariableSnapshot<T>) => void) => {
      const held = listeners.get(name) ?? new Set();
      const wide = listener as (s: VariableSnapshot<unknown>) => void;
      held.add(wide);
      listeners.set(name, held);
      if (values.has(name)) wide(snapshot(name));
      return () => void held.delete(wide);
    },
    update: <T,>(name: string, fn: (current: T) => T) => {
      if (!values.has(name)) return { ok: false, reason: "unregistered" } as const;
      values.set(name, JSON.parse(JSON.stringify(fn(values.get(name) as T))));
      for (const l of listeners.get(name) ?? []) l(snapshot(name));
      return { ok: true } as const;
    },
  } as unknown as SharedVariablesAPI;

  const slots: SlotContribution[] = [];
  const menuItems: GridMenuItemContribution[] = [];
  const keybindings: KeyActionContribution[] = [];
  const previews = new Map<string, Blob>();
  const previewReads: string[] = [];
  const renders: RenderCall[] = [];

  const Button = ({ variant, size, active, full: _full, ...rest }: ButtonProps) => (
    <button data-kit="button" data-variant={variant} data-size={size} data-active={active ? "" : undefined} {...rest} />
  );

  const api = {
    version: 1,
    extensionId: "reference-view",
    react: React,
    registerSlot: (c: SlotContribution) => void slots.push(c),
    registerGridMenuItem: (c: GridMenuItemContribution) => void menuItems.push(c),
    registerKeybinding: (c: KeyActionContribution) => void keybindings.push(c),
    ui: {
      Button,
      tokens: {
        textPrimary: "var(--color-text-primary)",
        textSecondary: "var(--color-text-secondary)",
        textMuted: "var(--color-text-muted)",
        border: "var(--color-border)",
      },
    },
    keybindings: {
      getBinding: (id: string) => keybindings.find((k) => k.id === id)?.defaultCombo ?? "",
    },
    navigation: {
      current: () => module.getState().current,
      useCurrent: () => module((s) => s.current),
    },
    stores: { useCatalogStore: catalogue, create },
    settings: {
      get: <T,>(key: string, fallback: T) => (settings.has(key) ? (settings.get(key) as T) : fallback),
      set: (key: string, value: unknown) => {
        settings.set(key, value);
        for (const l of settingsListeners) l(key, value);
      },
      onChange: (cb: (key: string, value: unknown) => void) => {
        settingsListeners.add(cb);
        return () => void settingsListeners.delete(cb);
      },
    },
    catalog: {
      readPreview: (id: string) => {
        previewReads.push(id);
        return Promise.resolve(previews.get(id) ?? null);
      },
      editedAt: (id: string) => edits.getState()[id],
      useEditedAt: (id: string) => edits((s) => s[id]),
    },
    export: {
      renderPhotos: (list: CatalogPhoto[], s: Partial<ExportSettings> = {}, _p: unknown, options?: RenderPhotosOptions) =>
        new Promise<RenderedPhoto[]>((done) => {
          const [p] = list;
          renders.push({
            photoId: p.id,
            settings: s,
            options,
            resolve: (blob) => done([{ photo: p, blob, width: blob ? 100 : 0, height: blob ? 100 : 0 } as RenderedPhoto]),
          });
        }),
    },
    variables,
  } as unknown as SafelightAPI;

  return {
    api,
    catalogue,
    module,
    edits,
    settings,
    setFromElsewhere: (key, value) => {
      settings.set(key, value);
      for (const l of settingsListeners) l(key, value);
    },
    variables: values,
    slots,
    menuItems,
    keybindings,
    previews,
    previewReads,
    renders,
  };
}
