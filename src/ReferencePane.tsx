// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The pane core draws beside the Develop canvas ("develop-canvas-beside"): the
// pinned photo with its saved edit, fitted. The grid preview shows at once;
// then a frame is rendered at the pane's size, and again whenever that photo's
// edit is stored or the pane grows past it.

import { AboveIcon, BesideIcon, CloseIcon } from "./icons";
import { renderEdge } from "./model";
import { React, api } from "./rt";
import type { CatalogPhoto, ExportSettings } from "./safelight";
import { store, write } from "./store";

/** The wait after an edit is stored before rendering it, so a run of commits
 *  renders once. */
const RENDER_DELAY = 250;
const GAP = 12;

const frameSettings = (longEdge: number): Partial<ExportSettings> => ({
  format: "image/jpeg",
  quality: 0.92,
  longEdge,
  colorSpace: "srgb",
  sharpenAmount: 0,
  includeMetadata: false,
});

/** The URL of the best picture of the photo so far, revoked when replaced. */
function useReferenceFrame(photoId: string, edge: number, stamp: number | undefined): string | null {
  const [src, setSrc] = React.useState<string | null>(null);
  const shown = React.useRef<string | null>(null);
  const generation = React.useRef(0);
  const rendered = React.useRef<{ edge: number; stamp: number | undefined } | null>(null);

  const show = React.useCallback((url: string) => {
    if (shown.current) URL.revokeObjectURL(shown.current);
    shown.current = url;
    setSrc(url);
  }, []);

  React.useEffect(() => {
    let live = true;
    rendered.current = null;
    setSrc(null);
    void api.catalog.readPreview(photoId).then((blob) => {
      if (live && blob && shown.current === null) show(URL.createObjectURL(blob));
    });
    return () => {
      live = false;
      generation.current++;
      if (shown.current) URL.revokeObjectURL(shown.current);
      shown.current = null;
    };
  }, [photoId, show]);

  React.useEffect(() => {
    if (edge <= 0) return;
    const done = rendered.current;
    if (done && done.stamp === stamp && done.edge >= edge) return;
    const id = ++generation.current;
    const timer = setTimeout(
      () => {
        const photo = api.stores.useCatalogStore.getState().photos.find((p) => p.id === photoId);
        if (!photo) return;
        api.export
          .renderPhotos([photo], frameSettings(edge), undefined, { processors: false })
          .then(([result]) => {
            if (id !== generation.current || !result?.blob) return;
            rendered.current = { edge, stamp };
            show(URL.createObjectURL(result.blob));
          })
          .catch((err: unknown) => console.warn("[reference-view] couldn't render the reference photo:", err));
      },
      done ? RENDER_DELAY : 0,
    );
    return () => clearTimeout(timer);
  }, [photoId, edge, stamp, show]);

  return src;
}

function ReferenceImage({ photo }: { photo: CatalogPhoto }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[entries.length - 1].contentRect;
      setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const edge = size ? renderEdge(size.w, size.h, window.devicePixelRatio || 1, photo.width, photo.height) : 0;
  const stamp = api.catalog.useEditedAt(photo.id);
  const src = useReferenceFrame(photo.id, edge, stamp);

  return (
    <div ref={box} style={{ position: "relative", flex: "1 1 0", minWidth: 0, minHeight: 0 }}>
      {src && (
        <img
          src={src}
          alt={`Reference photo ${photo.filename}`}
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
    </div>
  );
}

export function ReferencePane() {
  const { photoId, shown, layout } = store()();
  const photo = api.stores.useCatalogStore((s) => (photoId === null ? undefined : s.photos.find((p) => p.id === photoId)));
  if (!shown || !photo) return null;

  const { Button, tokens } = api.ui;
  const above = layout === "above";
  const other = above ? "beside" : "above";

  return (
    <div
      data-canvas-beside={layout}
      style={{
        flex: "0 0 50%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        paddingRight: above ? 0 : GAP,
        paddingBottom: above ? GAP : 0,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6, fontSize: 11, color: tokens.textMuted }}>
        <span style={{ color: tokens.textSecondary }}>Reference</span>
        <span
          title={photo.relPath}
          style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tokens.textPrimary }}
        >
          {photo.filename}
        </span>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Show the reference ${other}`}
          title={`Show the reference ${other} the photo you're editing`}
          onClick={() => write({ layout: other })}
        >
          {above ? <BesideIcon /> : <AboveIcon />}
        </Button>
        <Button size="sm" variant="ghost" aria-label="Close the reference" title="Close the reference" onClick={() => write({ shown: false })}>
          <CloseIcon />
        </Button>
      </div>
      <ReferenceImage photo={photo} />
    </div>
  );
}
