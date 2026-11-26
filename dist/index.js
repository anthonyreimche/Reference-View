//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/icons.tsx
function r({ size: t, children: n }) {
	return /* @__PURE__ */ e.createElement("svg", {
		width: t,
		height: t,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": !0
	}, n);
}
var i = ({ size: t = 13 }) => /* @__PURE__ */ e.createElement(r, { size: t }, /* @__PURE__ */ e.createElement("rect", {
	x: 2,
	y: 6,
	width: 9,
	height: 12,
	rx: 1.5
}), /* @__PURE__ */ e.createElement("rect", {
	x: 13,
	y: 6,
	width: 9,
	height: 12,
	rx: 1.5
}), /* @__PURE__ */ e.createElement("line", {
	x1: 6.5,
	y1: 3,
	x2: 6.5,
	y2: 6
})), a = ({ size: t = 13 }) => /* @__PURE__ */ e.createElement(r, { size: t }, /* @__PURE__ */ e.createElement("rect", {
	x: 3,
	y: 4,
	width: 18,
	height: 16,
	rx: 2
}), /* @__PURE__ */ e.createElement("line", {
	x1: 12,
	y1: 4,
	x2: 12,
	y2: 20
})), o = ({ size: t = 13 }) => /* @__PURE__ */ e.createElement(r, { size: t }, /* @__PURE__ */ e.createElement("rect", {
	x: 3,
	y: 4,
	width: 18,
	height: 16,
	rx: 2
}), /* @__PURE__ */ e.createElement("line", {
	x1: 3,
	y1: 12,
	x2: 21,
	y2: 12
})), s = ({ size: t = 13 }) => /* @__PURE__ */ e.createElement(r, { size: t }, /* @__PURE__ */ e.createElement("line", {
	x1: 6,
	y1: 6,
	x2: 18,
	y2: 18
}), /* @__PURE__ */ e.createElement("line", {
	x1: 18,
	y1: 6,
	x2: 6,
	y2: 18
})), c = "reference-view", l = `${c}.pane`, u = `${c}.toolbar`, d = `${c}.use`, f = `${c}.toggle`, p = "reference.photo", m = "The photo Reference View shows beside the open photo, or null while it shows none. { photoId, name }.", h = [
	"photoId",
	"shown",
	"layout"
];
function g(e) {
	let t = e("photoId"), n = e("shown"), r = e("layout");
	return {
		photoId: typeof t == "string" ? t : null,
		shown: n === !0,
		layout: r === "above" ? "above" : "beside"
	};
}
function _(e, t, n) {
	return e.shown ? {
		...e,
		shown: !1
	} : e.photoId !== null && n(e.photoId) ? {
		...e,
		shown: !0
	} : t === null ? e : {
		...e,
		photoId: t,
		shown: !0
	};
}
function v(e, t) {
	return !e.shown || !t || t.id !== e.photoId ? null : {
		photoId: t.id,
		name: t.filename
	};
}
var y = 256, b = 256, x = 4096;
function S(e, t, n, r, i) {
	if (e <= 0 || t <= 0 || r <= 0 || i <= 0) return 0;
	let a = Math.min(e / r, t / i), o = Math.max(r, i) * a * n;
	return Math.min(Math.max(Math.ceil(o / y) * y, b), x);
}
//#endregion
//#region src/store.ts
var C = null;
function w() {
	if (!C) throw Error("Reference View's store is used before activate()");
	return C;
}
var T = (e) => h.includes(e), E = () => t.stores.useCatalogStore.getState(), D = (e) => e === null ? void 0 : E().photos.find((t) => t.id === e);
function O(e) {
	let n = w().getState();
	for (let r of h) r in e && e[r] !== n[r] && t.settings.set(r, e[r]);
	w().setState(e);
}
function k() {
	O(_(w().getState(), E().activePhotoId, (e) => D(e) !== void 0));
}
function A(e) {
	O({
		photoId: e,
		shown: !0
	});
}
var j = (e, t) => e === t || e !== null && t !== null && e.photoId === t.photoId && e.name === t.name;
function M() {
	let { photoId: e } = w().getState(), n = v(w().getState(), D(e));
	j(t.variables.get("reference.photo")?.value ?? null, n) || t.variables.update(p, () => n);
}
function N() {
	C = t.stores.create()(() => g((e) => t.settings.get(e, void 0))), t.variables.register(p, {
		initial: null,
		description: m
	});
	let e = [
		t.settings.onChange((e, t) => {
			if (!T(e)) return;
			let n = g((n) => n === e ? t : w().getState()[n]);
			w().setState({ [e]: n[e] });
		}),
		w().subscribe(M),
		t.stores.useCatalogStore.subscribe((e, t) => {
			e.photos !== t.photos && M();
		})
	];
	return M(), () => {
		for (let t of e) t();
		C = null;
	};
}
//#endregion
//#region src/ReferencePane.tsx
var P = 250, F = 12, I = (e) => ({
	format: "image/jpeg",
	quality: .92,
	longEdge: e,
	colorSpace: "srgb",
	sharpenAmount: 0,
	includeMetadata: !1
});
function L(n, r, i) {
	let [a, o] = e.useState(null), s = e.useRef(null), c = e.useRef(0), l = e.useRef(null), u = e.useCallback((e) => {
		s.current && URL.revokeObjectURL(s.current), s.current = e, o(e);
	}, []);
	return e.useEffect(() => {
		let e = !0;
		return l.current = null, o(null), t.catalog.readPreview(n).then((t) => {
			e && t && s.current === null && u(URL.createObjectURL(t));
		}), () => {
			e = !1, c.current++, s.current && URL.revokeObjectURL(s.current), s.current = null;
		};
	}, [n, u]), e.useEffect(() => {
		if (r <= 0) return;
		let e = l.current;
		if (e && e.stamp === i && e.edge >= r) return;
		let a = ++c.current, o = setTimeout(() => {
			let e = t.stores.useCatalogStore.getState().photos.find((e) => e.id === n);
			e && t.export.renderPhotos([e], I(r), void 0, { processors: !1 }).then(([e]) => {
				a === c.current && e?.blob && (l.current = {
					edge: r,
					stamp: i
				}, u(URL.createObjectURL(e.blob)));
			}).catch((e) => console.warn("[reference-view] couldn't render the reference photo:", e));
		}, e ? P : 0);
		return () => clearTimeout(o);
	}, [
		n,
		r,
		i,
		u
	]), a;
}
function R({ photo: n }) {
	let r = e.useRef(null), [i, a] = e.useState(null);
	e.useEffect(() => {
		let e = r.current;
		if (!e) return;
		let t = new ResizeObserver((e) => {
			let { width: t, height: n } = e[e.length - 1].contentRect;
			a((e) => e && e.w === t && e.h === n ? e : {
				w: t,
				h: n
			});
		});
		return t.observe(e), () => t.disconnect();
	}, []);
	let o = i ? S(i.w, i.h, window.devicePixelRatio || 1, n.width, n.height) : 0, s = t.catalog.useEditedAt(n.id), c = L(n.id, o, s);
	return /* @__PURE__ */ e.createElement("div", {
		ref: r,
		style: {
			position: "relative",
			flex: "1 1 0",
			minWidth: 0,
			minHeight: 0
		}
	}, c && /* @__PURE__ */ e.createElement("img", {
		src: c,
		alt: `Reference photo ${n.filename}`,
		draggable: !1,
		style: {
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			objectFit: "contain"
		}
	}));
}
function z() {
	let { photoId: n, shown: r, layout: i } = w()(), c = t.stores.useCatalogStore((e) => n === null ? void 0 : e.photos.find((e) => e.id === n));
	if (!r || !c) return null;
	let { Button: l, tokens: u } = t.ui, d = i === "above", f = d ? "beside" : "above";
	return /* @__PURE__ */ e.createElement("div", {
		"data-canvas-beside": i,
		style: {
			flex: "0 0 50%",
			display: "flex",
			flexDirection: "column",
			minWidth: 0,
			minHeight: 0,
			paddingRight: d ? 0 : F,
			paddingBottom: d ? F : 0,
			boxSizing: "border-box"
		}
	}, /* @__PURE__ */ e.createElement("div", { style: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		paddingBottom: 6,
		fontSize: 11,
		color: u.textMuted
	} }, /* @__PURE__ */ e.createElement("span", { style: { color: u.textSecondary } }, "Reference"), /* @__PURE__ */ e.createElement("span", {
		title: c.relPath,
		style: {
			flex: "1 1 auto",
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			color: u.textPrimary
		}
	}, c.filename), /* @__PURE__ */ e.createElement(l, {
		size: "sm",
		variant: "ghost",
		"aria-label": `Show the reference ${f}`,
		title: `Show the reference ${f} the photo you're editing`,
		onClick: () => O({ layout: f })
	}, d ? /* @__PURE__ */ e.createElement(a, null) : /* @__PURE__ */ e.createElement(o, null)), /* @__PURE__ */ e.createElement(l, {
		size: "sm",
		variant: "ghost",
		"aria-label": "Close the reference",
		title: "Close the reference",
		onClick: () => O({ shown: !1 })
	}, /* @__PURE__ */ e.createElement(s, null))), /* @__PURE__ */ e.createElement(R, { photo: c }));
}
//#endregion
//#region src/index.tsx
function B() {
	let n = w()((e) => e.shown), r = t.keybindings.getBinding(f);
	return /* @__PURE__ */ e.createElement(t.ui.Button, {
		size: "sm",
		variant: "ghost",
		active: n,
		"aria-pressed": n,
		title: `Show a reference photo beside this one${r ? ` (${r})` : ""}`,
		onClick: k
	}, /* @__PURE__ */ e.createElement(i, null), /* @__PURE__ */ e.createElement("span", null, "Reference"));
}
var V = null;
function H(e) {
	n(e), V = N(), e.registerSlot({
		id: l,
		slot: "develop-canvas-beside",
		component: z
	}), e.registerSlot({
		id: u,
		slot: "develop-toolbar",
		component: B
	}), e.registerGridMenuItem({
		id: d,
		label: "Use as reference photo",
		enabled: (e) => e.length === 1,
		onClick: (e) => {
			e.length === 1 && A(e[0]);
		}
	}), e.registerKeybinding({
		id: f,
		label: "Show reference photo",
		category: "Develop",
		defaultCombo: "Shift+R",
		handler: () => {
			e.navigation.current() === "develop" && k();
		}
	});
}
function U() {
	V?.(), V = null;
}
//#endregion
export { H as activate, U as deactivate };

//# sourceMappingURL=index.js.map