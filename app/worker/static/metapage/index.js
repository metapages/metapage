const q = {
  Remove: "remove",
  Replace: "replace",
  Add: "add"
}, De = Symbol.for("__MUTATIVE_PROXY_DRAFT__"), Xe = Symbol("__MUTATIVE_RAW_RETURN_SYMBOL__"), Tt = Symbol.iterator, rt = {
  mutable: "mutable",
  immutable: "immutable"
}, re = {};
function At(e, t) {
  return e instanceof Map ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function be(e, t) {
  if (t in e) {
    let n = Reflect.getPrototypeOf(e);
    for (; n; ) {
      const i = Reflect.getOwnPropertyDescriptor(n, t);
      if (i)
        return i;
      n = Reflect.getPrototypeOf(n);
    }
  }
}
function st(e) {
  var t;
  return (t = e.copy) !== null && t !== void 0 ? t : e.original;
}
function wt(e) {
  return !!$(e);
}
function $(e) {
  return typeof e != "object" ? null : e == null ? void 0 : e[De];
}
function oe(e) {
  var t;
  const n = $(e);
  return n ? (t = n.copy) !== null && t !== void 0 ? t : n.original : e;
}
function ut(e, t) {
  if (!e || typeof e != "object")
    return !1;
  let n;
  return Object.getPrototypeOf(e) === Object.prototype || Array.isArray(e) || e instanceof Map || e instanceof Set || !!(t != null && t.mark) && ((n = t.mark(e, rt)) === rt.immutable || typeof n == "function");
}
function Le(e, t = []) {
  if (Object.hasOwnProperty.call(e, "key")) {
    const n = e.parent.copy, i = $(mt(n, e.key));
    if (i !== null && (i == null ? void 0 : i.original) !== e.original)
      return null;
    const o = e.parent.type === 3, c = o ? Array.from(e.parent.setMap.keys()).indexOf(e.key) : e.key;
    if (!(o && n.size > c || At(n, c)))
      return null;
    t.push(c);
  }
  if (e.parent)
    return Le(e.parent, t);
  t.reverse();
  try {
    Qe(e.copy, t);
  } catch {
    return null;
  }
  return t;
}
function _t(e) {
  return Array.isArray(e) ? 1 : e instanceof Map ? 2 : e instanceof Set ? 3 : 0;
}
function mt(e, t) {
  return _t(e) === 2 ? e.get(t) : e[t];
}
function Dt(e, t, n) {
  _t(e) === 2 ? e.set(t, n) : e[t] = n;
}
function Ht(e, t) {
  const n = $(e);
  return (n ? st(n) : e)[t];
}
function dt(e, t) {
  return e === t ? e !== 0 || 1 / e === 1 / t : e !== e && t !== t;
}
function Gt(e) {
  if (e)
    for (; e.finalities.revoke.length > 0; )
      e.finalities.revoke.pop()();
}
function bt(e, t) {
  return t ? e : [""].concat(e).map((n) => {
    const i = `${n}`;
    return i.indexOf("/") === -1 && i.indexOf("~") === -1 ? i : i.replace(/~/g, "~0").replace(/\//g, "~1");
  }).join("/");
}
function Qe(e, t) {
  for (let n = 0; n < t.length - 1; n += 1) {
    const i = t[n];
    if (e = mt(_t(e) === 3 ? Array.from(e) : e, i), typeof e != "object")
      throw new Error(`Cannot resolve patch at '${t.join("/")}'.`);
  }
  return e;
}
function Ze(e) {
  const t = Object.create(Object.getPrototypeOf(e));
  return Reflect.ownKeys(e).forEach((n) => {
    let i = Reflect.getOwnPropertyDescriptor(e, n);
    if (i.enumerable && i.configurable && i.writable) {
      t[n] = e[n];
      return;
    }
    i.writable || (i.writable = !0, i.configurable = !0), (i.get || i.set) && (i = {
      configurable: !0,
      writable: !0,
      enumerable: i.enumerable,
      value: e[n]
    }), Reflect.defineProperty(t, n, i);
  }), t;
}
const tn = Object.prototype.propertyIsEnumerable;
function Ue(e, t) {
  let n;
  if (Array.isArray(e))
    return Array.prototype.concat.call(e);
  if (e instanceof Set)
    return new Set(e.values());
  if (e instanceof Map)
    return new Map(e);
  if (t != null && t.mark && (n = t.mark(e, rt), n !== void 0) && n !== rt.mutable) {
    if (n === rt.immutable)
      return Ze(e);
    if (typeof n == "function") {
      if (t.enablePatches || t.enableAutoFreeze)
        throw new Error("You can't use mark and patches or auto freeze together.");
      return n();
    }
    throw new Error(`Unsupported mark result: ${n}`);
  } else if (typeof e == "object" && Object.getPrototypeOf(e) === Object.prototype) {
    const i = {};
    return Object.keys(e).forEach((o) => {
      i[o] = e[o];
    }), Object.getOwnPropertySymbols(e).forEach((o) => {
      tn.call(e, o) && (i[o] = e[o]);
    }), i;
  } else
    throw new Error("Please check mark() to ensure that it is a stable marker draftable function.");
}
function et(e) {
  e.copy || (e.copy = Ue(e.original, e.options));
}
function Ot(e) {
  if (!ut(e))
    return oe(e);
  if (Array.isArray(e))
    return e.map(Ot);
  if (e instanceof Map)
    return new Map(Array.from(e.entries()).map(([n, i]) => [n, Ot(i)]));
  if (e instanceof Set)
    return new Set(Array.from(e).map(Ot));
  const t = Object.create(Object.getPrototypeOf(e));
  for (const n in e)
    t[n] = Ot(e[n]);
  return t;
}
function Nt(e) {
  return wt(e) ? Ot(e) : e;
}
function lt(e) {
  var t;
  e.assignedMap = (t = e.assignedMap) !== null && t !== void 0 ? t : /* @__PURE__ */ new Map(), e.operated || (e.operated = !0, e.parent && lt(e.parent));
}
function we() {
  throw new Error("Cannot modify frozen object");
}
function It(e, t, n, i, o) {
  {
    n = n ?? /* @__PURE__ */ new WeakMap(), i = i ?? [], o = o ?? [];
    const f = n.has(e) ? n.get(e) : e;
    if (i.length > 0) {
      const h = i.indexOf(f);
      if (f && typeof f == "object" && h !== -1)
        throw i[0] === f ? new Error("Forbids circular reference") : new Error(`Forbids circular reference: ~/${o.slice(0, h).map((g, y) => {
          if (typeof g == "symbol")
            return `[${g.toString()}]`;
          const b = i[y];
          return typeof g == "object" && (b instanceof Map || b instanceof Set) ? Array.from(b.keys()).indexOf(g) : g;
        }).join("/")}`);
      i.push(f), o.push(t);
    } else
      i.push(f);
  }
  if (Object.isFrozen(e) || wt(e)) {
    i.pop(), o.pop();
    return;
  }
  switch (_t(e)) {
    case 2:
      for (const [h, g] of e)
        It(h, h, n, i, o), It(g, h, n, i, o);
      e.set = e.clear = e.delete = we;
      break;
    case 3:
      for (const h of e)
        It(h, h, n, i, o);
      e.add = e.clear = e.delete = we;
      break;
    case 1:
      Object.freeze(e);
      let f = 0;
      for (const h of e)
        It(h, f, n, i, o), f += 1;
      break;
    default:
      Object.freeze(e), Object.keys(e).forEach((h) => {
        const g = e[h];
        It(g, h, n, i, o);
      });
  }
  i.pop(), o.pop();
}
function ae(e, t) {
  const n = _t(e);
  if (n === 0)
    Reflect.ownKeys(e).forEach((i) => {
      t(i, e[i], e);
    });
  else if (n === 1) {
    let i = 0;
    for (const o of e)
      t(i, o, e), i += 1;
  } else
    e.forEach((i, o) => t(o, i, e));
}
function xe(e, t, n) {
  if (wt(e) || !ut(e, n) || t.has(e) || Object.isFrozen(e))
    return;
  const i = e instanceof Set, o = i ? /* @__PURE__ */ new Map() : void 0;
  if (t.add(e), ae(e, (c, f) => {
    var h;
    if (wt(f)) {
      const g = $(f);
      et(g);
      const y = !((h = g.assignedMap) === null || h === void 0) && h.size || g.operated ? g.copy : g.original;
      Dt(i ? o : e, c, y);
    } else
      xe(f, t, n);
  }), o) {
    const c = e, f = Array.from(c);
    c.clear(), f.forEach((h) => {
      c.add(o.has(h) ? o.get(h) : h);
    });
  }
}
function en(e, t) {
  const n = e.type === 3 ? e.setMap : e.copy;
  e.finalities.revoke.length > 1 && e.assignedMap.get(t) && n && xe(mt(n, t), e.finalities.handledSet, e.options);
}
function Xt(e) {
  e.type === 3 && e.copy && (e.copy.clear(), e.setMap.forEach((t) => {
    e.copy.add(oe(t));
  }));
}
function Qt(e, t, n, i) {
  if (e.operated && e.assignedMap && e.assignedMap.size > 0 && !e.finalized) {
    if (n && i) {
      const c = Le(e);
      c && t(e, c, n, i);
    }
    e.finalized = !0;
  }
}
function ue(e, t, n, i) {
  const o = $(n);
  o && (o.callbacks || (o.callbacks = []), o.callbacks.push((c, f) => {
    var h;
    const g = e.type === 3 ? e.setMap : e.copy;
    if (dt(mt(g, t), n)) {
      let y = o.original;
      o.copy && (y = o.copy), Xt(e), Qt(e, i, c, f), e.options.enableAutoFreeze && (e.options.updatedValues = (h = e.options.updatedValues) !== null && h !== void 0 ? h : /* @__PURE__ */ new WeakMap(), e.options.updatedValues.set(y, o.original)), Dt(g, t, y);
    }
  }), e.options.enableAutoFreeze && o.finalities !== e.finalities && (e.options.enableAutoFreeze = !1)), ut(n, e.options) && e.finalities.draft.push(() => {
    const c = e.type === 3 ? e.setMap : e.copy;
    dt(mt(c, t), n) && en(e, t);
  });
}
function nn(e, t, n, i, o) {
  let { original: c, assignedMap: f, options: h } = e, g = e.copy;
  g.length < c.length && ([c, g] = [g, c], [n, i] = [i, n]);
  for (let y = 0; y < c.length; y += 1)
    if (f.get(y.toString()) && g[y] !== c[y]) {
      const b = t.concat([y]), O = bt(b, o);
      n.push({
        op: q.Replace,
        path: O,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: Nt(g[y])
      }), i.push({
        op: q.Replace,
        path: O,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: Nt(c[y])
      });
    }
  for (let y = c.length; y < g.length; y += 1) {
    const b = t.concat([y]), O = bt(b, o);
    n.push({
      op: q.Add,
      path: O,
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: Nt(g[y])
    });
  }
  if (c.length < g.length) {
    const { arrayLengthAssignment: y = !0 } = h.enablePatches;
    if (y) {
      const b = t.concat(["length"]), O = bt(b, o);
      i.push({
        op: q.Replace,
        path: O,
        value: c.length
      });
    } else
      for (let b = g.length; c.length < b; b -= 1) {
        const O = t.concat([b - 1]), U = bt(O, o);
        i.push({
          op: q.Remove,
          path: U
        });
      }
  }
}
function sn({ original: e, copy: t, assignedMap: n }, i, o, c, f) {
  n.forEach((h, g) => {
    const y = mt(e, g), b = Nt(mt(t, g)), O = h ? At(e, g) ? q.Replace : q.Add : q.Remove;
    if (dt(y, b) && O === q.Replace)
      return;
    const U = i.concat(g), B = bt(U, f);
    o.push(O === q.Remove ? { op: O, path: B } : { op: O, path: B, value: b }), c.push(O === q.Add ? { op: q.Remove, path: B } : O === q.Remove ? { op: q.Add, path: B, value: y } : { op: q.Replace, path: B, value: y });
  });
}
function rn({ original: e, copy: t }, n, i, o, c) {
  let f = 0;
  e.forEach((h) => {
    if (!t.has(h)) {
      const g = n.concat([f]), y = bt(g, c);
      i.push({
        op: q.Remove,
        path: y,
        value: h
      }), o.unshift({
        op: q.Add,
        path: y,
        value: h
      });
    }
    f += 1;
  }), f = 0, t.forEach((h) => {
    if (!e.has(h)) {
      const g = n.concat([f]), y = bt(g, c);
      i.push({
        op: q.Add,
        path: y,
        value: h
      }), o.unshift({
        op: q.Remove,
        path: y,
        value: h
      });
    }
    f += 1;
  });
}
function jt(e, t, n, i) {
  const { pathAsArray: o = !0 } = e.options.enablePatches;
  switch (e.type) {
    case 0:
    case 2:
      return sn(e, t, n, i, o);
    case 1:
      return nn(e, t, n, i, o);
    case 3:
      return rn(e, t, n, i, o);
  }
}
let on = !1;
const $t = (e, t, n = !1) => {
  if (typeof e == "object" && e !== null && (!ut(e, t) || n) && !on)
    throw new Error("Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.");
}, Zt = {
  get size() {
    return st($(this)).size;
  },
  has(e) {
    return st($(this)).has(e);
  },
  set(e, t) {
    const n = $(this), i = st(n);
    return (!i.has(e) || !dt(i.get(e), t)) && (et(n), lt(n), n.assignedMap.set(e, !0), n.copy.set(e, t), ue(n, e, t, jt)), this;
  },
  delete(e) {
    if (!this.has(e))
      return !1;
    const t = $(this);
    return et(t), lt(t), t.original.has(e) ? t.assignedMap.set(e, !1) : t.assignedMap.delete(e), t.copy.delete(e), !0;
  },
  clear() {
    const e = $(this);
    if (this.size) {
      et(e), lt(e), e.assignedMap = /* @__PURE__ */ new Map();
      for (const [t] of e.original)
        e.assignedMap.set(t, !1);
      e.copy.clear();
    }
  },
  forEach(e, t) {
    const n = $(this);
    st(n).forEach((i, o) => {
      e.call(t, this.get(o), o, this);
    });
  },
  get(e) {
    var t, n;
    const i = $(this), o = st(i).get(e), c = ((n = (t = i.options).mark) === null || n === void 0 ? void 0 : n.call(t, o, rt)) === rt.mutable;
    if (i.options.strict && $t(o, i.options, c), c || i.finalized || !ut(o, i.options) || o !== i.original.get(e))
      return o;
    const f = re.createDraft({
      original: o,
      parentDraft: i,
      key: e,
      finalities: i.finalities,
      options: i.options
    });
    return et(i), i.copy.set(e, f), f;
  },
  keys() {
    return st($(this)).keys();
  },
  values() {
    const e = this.keys();
    return {
      [Tt]: () => this.values(),
      next: () => {
        const t = e.next();
        return t.done ? t : {
          done: !1,
          value: this.get(t.value)
        };
      }
    };
  },
  entries() {
    const e = this.keys();
    return {
      [Tt]: () => this.entries(),
      next: () => {
        const t = e.next();
        if (t.done)
          return t;
        const n = this.get(t.value);
        return {
          done: !1,
          value: [t.value, n]
        };
      }
    };
  },
  [Tt]() {
    return this.entries();
  }
}, an = Reflect.ownKeys(Zt), _e = (e, t, { isValuesIterator: n }) => () => {
  var i, o;
  const c = t.next();
  if (c.done)
    return c;
  const f = c.value;
  let h = e.setMap.get(f);
  const g = $(h), y = ((o = (i = e.options).mark) === null || o === void 0 ? void 0 : o.call(i, h, rt)) === rt.mutable;
  if (e.options.strict && $t(f, e.options, y), !y && !g && ut(f, e.options) && !e.finalized && e.original.has(f)) {
    const b = re.createDraft({
      original: f,
      parentDraft: e,
      key: f,
      finalities: e.finalities,
      options: e.options
    });
    e.setMap.set(f, b), h = b;
  } else
    g && (h = g.proxy);
  return {
    done: !1,
    value: n ? h : [h, h]
  };
}, te = {
  get size() {
    return $(this).setMap.size;
  },
  has(e) {
    const t = $(this);
    if (t.setMap.has(e))
      return !0;
    et(t);
    const n = $(e);
    return !!(n && t.setMap.has(n.original));
  },
  add(e) {
    const t = $(this);
    return this.has(e) || (et(t), lt(t), t.assignedMap.set(e, !0), t.setMap.set(e, e), ue(t, e, e, jt)), this;
  },
  delete(e) {
    if (!this.has(e))
      return !1;
    const t = $(this);
    et(t), lt(t);
    const n = $(e);
    return n && t.setMap.has(n.original) ? (t.assignedMap.set(n.original, !1), t.setMap.delete(n.original)) : (!n && t.setMap.has(e) ? t.assignedMap.set(e, !1) : t.assignedMap.delete(e), t.setMap.delete(e));
  },
  clear() {
    if (!this.size)
      return;
    const e = $(this);
    et(e), lt(e);
    for (const t of e.original)
      e.assignedMap.set(t, !1);
    e.setMap.clear();
  },
  values() {
    const e = $(this);
    et(e);
    const t = e.setMap.keys();
    return {
      [Symbol.iterator]: () => this.values(),
      next: _e(e, t, { isValuesIterator: !0 })
    };
  },
  entries() {
    const e = $(this);
    et(e);
    const t = e.setMap.keys();
    return {
      [Symbol.iterator]: () => this.entries(),
      next: _e(e, t, {
        isValuesIterator: !1
      })
    };
  },
  keys() {
    return this.values();
  },
  [Tt]() {
    return this.values();
  },
  forEach(e, t) {
    const n = this.values();
    let i = n.next();
    for (; !i.done; )
      e.call(t, i.value, i.value, this), i = n.next();
  }
}, un = Reflect.ownKeys(te), Be = /* @__PURE__ */ new WeakSet(), ke = {
  get(e, t, n) {
    var i, o;
    const c = (i = e.copy) === null || i === void 0 ? void 0 : i[t];
    if (c && Be.has(c))
      return c;
    if (t === De)
      return e;
    let f;
    if (e.options.mark) {
      const y = t === "size" && (e.original instanceof Map || e.original instanceof Set) ? Reflect.get(e.original, t) : Reflect.get(e.original, t, n);
      if (f = e.options.mark(y, rt), f === rt.mutable)
        return e.options.strict && $t(y, e.options, !0), y;
    }
    const h = st(e);
    if (h instanceof Map && an.includes(t)) {
      if (t === "size")
        return Object.getOwnPropertyDescriptor(Zt, "size").get.call(e.proxy);
      const y = Zt[t];
      if (y)
        return y.bind(e.proxy);
    }
    if (h instanceof Set && un.includes(t)) {
      if (t === "size")
        return Object.getOwnPropertyDescriptor(te, "size").get.call(e.proxy);
      const y = te[t];
      if (y)
        return y.bind(e.proxy);
    }
    if (!At(h, t)) {
      const y = be(h, t);
      return y ? "value" in y ? y.value : (
        // !case: support for getter
        (o = y.get) === null || o === void 0 ? void 0 : o.call(e.proxy)
      ) : void 0;
    }
    const g = h[t];
    if (e.options.strict && $t(g, e.options), e.finalized || !ut(g, e.options))
      return g;
    if (g === Ht(e.original, t)) {
      if (et(e), e.copy[t] = fe({
        original: e.original[t],
        parentDraft: e,
        key: e.type === 1 ? Number(t) : t,
        finalities: e.finalities,
        options: e.options
      }), typeof f == "function") {
        const y = $(e.copy[t]);
        return et(y), lt(y), y.copy;
      }
      return e.copy[t];
    }
    return g;
  },
  set(e, t, n) {
    var i;
    if (e.type === 3 || e.type === 2)
      throw new Error("Map/Set draft does not support any property assignment.");
    let o;
    if (e.type === 1 && t !== "length" && !(Number.isInteger(o = Number(t)) && o >= 0 && (t === 0 || o === 0 || String(o) === String(t))))
      throw new Error("Only supports setting array indices and the 'length' property.");
    const c = be(st(e), t);
    if (c != null && c.set)
      return c.set.call(e.proxy, n), !0;
    const f = Ht(st(e), t), h = $(f);
    return h && dt(h.original, n) ? (e.copy[t] = n, e.assignedMap = (i = e.assignedMap) !== null && i !== void 0 ? i : /* @__PURE__ */ new Map(), e.assignedMap.set(t, !1), !0) : (dt(n, f) && (n !== void 0 || At(e.original, t)) || (et(e), lt(e), At(e.original, t) && dt(n, e.original[t]) ? e.assignedMap.delete(t) : e.assignedMap.set(t, !0), e.copy[t] = n, ue(e, t, n, jt)), !0);
  },
  has(e, t) {
    return t in st(e);
  },
  ownKeys(e) {
    return Reflect.ownKeys(st(e));
  },
  getOwnPropertyDescriptor(e, t) {
    const n = st(e), i = Reflect.getOwnPropertyDescriptor(n, t);
    return i && {
      writable: !0,
      configurable: e.type !== 1 || t !== "length",
      enumerable: i.enumerable,
      value: n[t]
    };
  },
  getPrototypeOf(e) {
    return Reflect.getPrototypeOf(e.original);
  },
  setPrototypeOf() {
    throw new Error("Cannot call 'setPrototypeOf()' on drafts");
  },
  defineProperty() {
    throw new Error("Cannot call 'defineProperty()' on drafts");
  },
  deleteProperty(e, t) {
    var n;
    return e.type === 1 ? ke.set.call(this, e, t, void 0, e.proxy) : (Ht(e.original, t) !== void 0 || t in e.original ? (et(e), lt(e), e.assignedMap.set(t, !1)) : (e.assignedMap = (n = e.assignedMap) !== null && n !== void 0 ? n : /* @__PURE__ */ new Map(), e.assignedMap.delete(t)), e.copy && delete e.copy[t], !0);
  }
};
function fe(e) {
  const { original: t, parentDraft: n, key: i, finalities: o, options: c } = e, f = _t(t), h = {
    type: f,
    finalized: !1,
    parent: n,
    original: t,
    copy: null,
    proxy: null,
    finalities: o,
    options: c,
    // Mapping of draft Set items to their corresponding draft values.
    setMap: f === 3 ? new Map(t.entries()) : void 0
  };
  (i || "key" in e) && (h.key = i);
  const { proxy: g, revoke: y } = Proxy.revocable(f === 1 ? Object.assign([], h) : h, ke);
  if (o.revoke.push(y), Be.add(g), h.proxy = g, n) {
    const b = n;
    b.finalities.draft.push((O, U) => {
      var B, I;
      const L = $(g);
      let d = b.type === 3 ? b.setMap : b.copy;
      const S = mt(d, i), R = $(S);
      if (R) {
        let E = R.original;
        R.operated && (E = oe(S)), Xt(R), Qt(R, jt, O, U), b.options.enableAutoFreeze && (b.options.updatedValues = (B = b.options.updatedValues) !== null && B !== void 0 ? B : /* @__PURE__ */ new WeakMap(), b.options.updatedValues.set(E, R.original)), Dt(d, i, E);
      }
      (I = L.callbacks) === null || I === void 0 || I.forEach((E) => {
        E(O, U);
      });
    });
  } else {
    const b = $(g);
    b.finalities.draft.push((O, U) => {
      Xt(b), Qt(b, jt, O, U);
    });
  }
  return g;
}
re.createDraft = fe;
function fn(e, t, n, i, o) {
  var c;
  const f = $(e), h = (c = f == null ? void 0 : f.original) !== null && c !== void 0 ? c : e, g = !!t.length;
  if (f != null && f.operated)
    for (; f.finalities.draft.length > 0; )
      f.finalities.draft.pop()(n, i);
  const y = g ? t[0] : f ? f.operated ? f.copy : f.original : e;
  return f && Gt(f), o && It(y, y, f == null ? void 0 : f.options.updatedValues), [
    y,
    n && g ? [{ op: q.Replace, path: [], value: t[0] }] : n,
    i && g ? [{ op: q.Replace, path: [], value: h }] : i
  ];
}
function ln(e, t) {
  var n;
  const i = {
    draft: [],
    revoke: [],
    handledSet: /* @__PURE__ */ new WeakSet()
  };
  let o, c;
  t.enablePatches && (o = [], c = []);
  const h = ((n = t.mark) === null || n === void 0 ? void 0 : n.call(t, e, rt)) === rt.mutable || !ut(e, t) ? e : fe({
    original: e,
    parentDraft: null,
    finalities: i,
    options: t
  });
  return [
    h,
    (g = []) => {
      const [y, b, O] = fn(h, g, o, c, t.enableAutoFreeze);
      return t.enablePatches ? [y, b, O] : y;
    }
  ];
}
function ee(e) {
  const { rootDraft: t, value: n, useRawReturn: i = !1, isRoot: o = !0 } = e;
  ae(n, (c, f, h) => {
    const g = $(f);
    if (g && t && g.finalities === t.finalities) {
      e.isContainDraft = !0;
      const y = g.original;
      if (h instanceof Set) {
        const b = Array.from(h);
        h.clear(), b.forEach((O) => h.add(c === O ? y : O));
      } else
        Dt(h, c, y);
    } else
      typeof f == "object" && f !== null && (e.value = f, e.isRoot = !1, ee(e));
  }), o && (e.isContainDraft || console.warn("The return value does not contain any draft, please use 'rawReturn()' to wrap the return value to improve performance."), i && console.warn("The return value contains drafts, please don't use 'rawReturn()' to wrap the return value."));
}
function Te(e) {
  const t = $(e);
  if (!ut(e, t == null ? void 0 : t.options))
    return e;
  const n = _t(e);
  if (t && !t.operated)
    return t.original;
  let i;
  function o() {
    i = n === 2 ? new Map(e) : n === 3 ? Array.from(t.setMap.values()) : Ue(e, t == null ? void 0 : t.options);
  }
  if (t) {
    t.finalized = !0;
    try {
      o();
    } finally {
      t.finalized = !1;
    }
  } else
    i = e;
  return ae(i, (c, f) => {
    if (t && dt(mt(t.original, c), f))
      return;
    const h = Te(f);
    h !== f && (i === e && o(), Dt(i, c, h));
  }), n === 3 ? new Set(i) : i;
}
function ve(e) {
  if (!wt(e))
    throw new Error(`current() is only used for Draft, parameter: ${e}`);
  return Te(e);
}
const cn = (e) => {
  if (e !== void 0 && Object.prototype.toString.call(e) !== "[object Object]")
    throw new Error(`Invalid options: ${String(e)}, 'options' should be an object.`);
  return function t(n, i, o) {
    var c, f, h;
    if (typeof n == "function" && typeof i != "function")
      return function(j, ...m) {
        return t(j, (v) => n.call(this, v, ...m), i);
      };
    const g = n, y = i;
    let b = o;
    if (typeof i != "function" && (b = i), b !== void 0 && Object.prototype.toString.call(b) !== "[object Object]")
      throw new Error(`Invalid options: ${b}, 'options' should be an object.`);
    b = Object.assign(Object.assign({}, e), b);
    const O = wt(g) ? ve(g) : g, U = Array.isArray(b.mark) ? (j, m) => {
      for (const v of b.mark) {
        if (typeof v != "function")
          throw new Error(`Invalid mark: ${v}, 'mark' should be a function.`);
        const a = v(j, m);
        if (a)
          return a;
      }
    } : b.mark, B = (c = b.enablePatches) !== null && c !== void 0 ? c : !1, I = (f = b.strict) !== null && f !== void 0 ? f : !1, d = {
      enableAutoFreeze: (h = b.enableAutoFreeze) !== null && h !== void 0 ? h : !1,
      mark: U,
      strict: I,
      enablePatches: B
    };
    if (!ut(O, d) && typeof O == "object" && O !== null)
      throw new Error("Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.");
    const [S, R] = ln(O, d);
    if (typeof i != "function") {
      if (!ut(O, d))
        throw new Error("Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.");
      return [S, R];
    }
    let E;
    try {
      E = y(S);
    } catch (j) {
      throw Gt($(S)), j;
    }
    const P = (j) => {
      const m = $(S);
      if (!wt(j)) {
        if (j !== void 0 && !dt(j, S) && (m != null && m.operated))
          throw new Error("Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.");
        const a = j == null ? void 0 : j[Xe];
        if (a) {
          const l = a[0];
          return d.strict && typeof j == "object" && j !== null && ee({
            rootDraft: m,
            value: j,
            useRawReturn: !0
          }), R([l]);
        }
        if (j !== void 0)
          return typeof j == "object" && j !== null && ee({ rootDraft: m, value: j }), R([j]);
      }
      if (j === S || j === void 0)
        return R([]);
      const v = $(j);
      if (d === v.options) {
        if (v.operated)
          throw new Error("Cannot return a modified child draft.");
        return R([ve(j)]);
      }
      return R([j]);
    };
    return E instanceof Promise ? E.then(P, (j) => {
      throw Gt($(S)), j;
    }) : P(E);
  };
}, Z = cn();
Object.prototype.constructor.toString();
function hn(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function Ut(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Ne = { exports: {} };
(function(e, t) {
  (function(n) {
    e.exports = n();
  })(function() {
    return function n(i, o, c) {
      function f(y, b) {
        if (!o[y]) {
          if (!i[y]) {
            var O = typeof Ut == "function" && Ut;
            if (!b && O)
              return O(y, !0);
            if (h)
              return h(y, !0);
            throw new Error("Cannot find module '" + y + "'");
          }
          b = o[y] = { exports: {} }, i[y][0].call(b.exports, function(U) {
            var B = i[y][1][U];
            return f(B || U);
          }, b, b.exports, n, i, o, c);
        }
        return o[y].exports;
      }
      for (var h = typeof Ut == "function" && Ut, g = 0; g < c.length; g++)
        f(c[g]);
      return f;
    }({ 1: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        var I = n("crypto");
        function L(m, v) {
          v = R(m, v);
          var a;
          return (a = v.algorithm !== "passthrough" ? I.createHash(v.algorithm) : new j()).write === void 0 && (a.write = a.update, a.end = a.update), P(v, a).dispatch(m), a.update || a.end(""), a.digest ? a.digest(v.encoding === "buffer" ? void 0 : v.encoding) : (m = a.read(), v.encoding !== "buffer" ? m.toString(v.encoding) : m);
        }
        (o = i.exports = L).sha1 = function(m) {
          return L(m);
        }, o.keys = function(m) {
          return L(m, { excludeValues: !0, algorithm: "sha1", encoding: "hex" });
        }, o.MD5 = function(m) {
          return L(m, { algorithm: "md5", encoding: "hex" });
        }, o.keysMD5 = function(m) {
          return L(m, { algorithm: "md5", encoding: "hex", excludeValues: !0 });
        };
        var d = I.getHashes ? I.getHashes().slice() : ["sha1", "md5"], S = (d.push("passthrough"), ["buffer", "hex", "binary", "base64"]);
        function R(m, v) {
          var a = {};
          if (a.algorithm = (v = v || {}).algorithm || "sha1", a.encoding = v.encoding || "hex", a.excludeValues = !!v.excludeValues, a.algorithm = a.algorithm.toLowerCase(), a.encoding = a.encoding.toLowerCase(), a.ignoreUnknown = v.ignoreUnknown === !0, a.respectType = v.respectType !== !1, a.respectFunctionNames = v.respectFunctionNames !== !1, a.respectFunctionProperties = v.respectFunctionProperties !== !1, a.unorderedArrays = v.unorderedArrays === !0, a.unorderedSets = v.unorderedSets !== !1, a.unorderedObjects = v.unorderedObjects !== !1, a.replacer = v.replacer || void 0, a.excludeKeys = v.excludeKeys || void 0, m === void 0)
            throw new Error("Object argument required.");
          for (var l = 0; l < d.length; ++l)
            d[l].toLowerCase() === a.algorithm.toLowerCase() && (a.algorithm = d[l]);
          if (d.indexOf(a.algorithm) === -1)
            throw new Error('Algorithm "' + a.algorithm + '"  not supported. supported values: ' + d.join(", "));
          if (S.indexOf(a.encoding) === -1 && a.algorithm !== "passthrough")
            throw new Error('Encoding "' + a.encoding + '"  not supported. supported values: ' + S.join(", "));
          return a;
        }
        function E(m) {
          if (typeof m == "function")
            return /^function\s+\w*\s*\(\s*\)\s*{\s+\[native code\]\s+}$/i.exec(Function.prototype.toString.call(m)) != null;
        }
        function P(m, v, a) {
          a = a || [];
          function l(r) {
            return v.update ? v.update(r, "utf8") : v.write(r, "utf8");
          }
          return { dispatch: function(r) {
            return this["_" + ((r = m.replacer ? m.replacer(r) : r) === null ? "null" : typeof r)](r);
          }, _object: function(r) {
            var w, _ = Object.prototype.toString.call(r), N = /\[object (.*)\]/i.exec(_);
            if (N = (N = N ? N[1] : "unknown:[" + _ + "]").toLowerCase(), 0 <= (_ = a.indexOf(r)))
              return this.dispatch("[CIRCULAR:" + _ + "]");
            if (a.push(r), h !== void 0 && h.isBuffer && h.isBuffer(r))
              return l("buffer:"), l(r);
            if (N === "object" || N === "function" || N === "asyncfunction")
              return _ = Object.keys(r), m.unorderedObjects && (_ = _.sort()), m.respectType === !1 || E(r) || _.splice(0, 0, "prototype", "__proto__", "constructor"), m.excludeKeys && (_ = _.filter(function(T) {
                return !m.excludeKeys(T);
              })), l("object:" + _.length + ":"), w = this, _.forEach(function(T) {
                w.dispatch(T), l(":"), m.excludeValues || w.dispatch(r[T]), l(",");
              });
            if (!this["_" + N]) {
              if (m.ignoreUnknown)
                return l("[" + N + "]");
              throw new Error('Unknown object type "' + N + '"');
            }
            this["_" + N](r);
          }, _array: function(r, T) {
            T = T !== void 0 ? T : m.unorderedArrays !== !1;
            var _ = this;
            if (l("array:" + r.length + ":"), !T || r.length <= 1)
              return r.forEach(function(z) {
                return _.dispatch(z);
              });
            var N = [], T = r.map(function(z) {
              var x = new j(), J = a.slice();
              return P(m, x, J).dispatch(z), N = N.concat(J.slice(a.length)), x.read().toString();
            });
            return a = a.concat(N), T.sort(), this._array(T, !1);
          }, _date: function(r) {
            return l("date:" + r.toJSON());
          }, _symbol: function(r) {
            return l("symbol:" + r.toString());
          }, _error: function(r) {
            return l("error:" + r.toString());
          }, _boolean: function(r) {
            return l("bool:" + r.toString());
          }, _string: function(r) {
            l("string:" + r.length + ":"), l(r.toString());
          }, _function: function(r) {
            l("fn:"), E(r) ? this.dispatch("[native]") : this.dispatch(r.toString()), m.respectFunctionNames !== !1 && this.dispatch("function-name:" + String(r.name)), m.respectFunctionProperties && this._object(r);
          }, _number: function(r) {
            return l("number:" + r.toString());
          }, _xml: function(r) {
            return l("xml:" + r.toString());
          }, _null: function() {
            return l("Null");
          }, _undefined: function() {
            return l("Undefined");
          }, _regexp: function(r) {
            return l("regex:" + r.toString());
          }, _uint8array: function(r) {
            return l("uint8array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _uint8clampedarray: function(r) {
            return l("uint8clampedarray:"), this.dispatch(Array.prototype.slice.call(r));
          }, _int8array: function(r) {
            return l("int8array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _uint16array: function(r) {
            return l("uint16array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _int16array: function(r) {
            return l("int16array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _uint32array: function(r) {
            return l("uint32array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _int32array: function(r) {
            return l("int32array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _float32array: function(r) {
            return l("float32array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _float64array: function(r) {
            return l("float64array:"), this.dispatch(Array.prototype.slice.call(r));
          }, _arraybuffer: function(r) {
            return l("arraybuffer:"), this.dispatch(new Uint8Array(r));
          }, _url: function(r) {
            return l("url:" + r.toString());
          }, _map: function(r) {
            return l("map:"), r = Array.from(r), this._array(r, m.unorderedSets !== !1);
          }, _set: function(r) {
            return l("set:"), r = Array.from(r), this._array(r, m.unorderedSets !== !1);
          }, _file: function(r) {
            return l("file:"), this.dispatch([r.name, r.size, r.type, r.lastModfied]);
          }, _blob: function() {
            if (m.ignoreUnknown)
              return l("[blob]");
            throw Error(`Hashing Blob objects is currently not supported
(see https://github.com/puleos/object-hash/issues/26)
Use "options.replacer" or "options.ignoreUnknown"
`);
          }, _domwindow: function() {
            return l("domwindow");
          }, _bigint: function(r) {
            return l("bigint:" + r.toString());
          }, _process: function() {
            return l("process");
          }, _timer: function() {
            return l("timer");
          }, _pipe: function() {
            return l("pipe");
          }, _tcp: function() {
            return l("tcp");
          }, _udp: function() {
            return l("udp");
          }, _tty: function() {
            return l("tty");
          }, _statwatcher: function() {
            return l("statwatcher");
          }, _securecontext: function() {
            return l("securecontext");
          }, _connection: function() {
            return l("connection");
          }, _zlib: function() {
            return l("zlib");
          }, _context: function() {
            return l("context");
          }, _nodescript: function() {
            return l("nodescript");
          }, _httpparser: function() {
            return l("httpparser");
          }, _dataview: function() {
            return l("dataview");
          }, _signal: function() {
            return l("signal");
          }, _fsevent: function() {
            return l("fsevent");
          }, _tlswrap: function() {
            return l("tlswrap");
          } };
        }
        function j() {
          return { buf: "", write: function(m) {
            this.buf += m;
          }, end: function(m) {
            this.buf += m;
          }, read: function() {
            return this.buf;
          } };
        }
        o.writeToStream = function(m, v, a) {
          return a === void 0 && (a = v, v = {}), P(v = R(m, v), a).dispatch(m);
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/fake_9a5aa49d.js", "/");
    }, { buffer: 3, crypto: 5, lYpoI2: 11 }], 2: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        (function(I) {
          var L = typeof Uint8Array < "u" ? Uint8Array : Array, d = "+".charCodeAt(0), S = "/".charCodeAt(0), R = "0".charCodeAt(0), E = "a".charCodeAt(0), P = "A".charCodeAt(0), j = "-".charCodeAt(0), m = "_".charCodeAt(0);
          function v(a) {
            return a = a.charCodeAt(0), a === d || a === j ? 62 : a === S || a === m ? 63 : a < R ? -1 : a < R + 10 ? a - R + 26 + 26 : a < P + 26 ? a - P : a < E + 26 ? a - E + 26 : void 0;
          }
          I.toByteArray = function(a) {
            var l, r;
            if (0 < a.length % 4)
              throw new Error("Invalid string. Length must be a multiple of 4");
            var w = a.length, w = a.charAt(w - 2) === "=" ? 2 : a.charAt(w - 1) === "=" ? 1 : 0, _ = new L(3 * a.length / 4 - w), N = 0 < w ? a.length - 4 : a.length, T = 0;
            function z(x) {
              _[T++] = x;
            }
            for (l = 0; l < N; l += 4, 0)
              z((16711680 & (r = v(a.charAt(l)) << 18 | v(a.charAt(l + 1)) << 12 | v(a.charAt(l + 2)) << 6 | v(a.charAt(l + 3)))) >> 16), z((65280 & r) >> 8), z(255 & r);
            return w == 2 ? z(255 & (r = v(a.charAt(l)) << 2 | v(a.charAt(l + 1)) >> 4)) : w == 1 && (z((r = v(a.charAt(l)) << 10 | v(a.charAt(l + 1)) << 4 | v(a.charAt(l + 2)) >> 2) >> 8 & 255), z(255 & r)), _;
          }, I.fromByteArray = function(a) {
            var l, r, w, _, N = a.length % 3, T = "";
            function z(x) {
              return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(x);
            }
            for (l = 0, w = a.length - N; l < w; l += 3)
              r = (a[l] << 16) + (a[l + 1] << 8) + a[l + 2], T += z((_ = r) >> 18 & 63) + z(_ >> 12 & 63) + z(_ >> 6 & 63) + z(63 & _);
            switch (N) {
              case 1:
                T = (T += z((r = a[a.length - 1]) >> 2)) + z(r << 4 & 63) + "==";
                break;
              case 2:
                T = (T = (T += z((r = (a[a.length - 2] << 8) + a[a.length - 1]) >> 10)) + z(r >> 4 & 63)) + z(r << 2 & 63) + "=";
            }
            return T;
          };
        })(o === void 0 ? this.base64js = {} : o);
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/base64-js/lib/b64.js", "/node_modules/gulp-browserify/node_modules/base64-js/lib");
    }, { buffer: 3, lYpoI2: 11 }], 3: [function(n, i, o) {
      (function(c, f, d, g, y, b, O, U, B) {
        var I = n("base64-js"), L = n("ieee754");
        function d(s, u, p) {
          if (!(this instanceof d))
            return new d(s, u, p);
          var A, M, D, F, Y = typeof s;
          if (u === "base64" && Y == "string")
            for (s = (F = s).trim ? F.trim() : F.replace(/^\s+|\s+$/g, ""); s.length % 4 != 0; )
              s += "=";
          if (Y == "number")
            A = Q(s);
          else if (Y == "string")
            A = d.byteLength(s, u);
          else {
            if (Y != "object")
              throw new Error("First argument needs to be a number, array or string.");
            A = Q(s.length);
          }
          if (d._useTypedArrays ? M = d._augment(new Uint8Array(A)) : ((M = this).length = A, M._isBuffer = !0), d._useTypedArrays && typeof s.byteLength == "number")
            M._set(s);
          else if (W(F = s) || d.isBuffer(F) || F && typeof F == "object" && typeof F.length == "number")
            for (D = 0; D < A; D++)
              d.isBuffer(s) ? M[D] = s.readUInt8(D) : M[D] = s[D];
          else if (Y == "string")
            M.write(s, 0, u);
          else if (Y == "number" && !d._useTypedArrays && !p)
            for (D = 0; D < A; D++)
              M[D] = 0;
          return M;
        }
        function S(s, u, p, A) {
          return d._charsWritten = Lt(function(M) {
            for (var D = [], F = 0; F < M.length; F++)
              D.push(255 & M.charCodeAt(F));
            return D;
          }(u), s, p, A);
        }
        function R(s, u, p, A) {
          return d._charsWritten = Lt(function(M) {
            for (var D, F, Y = [], G = 0; G < M.length; G++)
              F = M.charCodeAt(G), D = F >> 8, F = F % 256, Y.push(F), Y.push(D);
            return Y;
          }(u), s, p, A);
        }
        function E(s, u, p) {
          var A = "";
          p = Math.min(s.length, p);
          for (var M = u; M < p; M++)
            A += String.fromCharCode(s[M]);
          return A;
        }
        function P(s, u, p, D) {
          D || (C(typeof p == "boolean", "missing or invalid endian"), C(u != null, "missing offset"), C(u + 1 < s.length, "Trying to read beyond buffer length"));
          var M, D = s.length;
          if (!(D <= u))
            return p ? (M = s[u], u + 1 < D && (M |= s[u + 1] << 8)) : (M = s[u] << 8, u + 1 < D && (M |= s[u + 1])), M;
        }
        function j(s, u, p, D) {
          D || (C(typeof p == "boolean", "missing or invalid endian"), C(u != null, "missing offset"), C(u + 3 < s.length, "Trying to read beyond buffer length"));
          var M, D = s.length;
          if (!(D <= u))
            return p ? (u + 2 < D && (M = s[u + 2] << 16), u + 1 < D && (M |= s[u + 1] << 8), M |= s[u], u + 3 < D && (M += s[u + 3] << 24 >>> 0)) : (u + 1 < D && (M = s[u + 1] << 16), u + 2 < D && (M |= s[u + 2] << 8), u + 3 < D && (M |= s[u + 3]), M += s[u] << 24 >>> 0), M;
        }
        function m(s, u, p, A) {
          if (A || (C(typeof p == "boolean", "missing or invalid endian"), C(u != null, "missing offset"), C(u + 1 < s.length, "Trying to read beyond buffer length")), !(s.length <= u))
            return A = P(s, u, p, !0), 32768 & A ? -1 * (65535 - A + 1) : A;
        }
        function v(s, u, p, A) {
          if (A || (C(typeof p == "boolean", "missing or invalid endian"), C(u != null, "missing offset"), C(u + 3 < s.length, "Trying to read beyond buffer length")), !(s.length <= u))
            return A = j(s, u, p, !0), 2147483648 & A ? -1 * (4294967295 - A + 1) : A;
        }
        function a(s, u, p, A) {
          return A || (C(typeof p == "boolean", "missing or invalid endian"), C(u + 3 < s.length, "Trying to read beyond buffer length")), L.read(s, u, p, 23, 4);
        }
        function l(s, u, p, A) {
          return A || (C(typeof p == "boolean", "missing or invalid endian"), C(u + 7 < s.length, "Trying to read beyond buffer length")), L.read(s, u, p, 52, 8);
        }
        function r(s, u, p, A, M) {
          if (M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 1 < s.length, "trying to write beyond buffer length"), Yt(u, 65535)), M = s.length, !(M <= p))
            for (var D = 0, F = Math.min(M - p, 2); D < F; D++)
              s[p + D] = (u & 255 << 8 * (A ? D : 1 - D)) >>> 8 * (A ? D : 1 - D);
        }
        function w(s, u, p, A, M) {
          if (M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 3 < s.length, "trying to write beyond buffer length"), Yt(u, 4294967295)), M = s.length, !(M <= p))
            for (var D = 0, F = Math.min(M - p, 4); D < F; D++)
              s[p + D] = u >>> 8 * (A ? D : 3 - D) & 255;
        }
        function _(s, u, p, A, M) {
          M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 1 < s.length, "Trying to write beyond buffer length"), qt(u, 32767, -32768)), s.length <= p || r(s, 0 <= u ? u : 65535 + u + 1, p, A, M);
        }
        function N(s, u, p, A, M) {
          M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 3 < s.length, "Trying to write beyond buffer length"), qt(u, 2147483647, -2147483648)), s.length <= p || w(s, 0 <= u ? u : 4294967295 + u + 1, p, A, M);
        }
        function T(s, u, p, A, M) {
          M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 3 < s.length, "Trying to write beyond buffer length"), ge(u, 34028234663852886e22, -34028234663852886e22)), s.length <= p || L.write(s, u, p, A, 23, 4);
        }
        function z(s, u, p, A, M) {
          M || (C(u != null, "missing value"), C(typeof A == "boolean", "missing or invalid endian"), C(p != null, "missing offset"), C(p + 7 < s.length, "Trying to write beyond buffer length"), ge(u, 17976931348623157e292, -17976931348623157e292)), s.length <= p || L.write(s, u, p, A, 52, 8);
        }
        o.Buffer = d, o.SlowBuffer = d, o.INSPECT_MAX_BYTES = 50, d.poolSize = 8192, d._useTypedArrays = function() {
          try {
            var s = new ArrayBuffer(0), u = new Uint8Array(s);
            return u.foo = function() {
              return 42;
            }, u.foo() === 42 && typeof u.subarray == "function";
          } catch {
            return !1;
          }
        }(), d.isEncoding = function(s) {
          switch (String(s).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "raw":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return !0;
            default:
              return !1;
          }
        }, d.isBuffer = function(s) {
          return !(s == null || !s._isBuffer);
        }, d.byteLength = function(s, u) {
          var p;
          switch (s += "", u || "utf8") {
            case "hex":
              p = s.length / 2;
              break;
            case "utf8":
            case "utf-8":
              p = ht(s).length;
              break;
            case "ascii":
            case "binary":
            case "raw":
              p = s.length;
              break;
            case "base64":
              p = de(s).length;
              break;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              p = 2 * s.length;
              break;
            default:
              throw new Error("Unknown encoding");
          }
          return p;
        }, d.concat = function(s, u) {
          if (C(W(s), `Usage: Buffer.concat(list, [totalLength])
list should be an Array.`), s.length === 0)
            return new d(0);
          if (s.length === 1)
            return s[0];
          if (typeof u != "number")
            for (M = u = 0; M < s.length; M++)
              u += s[M].length;
          for (var p = new d(u), A = 0, M = 0; M < s.length; M++) {
            var D = s[M];
            D.copy(p, A), A += D.length;
          }
          return p;
        }, d.prototype.write = function(s, u, p, A) {
          isFinite(u) ? isFinite(p) || (A = p, p = void 0) : (G = A, A = u, u = p, p = G), u = Number(u) || 0;
          var M, D, F, Y, G = this.length - u;
          switch ((!p || G < (p = Number(p))) && (p = G), A = String(A || "utf8").toLowerCase()) {
            case "hex":
              M = function(at, nt, it, X) {
                it = Number(it) || 0;
                var H = at.length - it;
                (!X || H < (X = Number(X))) && (X = H), C((H = nt.length) % 2 == 0, "Invalid hex string"), H / 2 < X && (X = H / 2);
                for (var vt = 0; vt < X; vt++) {
                  var ye = parseInt(nt.substr(2 * vt, 2), 16);
                  C(!isNaN(ye), "Invalid hex string"), at[it + vt] = ye;
                }
                return d._charsWritten = 2 * vt, vt;
              }(this, s, u, p);
              break;
            case "utf8":
            case "utf-8":
              D = this, F = u, Y = p, M = d._charsWritten = Lt(ht(s), D, F, Y);
              break;
            case "ascii":
            case "binary":
              M = S(this, s, u, p);
              break;
            case "base64":
              D = this, F = u, Y = p, M = d._charsWritten = Lt(de(s), D, F, Y);
              break;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              M = R(this, s, u, p);
              break;
            default:
              throw new Error("Unknown encoding");
          }
          return M;
        }, d.prototype.toString = function(s, u, p) {
          var A, M, D, F, Y = this;
          if (s = String(s || "utf8").toLowerCase(), u = Number(u) || 0, (p = p !== void 0 ? Number(p) : Y.length) === u)
            return "";
          switch (s) {
            case "hex":
              A = function(G, at, nt) {
                var it = G.length;
                (!at || at < 0) && (at = 0), (!nt || nt < 0 || it < nt) && (nt = it);
                for (var X = "", H = at; H < nt; H++)
                  X += V(G[H]);
                return X;
              }(Y, u, p);
              break;
            case "utf8":
            case "utf-8":
              A = function(G, at, nt) {
                var it = "", X = "";
                nt = Math.min(G.length, nt);
                for (var H = at; H < nt; H++)
                  G[H] <= 127 ? (it += me(X) + String.fromCharCode(G[H]), X = "") : X += "%" + G[H].toString(16);
                return it + me(X);
              }(Y, u, p);
              break;
            case "ascii":
            case "binary":
              A = E(Y, u, p);
              break;
            case "base64":
              M = Y, F = p, A = (D = u) === 0 && F === M.length ? I.fromByteArray(M) : I.fromByteArray(M.slice(D, F));
              break;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              A = function(G, at, nt) {
                for (var it = G.slice(at, nt), X = "", H = 0; H < it.length; H += 2)
                  X += String.fromCharCode(it[H] + 256 * it[H + 1]);
                return X;
              }(Y, u, p);
              break;
            default:
              throw new Error("Unknown encoding");
          }
          return A;
        }, d.prototype.toJSON = function() {
          return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
        }, d.prototype.copy = function(s, u, p, A) {
          if (u = u || 0, (A = A || A === 0 ? A : this.length) !== (p = p || 0) && s.length !== 0 && this.length !== 0) {
            C(p <= A, "sourceEnd < sourceStart"), C(0 <= u && u < s.length, "targetStart out of bounds"), C(0 <= p && p < this.length, "sourceStart out of bounds"), C(0 <= A && A <= this.length, "sourceEnd out of bounds"), A > this.length && (A = this.length);
            var M = (A = s.length - u < A - p ? s.length - u + p : A) - p;
            if (M < 100 || !d._useTypedArrays)
              for (var D = 0; D < M; D++)
                s[D + u] = this[D + p];
            else
              s._set(this.subarray(p, p + M), u);
          }
        }, d.prototype.slice = function(s, u) {
          var p = this.length;
          if (s = J(s, p, 0), u = J(u, p, p), d._useTypedArrays)
            return d._augment(this.subarray(s, u));
          for (var A = u - s, M = new d(A, void 0, !0), D = 0; D < A; D++)
            M[D] = this[D + s];
          return M;
        }, d.prototype.get = function(s) {
          return console.log(".get() is deprecated. Access using array indexes instead."), this.readUInt8(s);
        }, d.prototype.set = function(s, u) {
          return console.log(".set() is deprecated. Access using array indexes instead."), this.writeUInt8(s, u);
        }, d.prototype.readUInt8 = function(s, u) {
          if (u || (C(s != null, "missing offset"), C(s < this.length, "Trying to read beyond buffer length")), !(s >= this.length))
            return this[s];
        }, d.prototype.readUInt16LE = function(s, u) {
          return P(this, s, !0, u);
        }, d.prototype.readUInt16BE = function(s, u) {
          return P(this, s, !1, u);
        }, d.prototype.readUInt32LE = function(s, u) {
          return j(this, s, !0, u);
        }, d.prototype.readUInt32BE = function(s, u) {
          return j(this, s, !1, u);
        }, d.prototype.readInt8 = function(s, u) {
          if (u || (C(s != null, "missing offset"), C(s < this.length, "Trying to read beyond buffer length")), !(s >= this.length))
            return 128 & this[s] ? -1 * (255 - this[s] + 1) : this[s];
        }, d.prototype.readInt16LE = function(s, u) {
          return m(this, s, !0, u);
        }, d.prototype.readInt16BE = function(s, u) {
          return m(this, s, !1, u);
        }, d.prototype.readInt32LE = function(s, u) {
          return v(this, s, !0, u);
        }, d.prototype.readInt32BE = function(s, u) {
          return v(this, s, !1, u);
        }, d.prototype.readFloatLE = function(s, u) {
          return a(this, s, !0, u);
        }, d.prototype.readFloatBE = function(s, u) {
          return a(this, s, !1, u);
        }, d.prototype.readDoubleLE = function(s, u) {
          return l(this, s, !0, u);
        }, d.prototype.readDoubleBE = function(s, u) {
          return l(this, s, !1, u);
        }, d.prototype.writeUInt8 = function(s, u, p) {
          p || (C(s != null, "missing value"), C(u != null, "missing offset"), C(u < this.length, "trying to write beyond buffer length"), Yt(s, 255)), u >= this.length || (this[u] = s);
        }, d.prototype.writeUInt16LE = function(s, u, p) {
          r(this, s, u, !0, p);
        }, d.prototype.writeUInt16BE = function(s, u, p) {
          r(this, s, u, !1, p);
        }, d.prototype.writeUInt32LE = function(s, u, p) {
          w(this, s, u, !0, p);
        }, d.prototype.writeUInt32BE = function(s, u, p) {
          w(this, s, u, !1, p);
        }, d.prototype.writeInt8 = function(s, u, p) {
          p || (C(s != null, "missing value"), C(u != null, "missing offset"), C(u < this.length, "Trying to write beyond buffer length"), qt(s, 127, -128)), u >= this.length || (0 <= s ? this.writeUInt8(s, u, p) : this.writeUInt8(255 + s + 1, u, p));
        }, d.prototype.writeInt16LE = function(s, u, p) {
          _(this, s, u, !0, p);
        }, d.prototype.writeInt16BE = function(s, u, p) {
          _(this, s, u, !1, p);
        }, d.prototype.writeInt32LE = function(s, u, p) {
          N(this, s, u, !0, p);
        }, d.prototype.writeInt32BE = function(s, u, p) {
          N(this, s, u, !1, p);
        }, d.prototype.writeFloatLE = function(s, u, p) {
          T(this, s, u, !0, p);
        }, d.prototype.writeFloatBE = function(s, u, p) {
          T(this, s, u, !1, p);
        }, d.prototype.writeDoubleLE = function(s, u, p) {
          z(this, s, u, !0, p);
        }, d.prototype.writeDoubleBE = function(s, u, p) {
          z(this, s, u, !1, p);
        }, d.prototype.fill = function(s, u, p) {
          if (u = u || 0, p = p || this.length, C(typeof (s = typeof (s = s || 0) == "string" ? s.charCodeAt(0) : s) == "number" && !isNaN(s), "value is not a number"), C(u <= p, "end < start"), p !== u && this.length !== 0) {
            C(0 <= u && u < this.length, "start out of bounds"), C(0 <= p && p <= this.length, "end out of bounds");
            for (var A = u; A < p; A++)
              this[A] = s;
          }
        }, d.prototype.inspect = function() {
          for (var s = [], u = this.length, p = 0; p < u; p++)
            if (s[p] = V(this[p]), p === o.INSPECT_MAX_BYTES) {
              s[p + 1] = "...";
              break;
            }
          return "<Buffer " + s.join(" ") + ">";
        }, d.prototype.toArrayBuffer = function() {
          if (typeof Uint8Array > "u")
            throw new Error("Buffer.toArrayBuffer not supported in this browser");
          if (d._useTypedArrays)
            return new d(this).buffer;
          for (var s = new Uint8Array(this.length), u = 0, p = s.length; u < p; u += 1)
            s[u] = this[u];
          return s.buffer;
        };
        var x = d.prototype;
        function J(s, u, p) {
          return typeof s != "number" ? p : u <= (s = ~~s) ? u : 0 <= s || 0 <= (s += u) ? s : 0;
        }
        function Q(s) {
          return (s = ~~Math.ceil(+s)) < 0 ? 0 : s;
        }
        function W(s) {
          return (Array.isArray || function(u) {
            return Object.prototype.toString.call(u) === "[object Array]";
          })(s);
        }
        function V(s) {
          return s < 16 ? "0" + s.toString(16) : s.toString(16);
        }
        function ht(s) {
          for (var u = [], p = 0; p < s.length; p++) {
            var A = s.charCodeAt(p);
            if (A <= 127)
              u.push(s.charCodeAt(p));
            else
              for (var M = p, D = (55296 <= A && A <= 57343 && p++, encodeURIComponent(s.slice(M, p + 1)).substr(1).split("%")), F = 0; F < D.length; F++)
                u.push(parseInt(D[F], 16));
          }
          return u;
        }
        function de(s) {
          return I.toByteArray(s);
        }
        function Lt(s, u, p, A) {
          for (var M = 0; M < A && !(M + p >= u.length || M >= s.length); M++)
            u[M + p] = s[M];
          return M;
        }
        function me(s) {
          try {
            return decodeURIComponent(s);
          } catch {
            return String.fromCharCode(65533);
          }
        }
        function Yt(s, u) {
          C(typeof s == "number", "cannot write a non-number as a number"), C(0 <= s, "specified a negative value for writing an unsigned value"), C(s <= u, "value is larger than maximum value for type"), C(Math.floor(s) === s, "value has a fractional component");
        }
        function qt(s, u, p) {
          C(typeof s == "number", "cannot write a non-number as a number"), C(s <= u, "value larger than maximum allowed value"), C(p <= s, "value smaller than minimum allowed value"), C(Math.floor(s) === s, "value has a fractional component");
        }
        function ge(s, u, p) {
          C(typeof s == "number", "cannot write a non-number as a number"), C(s <= u, "value larger than maximum allowed value"), C(p <= s, "value smaller than minimum allowed value");
        }
        function C(s, u) {
          if (!s)
            throw new Error(u || "Failed assertion");
        }
        d._augment = function(s) {
          return s._isBuffer = !0, s._get = s.get, s._set = s.set, s.get = x.get, s.set = x.set, s.write = x.write, s.toString = x.toString, s.toLocaleString = x.toString, s.toJSON = x.toJSON, s.copy = x.copy, s.slice = x.slice, s.readUInt8 = x.readUInt8, s.readUInt16LE = x.readUInt16LE, s.readUInt16BE = x.readUInt16BE, s.readUInt32LE = x.readUInt32LE, s.readUInt32BE = x.readUInt32BE, s.readInt8 = x.readInt8, s.readInt16LE = x.readInt16LE, s.readInt16BE = x.readInt16BE, s.readInt32LE = x.readInt32LE, s.readInt32BE = x.readInt32BE, s.readFloatLE = x.readFloatLE, s.readFloatBE = x.readFloatBE, s.readDoubleLE = x.readDoubleLE, s.readDoubleBE = x.readDoubleBE, s.writeUInt8 = x.writeUInt8, s.writeUInt16LE = x.writeUInt16LE, s.writeUInt16BE = x.writeUInt16BE, s.writeUInt32LE = x.writeUInt32LE, s.writeUInt32BE = x.writeUInt32BE, s.writeInt8 = x.writeInt8, s.writeInt16LE = x.writeInt16LE, s.writeInt16BE = x.writeInt16BE, s.writeInt32LE = x.writeInt32LE, s.writeInt32BE = x.writeInt32BE, s.writeFloatLE = x.writeFloatLE, s.writeFloatBE = x.writeFloatBE, s.writeDoubleLE = x.writeDoubleLE, s.writeDoubleBE = x.writeDoubleBE, s.fill = x.fill, s.inspect = x.inspect, s.toArrayBuffer = x.toArrayBuffer, s;
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/buffer/index.js", "/node_modules/gulp-browserify/node_modules/buffer");
    }, { "base64-js": 2, buffer: 3, ieee754: 10, lYpoI2: 11 }], 4: [function(n, i, o) {
      (function(c, f, I, g, y, b, O, U, B) {
        var I = n("buffer").Buffer, L = 4, d = new I(L);
        d.fill(0), i.exports = { hash: function(S, R, E, P) {
          for (var j = R(function(r, w) {
            r.length % L != 0 && (_ = r.length + (L - r.length % L), r = I.concat([r, d], _));
            for (var _, N = [], T = w ? r.readInt32BE : r.readInt32LE, z = 0; z < r.length; z += L)
              N.push(T.call(r, z));
            return N;
          }(S = I.isBuffer(S) ? S : new I(S), P), 8 * S.length), R = P, m = new I(E), v = R ? m.writeInt32BE : m.writeInt32LE, a = 0; a < j.length; a++)
            v.call(m, j[a], 4 * a, !0);
          return m;
        } };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/helpers.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { buffer: 3, lYpoI2: 11 }], 5: [function(n, i, o) {
      (function(c, f, I, g, y, b, O, U, B) {
        var I = n("buffer").Buffer, L = n("./sha"), d = n("./sha256"), S = n("./rng"), R = { sha1: L, sha256: d, md5: n("./md5") }, E = 64, P = new I(E);
        function j(r, w) {
          var _ = R[r = r || "sha1"], N = [];
          return _ || m("algorithm:", r, "is not yet supported"), { update: function(T) {
            return I.isBuffer(T) || (T = new I(T)), N.push(T), T.length, this;
          }, digest: function(T) {
            var z = I.concat(N), z = w ? function(x, J, Q) {
              I.isBuffer(J) || (J = new I(J)), I.isBuffer(Q) || (Q = new I(Q)), J.length > E ? J = x(J) : J.length < E && (J = I.concat([J, P], E));
              for (var W = new I(E), V = new I(E), ht = 0; ht < E; ht++)
                W[ht] = 54 ^ J[ht], V[ht] = 92 ^ J[ht];
              return Q = x(I.concat([W, Q])), x(I.concat([V, Q]));
            }(_, w, z) : _(z);
            return N = null, T ? z.toString(T) : z;
          } };
        }
        function m() {
          var r = [].slice.call(arguments).join(" ");
          throw new Error([r, "we accept pull requests", "http://github.com/dominictarr/crypto-browserify"].join(`
`));
        }
        P.fill(0), o.createHash = function(r) {
          return j(r);
        }, o.createHmac = j, o.randomBytes = function(r, w) {
          if (!w || !w.call)
            return new I(S(r));
          try {
            w.call(this, void 0, new I(S(r)));
          } catch (_) {
            w(_);
          }
        };
        var v, a = ["createCredentials", "createCipher", "createCipheriv", "createDecipher", "createDecipheriv", "createSign", "createVerify", "createDiffieHellman", "pbkdf2"], l = function(r) {
          o[r] = function() {
            m("sorry,", r, "is not implemented yet");
          };
        };
        for (v in a)
          l(a[v]);
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/index.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { "./md5": 6, "./rng": 7, "./sha": 8, "./sha256": 9, buffer: 3, lYpoI2: 11 }], 6: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        var I = n("./helpers");
        function L(m, v) {
          m[v >> 5] |= 128 << v % 32, m[14 + (v + 64 >>> 9 << 4)] = v;
          for (var a = 1732584193, l = -271733879, r = -1732584194, w = 271733878, _ = 0; _ < m.length; _ += 16) {
            var N = a, T = l, z = r, x = w, a = S(a, l, r, w, m[_ + 0], 7, -680876936), w = S(w, a, l, r, m[_ + 1], 12, -389564586), r = S(r, w, a, l, m[_ + 2], 17, 606105819), l = S(l, r, w, a, m[_ + 3], 22, -1044525330);
            a = S(a, l, r, w, m[_ + 4], 7, -176418897), w = S(w, a, l, r, m[_ + 5], 12, 1200080426), r = S(r, w, a, l, m[_ + 6], 17, -1473231341), l = S(l, r, w, a, m[_ + 7], 22, -45705983), a = S(a, l, r, w, m[_ + 8], 7, 1770035416), w = S(w, a, l, r, m[_ + 9], 12, -1958414417), r = S(r, w, a, l, m[_ + 10], 17, -42063), l = S(l, r, w, a, m[_ + 11], 22, -1990404162), a = S(a, l, r, w, m[_ + 12], 7, 1804603682), w = S(w, a, l, r, m[_ + 13], 12, -40341101), r = S(r, w, a, l, m[_ + 14], 17, -1502002290), a = R(a, l = S(l, r, w, a, m[_ + 15], 22, 1236535329), r, w, m[_ + 1], 5, -165796510), w = R(w, a, l, r, m[_ + 6], 9, -1069501632), r = R(r, w, a, l, m[_ + 11], 14, 643717713), l = R(l, r, w, a, m[_ + 0], 20, -373897302), a = R(a, l, r, w, m[_ + 5], 5, -701558691), w = R(w, a, l, r, m[_ + 10], 9, 38016083), r = R(r, w, a, l, m[_ + 15], 14, -660478335), l = R(l, r, w, a, m[_ + 4], 20, -405537848), a = R(a, l, r, w, m[_ + 9], 5, 568446438), w = R(w, a, l, r, m[_ + 14], 9, -1019803690), r = R(r, w, a, l, m[_ + 3], 14, -187363961), l = R(l, r, w, a, m[_ + 8], 20, 1163531501), a = R(a, l, r, w, m[_ + 13], 5, -1444681467), w = R(w, a, l, r, m[_ + 2], 9, -51403784), r = R(r, w, a, l, m[_ + 7], 14, 1735328473), a = E(a, l = R(l, r, w, a, m[_ + 12], 20, -1926607734), r, w, m[_ + 5], 4, -378558), w = E(w, a, l, r, m[_ + 8], 11, -2022574463), r = E(r, w, a, l, m[_ + 11], 16, 1839030562), l = E(l, r, w, a, m[_ + 14], 23, -35309556), a = E(a, l, r, w, m[_ + 1], 4, -1530992060), w = E(w, a, l, r, m[_ + 4], 11, 1272893353), r = E(r, w, a, l, m[_ + 7], 16, -155497632), l = E(l, r, w, a, m[_ + 10], 23, -1094730640), a = E(a, l, r, w, m[_ + 13], 4, 681279174), w = E(w, a, l, r, m[_ + 0], 11, -358537222), r = E(r, w, a, l, m[_ + 3], 16, -722521979), l = E(l, r, w, a, m[_ + 6], 23, 76029189), a = E(a, l, r, w, m[_ + 9], 4, -640364487), w = E(w, a, l, r, m[_ + 12], 11, -421815835), r = E(r, w, a, l, m[_ + 15], 16, 530742520), a = P(a, l = E(l, r, w, a, m[_ + 2], 23, -995338651), r, w, m[_ + 0], 6, -198630844), w = P(w, a, l, r, m[_ + 7], 10, 1126891415), r = P(r, w, a, l, m[_ + 14], 15, -1416354905), l = P(l, r, w, a, m[_ + 5], 21, -57434055), a = P(a, l, r, w, m[_ + 12], 6, 1700485571), w = P(w, a, l, r, m[_ + 3], 10, -1894986606), r = P(r, w, a, l, m[_ + 10], 15, -1051523), l = P(l, r, w, a, m[_ + 1], 21, -2054922799), a = P(a, l, r, w, m[_ + 8], 6, 1873313359), w = P(w, a, l, r, m[_ + 15], 10, -30611744), r = P(r, w, a, l, m[_ + 6], 15, -1560198380), l = P(l, r, w, a, m[_ + 13], 21, 1309151649), a = P(a, l, r, w, m[_ + 4], 6, -145523070), w = P(w, a, l, r, m[_ + 11], 10, -1120210379), r = P(r, w, a, l, m[_ + 2], 15, 718787259), l = P(l, r, w, a, m[_ + 9], 21, -343485551), a = j(a, N), l = j(l, T), r = j(r, z), w = j(w, x);
          }
          return Array(a, l, r, w);
        }
        function d(m, v, a, l, r, w) {
          return j((v = j(j(v, m), j(l, w))) << r | v >>> 32 - r, a);
        }
        function S(m, v, a, l, r, w, _) {
          return d(v & a | ~v & l, m, v, r, w, _);
        }
        function R(m, v, a, l, r, w, _) {
          return d(v & l | a & ~l, m, v, r, w, _);
        }
        function E(m, v, a, l, r, w, _) {
          return d(v ^ a ^ l, m, v, r, w, _);
        }
        function P(m, v, a, l, r, w, _) {
          return d(a ^ (v | ~l), m, v, r, w, _);
        }
        function j(m, v) {
          var a = (65535 & m) + (65535 & v);
          return (m >> 16) + (v >> 16) + (a >> 16) << 16 | 65535 & a;
        }
        i.exports = function(m) {
          return I.hash(m, L, 16);
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/md5.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { "./helpers": 4, buffer: 3, lYpoI2: 11 }], 7: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        i.exports = function(I) {
          for (var L, d = new Array(I), S = 0; S < I; S++)
            !(3 & S) && (L = 4294967296 * Math.random()), d[S] = L >>> ((3 & S) << 3) & 255;
          return d;
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/rng.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { buffer: 3, lYpoI2: 11 }], 8: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        var I = n("./helpers");
        function L(R, E) {
          R[E >> 5] |= 128 << 24 - E % 32, R[15 + (E + 64 >> 9 << 4)] = E;
          for (var P, j, m, v = Array(80), a = 1732584193, l = -271733879, r = -1732584194, w = 271733878, _ = -1009589776, N = 0; N < R.length; N += 16) {
            for (var T = a, z = l, x = r, J = w, Q = _, W = 0; W < 80; W++) {
              v[W] = W < 16 ? R[N + W] : S(v[W - 3] ^ v[W - 8] ^ v[W - 14] ^ v[W - 16], 1);
              var V = d(d(S(a, 5), (V = l, j = r, m = w, (P = W) < 20 ? V & j | ~V & m : !(P < 40) && P < 60 ? V & j | V & m | j & m : V ^ j ^ m)), d(d(_, v[W]), (P = W) < 20 ? 1518500249 : P < 40 ? 1859775393 : P < 60 ? -1894007588 : -899497514)), _ = w, w = r, r = S(l, 30), l = a, a = V;
            }
            a = d(a, T), l = d(l, z), r = d(r, x), w = d(w, J), _ = d(_, Q);
          }
          return Array(a, l, r, w, _);
        }
        function d(R, E) {
          var P = (65535 & R) + (65535 & E);
          return (R >> 16) + (E >> 16) + (P >> 16) << 16 | 65535 & P;
        }
        function S(R, E) {
          return R << E | R >>> 32 - E;
        }
        i.exports = function(R) {
          return I.hash(R, L, 20, !0);
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/sha.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { "./helpers": 4, buffer: 3, lYpoI2: 11 }], 9: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        function I(E, P) {
          var j = (65535 & E) + (65535 & P);
          return (E >> 16) + (P >> 16) + (j >> 16) << 16 | 65535 & j;
        }
        function L(E, P) {
          var j, m = new Array(1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298), v = new Array(1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225), a = new Array(64);
          E[P >> 5] |= 128 << 24 - P % 32, E[15 + (P + 64 >> 9 << 4)] = P;
          for (var l, r, w = 0; w < E.length; w += 16) {
            for (var _ = v[0], N = v[1], T = v[2], z = v[3], x = v[4], J = v[5], Q = v[6], W = v[7], V = 0; V < 64; V++)
              a[V] = V < 16 ? E[V + w] : I(I(I((r = a[V - 2], S(r, 17) ^ S(r, 19) ^ R(r, 10)), a[V - 7]), (r = a[V - 15], S(r, 7) ^ S(r, 18) ^ R(r, 3))), a[V - 16]), j = I(I(I(I(W, S(r = x, 6) ^ S(r, 11) ^ S(r, 25)), x & J ^ ~x & Q), m[V]), a[V]), l = I(S(l = _, 2) ^ S(l, 13) ^ S(l, 22), _ & N ^ _ & T ^ N & T), W = Q, Q = J, J = x, x = I(z, j), z = T, T = N, N = _, _ = I(j, l);
            v[0] = I(_, v[0]), v[1] = I(N, v[1]), v[2] = I(T, v[2]), v[3] = I(z, v[3]), v[4] = I(x, v[4]), v[5] = I(J, v[5]), v[6] = I(Q, v[6]), v[7] = I(W, v[7]);
          }
          return v;
        }
        var d = n("./helpers"), S = function(E, P) {
          return E >>> P | E << 32 - P;
        }, R = function(E, P) {
          return E >>> P;
        };
        i.exports = function(E) {
          return d.hash(E, L, 32, !0);
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/crypto-browserify/sha256.js", "/node_modules/gulp-browserify/node_modules/crypto-browserify");
    }, { "./helpers": 4, buffer: 3, lYpoI2: 11 }], 10: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        o.read = function(I, L, d, S, w) {
          var E, P, j = 8 * w - S - 1, m = (1 << j) - 1, v = m >> 1, a = -7, l = d ? w - 1 : 0, r = d ? -1 : 1, w = I[L + l];
          for (l += r, E = w & (1 << -a) - 1, w >>= -a, a += j; 0 < a; E = 256 * E + I[L + l], l += r, a -= 8)
            ;
          for (P = E & (1 << -a) - 1, E >>= -a, a += S; 0 < a; P = 256 * P + I[L + l], l += r, a -= 8)
            ;
          if (E === 0)
            E = 1 - v;
          else {
            if (E === m)
              return P ? NaN : 1 / 0 * (w ? -1 : 1);
            P += Math.pow(2, S), E -= v;
          }
          return (w ? -1 : 1) * P * Math.pow(2, E - S);
        }, o.write = function(I, L, d, S, R, _) {
          var P, j, m = 8 * _ - R - 1, v = (1 << m) - 1, a = v >> 1, l = R === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, r = S ? 0 : _ - 1, w = S ? 1 : -1, _ = L < 0 || L === 0 && 1 / L < 0 ? 1 : 0;
          for (L = Math.abs(L), isNaN(L) || L === 1 / 0 ? (j = isNaN(L) ? 1 : 0, P = v) : (P = Math.floor(Math.log(L) / Math.LN2), L * (S = Math.pow(2, -P)) < 1 && (P--, S *= 2), 2 <= (L += 1 <= P + a ? l / S : l * Math.pow(2, 1 - a)) * S && (P++, S /= 2), v <= P + a ? (j = 0, P = v) : 1 <= P + a ? (j = (L * S - 1) * Math.pow(2, R), P += a) : (j = L * Math.pow(2, a - 1) * Math.pow(2, R), P = 0)); 8 <= R; I[d + r] = 255 & j, r += w, j /= 256, R -= 8)
            ;
          for (P = P << R | j, m += R; 0 < m; I[d + r] = 255 & P, r += w, P /= 256, m -= 8)
            ;
          I[d + r - w] |= 128 * _;
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/ieee754/index.js", "/node_modules/gulp-browserify/node_modules/ieee754");
    }, { buffer: 3, lYpoI2: 11 }], 11: [function(n, i, o) {
      (function(c, f, h, g, y, b, O, U, B) {
        var I, L, d;
        function S() {
        }
        (c = i.exports = {}).nextTick = (L = typeof window < "u" && window.setImmediate, d = typeof window < "u" && window.postMessage && window.addEventListener, L ? function(R) {
          return window.setImmediate(R);
        } : d ? (I = [], window.addEventListener("message", function(R) {
          var E = R.source;
          E !== window && E !== null || R.data !== "process-tick" || (R.stopPropagation(), 0 < I.length && I.shift()());
        }, !0), function(R) {
          I.push(R), window.postMessage("process-tick", "*");
        }) : function(R) {
          setTimeout(R, 0);
        }), c.title = "browser", c.browser = !0, c.env = {}, c.argv = [], c.on = S, c.addListener = S, c.once = S, c.off = S, c.removeListener = S, c.removeAllListeners = S, c.emit = S, c.binding = function(R) {
          throw new Error("process.binding is not supported");
        }, c.cwd = function() {
          return "/";
        }, c.chdir = function(R) {
          throw new Error("process.chdir is not supported");
        };
      }).call(this, n("lYpoI2"), typeof self < "u" ? self : typeof window < "u" ? window : {}, n("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/node_modules/gulp-browserify/node_modules/process/browser.js", "/node_modules/gulp-browserify/node_modules/process");
    }, { buffer: 3, lYpoI2: 11 }] }, {}, [1])(1);
  });
})(Ne);
var Ie = Ne.exports;
const Ee = ["0.3", "0.4", "0.5", "0.6"], Se = ["0.2", "0.3"], xn = "0.6", Rt = "0.3";
var k;
(function(e) {
  e.Inputs = "inputs", e.Outputs = "outputs", e.State = "state", e.Definition = "definition", e.DefinitionUpdateRequest = "definitionupdaterequest", e.Error = "error", e.UrlHashUpdate = "urlhashupdate", e.Message = "Message";
})(k || (k = {}));
var tt;
(function(e) {
  e.InputsUpdate = "InputsUpdate", e.OutputsUpdate = "OutputsUpdate", e.SetupIframeClientRequest = "SetupIframeClientRequest", e.SetupIframeServerResponseAck = "SetupIframeServerResponseAck", e.PluginRequest = "SetupIframeServerPluginRequestResponseAck", e.HashParamsUpdate = "HashParamsUpdate";
})(tt || (tt = {}));
var pt;
(function(e) {
  e.InputsUpdate = "InputsUpdate", e.MessageAck = "MessageAck", e.SetupIframeServerResponse = "SetupIframeServerResponse";
})(pt || (pt = {}));
var ne;
(function(e) {
  e.State = "metapage/state";
})(ne || (ne = {}));
const ct = "metapage/definition", yt = "metapage/state", ze = Se[Se.length - 1], pn = Ee[Ee.length - 1];
var Et = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Mt = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (var xt = 0; xt < Et.length; xt++)
  Mt[Et.charCodeAt(xt)] = xt;
var Bt = function(e) {
  var t = new Uint8Array(e), n, i = t.length, o = "";
  for (n = 0; n < i; n += 3)
    o += Et[t[n] >> 2], o += Et[(t[n] & 3) << 4 | t[n + 1] >> 4], o += Et[(t[n + 1] & 15) << 2 | t[n + 2] >> 6], o += Et[t[n + 2] & 63];
  return i % 3 === 2 ? o = o.substring(0, o.length - 1) + "=" : i % 3 === 1 && (o = o.substring(0, o.length - 2) + "=="), o;
}, kt = function(e) {
  var t = e.length * 0.75, n = e.length, i, o = 0, c, f, h, g;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  var y = new ArrayBuffer(t), b = new Uint8Array(y);
  for (i = 0; i < n; i += 4)
    c = Mt[e.charCodeAt(i)], f = Mt[e.charCodeAt(i + 1)], h = Mt[e.charCodeAt(i + 2)], g = Mt[e.charCodeAt(i + 3)], b[o++] = c << 2 | f >> 4, b[o++] = (f & 15) << 4 | h >> 2, b[o++] = (h & 3) << 6 | g & 63;
  return y;
};
const Jt = async (e) => {
  for (const t of Object.keys(e)) {
    const n = await dn(e[t]);
    e[t] = n;
  }
  return e;
}, Pt = async (e) => {
  for (const t of Object.keys(e)) {
    const n = await mn(e[t]);
    e[t] = n;
  }
  return e;
}, dn = async (e) => {
  if (e instanceof Int8Array || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array || e instanceof Float64Array) {
    const t = e, n = {
      _s: !0,
      _c: e.constructor.name,
      value: Bt(t.buffer),
      byteLength: t.byteLength,
      byteOffset: t.byteOffset,
      size: t.byteLength
    };
    return Promise.resolve(n);
  } else if (e instanceof File) {
    const t = e, n = await t.arrayBuffer();
    return {
      _s: !0,
      _c: File.name,
      value: Bt(n),
      name: t.name,
      fileType: t.type,
      lastModified: t.lastModified,
      size: n.byteLength
    };
  } else if (e instanceof Blob) {
    const t = e, n = await t.arrayBuffer();
    return {
      _s: !0,
      _c: Blob.name,
      value: Bt(n),
      fileType: t.type,
      size: n.byteLength
    };
  } else if (e instanceof ArrayBuffer) {
    const t = e, n = {
      _s: !0,
      _c: ArrayBuffer.name,
      value: Bt(t),
      size: t.byteLength
    };
    return Promise.resolve(n);
  }
  return Promise.resolve(e);
}, mn = (e) => {
  if (!(e && typeof e == "object" && e._s === !0))
    return e;
  const t = e, n = t._c;
  if (n === Blob.name) {
    const f = e;
    return new Blob([kt(t.value)], {
      type: f.fileType
    });
  } else if (n === File.name) {
    const f = e;
    return new File([kt(t.value)], f.name, {
      type: f.fileType,
      lastModified: f.lastModified
    });
  } else if (n === ArrayBuffer.name)
    return kt(t.value);
  const i = e, o = kt(i.value), c = i._c;
  try {
    return new globalThis[c](o);
  } catch {
  }
  return e;
};
var $e = { exports: {} };
(function(e) {
  var t = Object.prototype.hasOwnProperty, n = "~";
  function i() {
  }
  Object.create && (i.prototype = /* @__PURE__ */ Object.create(null), new i().__proto__ || (n = !1));
  function o(g, y, b) {
    this.fn = g, this.context = y, this.once = b || !1;
  }
  function c(g, y, b, O, U) {
    if (typeof b != "function")
      throw new TypeError("The listener must be a function");
    var B = new o(b, O || g, U), I = n ? n + y : y;
    return g._events[I] ? g._events[I].fn ? g._events[I] = [g._events[I], B] : g._events[I].push(B) : (g._events[I] = B, g._eventsCount++), g;
  }
  function f(g, y) {
    --g._eventsCount === 0 ? g._events = new i() : delete g._events[y];
  }
  function h() {
    this._events = new i(), this._eventsCount = 0;
  }
  h.prototype.eventNames = function() {
    var y = [], b, O;
    if (this._eventsCount === 0)
      return y;
    for (O in b = this._events)
      t.call(b, O) && y.push(n ? O.slice(1) : O);
    return Object.getOwnPropertySymbols ? y.concat(Object.getOwnPropertySymbols(b)) : y;
  }, h.prototype.listeners = function(y) {
    var b = n ? n + y : y, O = this._events[b];
    if (!O)
      return [];
    if (O.fn)
      return [O.fn];
    for (var U = 0, B = O.length, I = new Array(B); U < B; U++)
      I[U] = O[U].fn;
    return I;
  }, h.prototype.listenerCount = function(y) {
    var b = n ? n + y : y, O = this._events[b];
    return O ? O.fn ? 1 : O.length : 0;
  }, h.prototype.emit = function(y, b, O, U, B, I) {
    var L = n ? n + y : y;
    if (!this._events[L])
      return !1;
    var d = this._events[L], S = arguments.length, R, E;
    if (d.fn) {
      switch (d.once && this.removeListener(y, d.fn, void 0, !0), S) {
        case 1:
          return d.fn.call(d.context), !0;
        case 2:
          return d.fn.call(d.context, b), !0;
        case 3:
          return d.fn.call(d.context, b, O), !0;
        case 4:
          return d.fn.call(d.context, b, O, U), !0;
        case 5:
          return d.fn.call(d.context, b, O, U, B), !0;
        case 6:
          return d.fn.call(d.context, b, O, U, B, I), !0;
      }
      for (E = 1, R = new Array(S - 1); E < S; E++)
        R[E - 1] = arguments[E];
      d.fn.apply(d.context, R);
    } else {
      var P = d.length, j;
      for (E = 0; E < P; E++)
        switch (d[E].once && this.removeListener(y, d[E].fn, void 0, !0), S) {
          case 1:
            d[E].fn.call(d[E].context);
            break;
          case 2:
            d[E].fn.call(d[E].context, b);
            break;
          case 3:
            d[E].fn.call(d[E].context, b, O);
            break;
          case 4:
            d[E].fn.call(d[E].context, b, O, U);
            break;
          default:
            if (!R)
              for (j = 1, R = new Array(S - 1); j < S; j++)
                R[j - 1] = arguments[j];
            d[E].fn.apply(d[E].context, R);
        }
    }
    return !0;
  }, h.prototype.on = function(y, b, O) {
    return c(this, y, b, O, !1);
  }, h.prototype.once = function(y, b, O) {
    return c(this, y, b, O, !0);
  }, h.prototype.removeListener = function(y, b, O, U) {
    var B = n ? n + y : y;
    if (!this._events[B])
      return this;
    if (!b)
      return f(this, B), this;
    var I = this._events[B];
    if (I.fn)
      I.fn === b && (!U || I.once) && (!O || I.context === O) && f(this, B);
    else {
      for (var L = 0, d = [], S = I.length; L < S; L++)
        (I[L].fn !== b || U && !I[L].once || O && I[L].context !== O) && d.push(I[L]);
      d.length ? this._events[B] = d.length === 1 ? d[0] : d : f(this, B);
    }
    return this;
  }, h.prototype.removeAllListeners = function(y) {
    var b;
    return y ? (b = n ? n + y : y, this._events[b] && f(this, b)) : (this._events = new i(), this._eventsCount = 0), this;
  }, h.prototype.off = h.prototype.removeListener, h.prototype.addListener = h.prototype.on, h.prefixed = n, h.EventEmitter = h, e.exports = h;
})($e);
var le = $e.exports;
function Wt(e, t) {
  const n = Ft(e), i = Ft(t), o = n.pop(), c = i.pop(), f = ie(n, i);
  return f !== 0 ? f : o && c ? ie(o.split("."), c.split(".")) : o || c ? o ? -1 : 1 : 0;
}
const gn = (e) => typeof e == "string" && /^[v\d]/.test(e) && Fe.test(e), St = (e, t, n) => {
  wn(n);
  const i = Wt(e, t);
  return Ve[n].includes(i);
}, yn = (e, t) => {
  const n = t.match(/^([<>=~^]+)/), i = n ? n[1] : "=";
  if (i !== "^" && i !== "~")
    return St(e, t, i);
  const [o, c, f] = Ft(e), [h, g, y] = Ft(t);
  return zt(o, h) !== 0 ? !1 : i === "^" ? ie([c, f], [g, y]) >= 0 : zt(c, g) !== 0 ? !1 : zt(f, y) >= 0;
};
Wt.validate = gn;
Wt.compare = St;
Wt.satisfies = yn;
const Fe = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, Ft = (e) => {
  if (typeof e != "string")
    throw new TypeError("Invalid argument expected string");
  const t = e.match(Fe);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${e}' received)`);
  return t.shift(), t;
}, Oe = (e) => e === "*" || e === "x" || e === "X", Me = (e) => {
  const t = parseInt(e, 10);
  return isNaN(t) ? e : t;
}, bn = (e, t) => typeof e != typeof t ? [String(e), String(t)] : [e, t], zt = (e, t) => {
  if (Oe(e) || Oe(t))
    return 0;
  const [n, i] = bn(Me(e), Me(t));
  return n > i ? 1 : n < i ? -1 : 0;
}, ie = (e, t) => {
  for (let n = 0; n < Math.max(e.length, t.length); n++) {
    const i = zt(e[n] || 0, t[n] || 0);
    if (i !== 0)
      return i;
  }
  return 0;
}, Ve = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1]
}, Ae = Object.keys(Ve), wn = (e) => {
  if (typeof e != "string")
    throw new TypeError(
      `Invalid operator type, expected string but got ${typeof e}`
    );
  if (Ae.indexOf(e) === -1)
    throw new Error(
      `Invalid operator, expected one of ${Ae.join("|")}`
    );
};
var _n = function(e, t) {
  t || (t = {}), typeof t == "function" && (t = { cmp: t });
  var n = typeof t.cycles == "boolean" ? t.cycles : !1, i = t.cmp && function(c) {
    return function(f) {
      return function(h, g) {
        var y = { key: h, value: f[h] }, b = { key: g, value: f[g] };
        return c(y, b);
      };
    };
  }(t.cmp), o = [];
  return function c(f) {
    if (f && f.toJSON && typeof f.toJSON == "function" && (f = f.toJSON()), f !== void 0) {
      if (typeof f == "number")
        return isFinite(f) ? "" + f : "null";
      if (typeof f != "object")
        return JSON.stringify(f);
      var h, g;
      if (Array.isArray(f)) {
        for (g = "[", h = 0; h < f.length; h++)
          h && (g += ","), g += c(f[h]) || "null";
        return g + "]";
      }
      if (f === null)
        return "null";
      if (o.indexOf(f) !== -1) {
        if (n)
          return JSON.stringify("__cycle__");
        throw new TypeError("Converting circular structure to JSON");
      }
      var y = o.push(f) - 1, b = Object.keys(f).sort(i && i(f));
      for (g = "", h = 0; h < b.length; h++) {
        var O = b[h], U = c(f[O]);
        U && (g && (g += ","), g += JSON.stringify(O) + ":" + U);
      }
      return o.splice(y, 1), "{" + g + "}";
    }
  }(e);
};
const Je = /* @__PURE__ */ hn(_n);
var Ct;
(function(e) {
  e.mp_debug = "mp_debug";
})(Ct || (Ct = {}));
const vn = () => {
  try {
    return window !== window.top;
  } catch {
    return !1;
  }
}, We = {
  version: Rt,
  metaframes: {}
};
class In extends le.EventEmitter {
  constructor() {
    super(), this._definition = We, this.getDefinition = this.getDefinition.bind(this);
  }
  error(t) {
    throw "Subclass should implement";
  }
  getDefinition() {
    return this._definition;
  }
}
const Ye = (e) => {
  if (e === null)
    throw "Metapage definition cannot be null";
  if (typeof e == "string")
    try {
      e = JSON.parse(e);
    } catch {
      throw `Cannot parse into JSON:
${e}`;
    }
  if (!e.version)
    throw 'Missing "version" key in metapage definition';
  let t;
  switch (He(e.version)) {
    case "0.2": {
      t = Ye(On(e));
      break;
    }
    case "0.3": {
      t = e;
      break;
    }
    default:
      console.warn(`Metapage definition version=${e.version} but we only know up to version ${Rt}. Assuming the definition is compatible, but it's the future!`), t = e;
      break;
  }
  return t;
}, qe = (e, t) => {
  if (e)
    switch (e.version) {
      case void 0:
      case "0.3":
      case "0.4":
        return qe(En(e));
      case "0.5":
        return Sn(e);
      case "0.6":
        return e;
      default:
        if (t && t.errorIfUnknownVersion)
          throw `Unsupported metaframe version. Please upgrade to a new version: npm i @metapages/metapage@latest
 ${JSON.stringify(e)}
${window.location.href}`;
        return console.error(`Unsupported metaframe version. Not throwing an error because you might not be able to upgrade. Please upgrade to a new version: npm i @metapages/metapage@latest
 ${JSON.stringify(e)}
${window.location.href}`), e;
    }
}, En = (e) => {
  const { version: t, inputs: n, outputs: i, allow: o, metadata: c, ...f } = e, h = c, { title: g, author: y, image: b, descriptionUrl: O, keywords: U, iconUrl: B, ...I } = h, L = {
    name: g,
    author: y,
    description: O,
    image: b,
    tags: U,
    ...I
  };
  return {
    version: "0.5",
    inputs: n,
    outputs: i,
    allow: o,
    metadata: L,
    ...f
  };
}, Sn = (e) => {
  const { metadata: t, ...n } = e, i = {
    ...n,
    version: "0.6"
  };
  if (t) {
    const { edit: o, ...c } = t, f = { ...c };
    if (i.metadata = f, o && !(f && f.operations && f.operations.edit))
      switch (f.operations || (f.operations = {}), o.type) {
        case "metapage":
          const h = o.value, g = {
            type: "metapage",
            metapage: h.definition,
            metaframe: h.key || "edit"
          };
          f.operations.edit = g;
          break;
        case "metaframe":
          const y = o.value, b = {
            type: "url",
            url: y.url,
            params: y.params ? y.params.map((O) => ({
              to: O.to,
              from: O.from,
              toType: O.toType === "path" ? void 0 : O.toType
            })) : void 0
          };
          f.operations.edit = b;
          break;
        default:
          throw `Unsupported edit type: ${o.type} in metadata for metaframe ${JSON.stringify(t)}`;
      }
  }
  return i;
}, On = (e) => (e.version = "0.3", e), Vt = (e, t) => {
  if (!t)
    return !1;
  let n = !1;
  return Object.keys(t).forEach((i) => {
    n = !0, t[i] === void 0 ? delete e[i] : e[i] = t[i];
  }), n;
}, He = (e) => {
  if (e === "latest")
    return Rt;
  if (St(e, "0.2", "<"))
    throw `Unknown version: ${e}`;
  return St(e, "0.2", ">=") && St(e, "0.3", "<") ? "0.2" : St(e, "0.3", ">=") ? "0.3" : (console.log(`Could not match version=${e} to any known version, assuming ${Rt}`), Rt);
}, Bn = (e) => window.location.search ? new URLSearchParams(window.location.search).get(e) : null, kn = () => new URLSearchParams(window.location.search).has(Ct.mp_debug), se = () => {
  const e = new URLSearchParams(window.location.search).get(Ct.mp_debug);
  return e === "true" || e === "1";
}, Mn = (e) => e.filter((n) => new URLSearchParams(window.location.search).has(n)).length > 0, Tn = (e = 8) => ce(e), An = (e = 8) => ce(e), Nn = (e = 8) => ce(e), Re = "abcdefghijklmnopqrstuvwxyz0123456789", ce = (e = 8) => {
  for (var t = "", n = Re.length, i = 0; i < e; i++)
    t += Re.charAt(Math.floor(Math.random() * n));
  return t;
}, he = (e, t, n) => {
  t = t || "000", t && t.trim() == "" && (t = void 0);
  let i;
  if (typeof e == "string" ? i = e : typeof e == "number" ? i = e + "" : i = JSON.stringify(e, null, "  "), t && t.trim() != "") {
    var o = `color: #${t}`;
    n && (o = `${o}; background: #${n}`), i = `%c${i}`, window.console.log(i, o);
  } else
    window.console.log(i);
}, Ke = (e) => Pn(Rn(e)), Rn = (e) => {
  var t = 0;
  for (let n = 0; n < e.length; n++)
    t = e.charCodeAt(n) + ((t << 5) - t);
  return t;
}, Pn = (e) => {
  var t = (e & 16777215).toString(16).toUpperCase();
  return "00000".substring(0, 6 - t.length) + t;
}, Kt = () => document.readyState == "complete" || document.readyState == "interactive", pe = async () => Kt() ? Promise.resolve() : new Promise((e) => {
  if (Kt()) {
    e();
    return;
  }
  let t = !1;
  window.addEventListener("load", () => {
    t || (t = !0, e());
  }), setTimeout(() => {
    !t && Kt() && (t = !0, e());
  }, 200);
}), zn = async (e) => {
  const t = Je(e);
  return await Ge(t);
}, $n = async (e) => {
  const t = Je({
    version: e.version,
    metaframes: e.metaframes,
    plugins: e.plugins
  });
  return await Ge(t);
};
async function Ge(e) {
  const n = new TextEncoder().encode(e), i = await crypto.subtle.digest("SHA-256", n);
  return btoa(String.fromCharCode(...new Uint8Array(i)));
}
class Pe extends le.EventEmitter {
  constructor(t, n, i, o, c, f = !1) {
    if (super(), this.inputs = {}, this.outputs = {}, this._disposables = [], this._rpcListeners = [], this._loaded = !1, this._onLoaded = [], this._sendInputsAfterRegistration = !1, this._plugin = !1, this._cachedEventInputsUpdate = {
      iframeId: void 0,
      inputs: void 0
    }, this._cachedEventOutputsUpdate = {
      iframeId: null,
      inputs: null
    }, !n.startsWith("http")) {
      for (; n.startsWith("/"); )
        n = n.substring(1);
      n = window.location.protocol + "//" + window.location.hostname + (window.location.port && window.location.port != "" ? ":" + window.location.port : "") + "/" + n;
    }
    if (this.url = n, this._metapage = t, this._debug = f, f) {
      var h = new URL(this.url);
      h.searchParams.set(Ct.mp_debug, "true"), this.url = h.href;
    }
    this.id = i, this._parentId = o, this._color = Ke(this.id), this._consoleBackgroundColor = c, this._iframe = document.createElement("iframe"), this._iframe.name = this.id;
    const g = this;
    this.iframe = new Promise((y) => {
      pe().then(async () => {
        var b, O, U, B;
        if (g._iframe) {
          if ((B = (U = (O = (b = this._metapage) == null ? void 0 : b._definition) == null ? void 0 : O.metaframes) == null ? void 0 : U[this.id]) != null && B.allow)
            g._iframe.allow = this._metapage._definition.metaframes[this.id].allow;
          else {
            const I = await g.getDefinition();
            if (!g._iframe)
              return;
            I && I.allow && (g._iframe.allow = I.allow);
          }
          g._iframe.src = this.url, y(g._iframe);
        }
      });
    }), this.ack = this.ack.bind(this), this.dispose = this.dispose.bind(this), this.getDefinition = this.getDefinition.bind(this), this.getDefinitionUrl = this.getDefinitionUrl.bind(this), this.setPlugin = this.setPlugin.bind(this), this.hasPermissionsDefinition = this.hasPermissionsDefinition.bind(this), this.hasPermissionsState = this.hasPermissionsState.bind(this), this.log = this.log.bind(this), this.logInternal = this.logInternal.bind(this), this.onInput = this.onInput.bind(this), this.onInputs = this.onInputs.bind(this), this.onOutput = this.onOutput.bind(this), this.onOutputs = this.onOutputs.bind(this), this.register = this.register.bind(this), this.registered = this.registered.bind(this), this.sendInputs = this.sendInputs.bind(this), this.sendOrBufferPostMessage = this.sendOrBufferPostMessage.bind(this), this.sendRpc = this.sendRpc.bind(this), this.sendRpcInternal = this.sendRpcInternal.bind(this), this.setInput = this.setInput.bind(this), this.setInputs = this.setInputs.bind(this), this.setMetapage = this.setMetapage.bind(this), this.setOutput = this.setOutput.bind(this), this.setOutputs = this.setOutputs.bind(this), this.setPlugin = this.setPlugin.bind(this), this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this), this.isDisposed = this.isDisposed.bind(this);
  }
  addListenerReturnDisposer(t, n) {
    return super.addListener(t, n), () => {
      super.removeListener(t, n);
    };
  }
  setPlugin() {
    if (this._loaded)
      throw "Cannot setPlugin after MetapageIFrameRpcClient already loaded";
    return this._plugin = !0, this;
  }
  setMetapage(t) {
    return this._metapage = t, this;
  }
  hasPermissionsState() {
    return this._definition !== void 0 && this._definition.inputs !== void 0 && this._definition.inputs[yt] !== void 0;
  }
  hasPermissionsDefinition() {
    return this._definition !== void 0 && this._definition.inputs !== void 0 && this._definition.inputs[ct] !== void 0;
  }
  getDefinitionUrl() {
    var t = new URL(this.url);
    return t.pathname = t.pathname + (t.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json"), t.href;
  }
  async getDefinition() {
    if (this._definition)
      return this._definition;
    var t = this.getDefinitionUrl();
    try {
      const n = await window.fetch(t, {
        signal: AbortSignal.timeout(6e3)
      });
      if (n.ok) {
        const i = await n.json(), o = qe(i);
        return this._definition = o, this._definition;
      } else
        this.emit(k.Error, `Failed to fetch: ${t}
Status: ${n.status}
Status text: ${n.statusText}`);
    } catch (n) {
      this.emit(k.Error, `Failed to fetch or convert: ${t}
Error: ${n}`);
    }
  }
  setInput(t, n) {
    console.assert(!!t);
    var i = {};
    i[t] = n, this.setInputs(i);
  }
  setInputs(t) {
    if (this.log({ m: "MetapageIFrameRpcClient", inputs: t }), !Vt(this.inputs, t))
      return this;
    if (this._loaded || (this._sendInputsAfterRegistration = !0), this._iframe.parentNode && this._loaded && this.sendInputs(t), this.emit(k.Inputs, this.inputs), this._metapage.listenerCount(k.Inputs) > 0) {
      var n = {};
      n[this.id] = t, this._metapage.emit(k.Inputs, n);
    }
    return this;
  }
  setOutput(t, n) {
    console.assert(!!t);
    var i = {};
    i[t] = n, this.setOutputs(i);
  }
  setOutputs(t) {
    if (Vt(this.outputs, t) && (this.emit(k.Outputs, t), this._metapage.listenerCount(k.Outputs) > 0)) {
      var n = {};
      n[this.id] = this.outputs, this._metapage.emit(k.Outputs, n);
    }
  }
  onInputs(t) {
    return this.addListenerReturnDisposer(k.Inputs, t);
  }
  onInput(t, n) {
    var i = function(o) {
      o.hasOwnProperty(t) && n(o[t]);
    };
    return this.addListenerReturnDisposer(k.Inputs, i);
  }
  onOutputs(t) {
    return this.addListenerReturnDisposer(k.Outputs, t);
  }
  onOutput(t, n) {
    var i = function(o) {
      o.hasOwnProperty(t) && n(o[t]);
    };
    return this.addListenerReturnDisposer(k.Outputs, i);
  }
  isDisposed() {
    return this.inputs === void 0;
  }
  dispose() {
    for (super.removeAllListeners(); this._disposables && this._disposables.length > 0; ) {
      const t = this._disposables.pop();
      t && t();
    }
    this._rpcListeners = void 0, this.inputs = void 0, this.outputs = void 0, this._iframe && this._iframe.parentNode && this._iframe.parentNode.removeChild(this._iframe), this._iframe = void 0, this._bufferMessages = void 0, this._bufferTimeout && (window.clearInterval(this._bufferTimeout), this._bufferTimeout = void 0), this._metapage = void 0;
  }
  register() {
    var t = {
      iframeId: this.id,
      parentId: this._parentId,
      plugin: this._plugin,
      state: {
        inputs: this.inputs
      },
      version: ze
    };
    this.sendRpcInternal(pt.SetupIframeServerResponse, t);
  }
  registered(t) {
    if (this.log({ m: "MetapageIFrameRpcClient.registered", inputs: this.inputs }), !this._loaded) {
      if (!t)
        throw "Cannot register without a version";
      for (this.version = t, this._loaded = !0; this._onLoaded && this._onLoaded.length > 0; )
        this._onLoaded.pop()();
      this._sendInputsAfterRegistration && this.sendInputs(this.inputs);
    }
  }
  async sendInputs(t) {
    t = await Jt(t), this.sendRpc(pt.InputsUpdate, {
      inputs: t,
      parentId: this._parentId
    });
  }
  sendRpc(t, n) {
    var i, o;
    if ((i = this == null ? void 0 : this._iframe) != null && i.parentNode && this._loaded)
      this.sendRpcInternal(t, n);
    else {
      (o = this == null ? void 0 : this._metapage) == null || o.error("sending rpc later");
      const c = this;
      this == null || this._onLoaded.push(() => {
        c.sendRpcInternal(t, n);
      });
    }
  }
  ack(t) {
    if (this.log("⚒ ⚒ ⚒ calling ack"), this._debug) {
      this.log("⚒ ⚒ ⚒ sending ack from client to frame");
      var n = {
        message: t
      };
      this.sendRpc(pt.MessageAck, n);
    } else
      this.log("⚒ ⚒ ⚒ NOT sending ack from client to frame since not debug mode");
  }
  log(t) {
    this._debug && this.logInternal(t);
  }
  logInternal(t) {
    let n;
    typeof t == "string" ? n = t : typeof t == "string" ? n = t + "" : n = JSON.stringify(t), he(`Metapage[${this._parentId}] Metaframe[${this.id}] ${n}`, this._color, this._consoleBackgroundColor);
  }
  sendRpcInternal(t, n) {
    const i = {
      id: "_",
      iframeId: this.id,
      jsonrpc: "2.0",
      method: t,
      params: n,
      parentId: this._parentId
    };
    this._iframe ? this.sendOrBufferPostMessage(i) : this._metapage ? this._metapage.error(`Cannot send to child iframe messageJSON=${JSON.stringify(i).substring(0, 200)}`) : console.error(`Cannot send to child iframe messageJSON=${JSON.stringify(i).substring(0, 200)}`);
  }
  sendOrBufferPostMessage(t) {
    if (this._iframe && this._iframe.contentWindow)
      this._iframe.contentWindow.postMessage(t, this.url);
    else if (this._bufferMessages)
      this._bufferMessages.push(t);
    else {
      this._bufferMessages = [t];
      const n = this;
      this._bufferTimeout = window.setInterval(function() {
        n._iframe && n._iframe.contentWindow && (n._bufferMessages.forEach((i) => n._iframe.contentWindow.postMessage(i, n.url)), window.clearInterval(n._bufferTimeout), n._bufferTimeout = void 0, n._bufferMessages = void 0);
      }, 0);
    }
  }
}
var je;
(function(e) {
  e.all = "all", e.delta = "delta";
})(je || (je = {}));
const Ce = () => ({
  metaframes: {
    inputs: {},
    outputs: {}
  },
  plugins: {
    inputs: {},
    outputs: {}
  }
}), Fn = (e) => He(e), jn = (e, t) => !t || t === "*" || e === t ? !0 : t.endsWith("*") ? e.startsWith(t.slice(0, -1)) : t.startsWith("*") ? e.endsWith(t.slice(1)) : !1, Cn = "bcbcbc";
class ot extends In {
  static from(t, n) {
    if (t == null)
      throw "Metapage definition cannot be null";
    if (typeof t == "string")
      try {
        t = JSON.parse(t);
      } catch {
        throw "Cannot parse into JSON:\n${metaPageDef}";
      }
    var i = new ot();
    return i.setDefinition(t);
  }
  constructor(t) {
    super(), this._state = Ce(), this._metaframes = {}, this._plugins = {}, this._pluginOrder = [], this.debug = se(), this._internalReceivedMessageCounter = 0, this._cachedInputLookupMap = {}, this._inputMap = {}, this._id = t && t.id ? t.id : An(), this._consoleBackgroundColor = t && t.color ? t.color : Cn, this.addPipe = this.addPipe.bind(this), this.dispose = this.dispose.bind(this), this.addMetaframe = this.addMetaframe.bind(this), this.addPlugin = this.addPlugin.bind(this), this.getInputsFromOutput = this.getInputsFromOutput.bind(this), this.getMetaframe = this.getMetaframe.bind(this), this.getMetaframeIds = this.getMetaframeIds.bind(this), this.getMetaframeOrPlugin = this.getMetaframeOrPlugin.bind(this), this.getMetaframes = this.getMetaframes.bind(this), this.getPlugin = this.getPlugin.bind(this), this.getPluginIds = this.getPluginIds.bind(this), this.getState = this.getState.bind(this), this.getStateMetaframes = this.getStateMetaframes.bind(this), this.isValidJSONRpcMessage = this.isValidJSONRpcMessage.bind(this), this.log = this.log.bind(this), this.logInternal = this.logInternal.bind(this), this.metaframeIds = this.metaframeIds.bind(this), this.metaframes = this.metaframes.bind(this), this.onMessage = this.onMessage.bind(this), this.pluginIds = this.pluginIds.bind(this), this.plugins = this.plugins.bind(this), this.removeAll = this.removeAll.bind(this), this.removeMetaframe = this.removeMetaframe.bind(this), this.removePlugin = this.removePlugin.bind(this), this.setDebugFromUrlParams = this.setDebugFromUrlParams.bind(this), this.setDefinition = this.setDefinition.bind(this), this.setInput = this.setInput.bind(this), this.setInputs = this.setInputs.bind(this), this.setInputStateOnly = this.setInputStateOnly.bind(this), this.setMetaframeClientInputAndSentClientEvent = this.setMetaframeClientInputAndSentClientEvent.bind(this), this.setOutputStateOnly = this.setOutputStateOnly.bind(this), this.setState = this.setState.bind(this), this.isDisposed = this.isDisposed.bind(this), this.updatePluginsWithDefinition = this.updatePluginsWithDefinition.bind(this), this._emitDefinitionEvent = this._emitDefinitionEvent.bind(this), pe().then(() => {
      this.isDisposed() || (window.addEventListener("message", this.onMessage), this.log("Initialized"));
    });
  }
  isDisposed() {
    return this._metaframes === void 0;
  }
  addListenerReturnDisposer(t, n) {
    return super.addListener(t, n), () => {
      super.removeListener(t, n);
    };
  }
  setDebugFromUrlParams() {
    return this.debug = Mn(["MP_DEBUG", "DEBUG", "debug", "mp_debug"]), this;
  }
  getState() {
    return this._state;
  }
  setState(t) {
    if (this._state = t, this.getMetaframeIds().forEach((n) => {
      this.getMetaframe(n).setInputs(this._state.metaframes.inputs[n]), this.getMetaframe(n).setOutputs(this._state.metaframes.outputs[n]);
    }), this.getPluginIds().forEach((n) => {
      this.getPlugin(n).setInputs(this._state.plugins.inputs[n]), this.getPlugin(n).setOutputs(this._state.plugins.outputs[n]);
    }), this.listenerCount(k.State) > 0) {
      const n = Z(this._state, (i) => {
      });
      this.emit(k.State, n);
    }
  }
  getStateMetaframes() {
    return this._state.metaframes;
  }
  getDefinition() {
    return this._definition;
  }
  setDefinition(t, n) {
    if (!t.version)
      throw "Metapage definition must have a version";
    const i = Ye(t);
    i.metaframes && Object.keys(i.metaframes).forEach((c) => {
      if (i.plugins && i.plugins.includes(c))
        throw this.emitErrorMessage(`Plugin with url=${c} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`), `Plugin with url=${c} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`;
      var f = i.metaframes[c];
      if (typeof f != "object")
        throw this.emitErrorMessage(`Metaframe "${c}" is not an object`), `Metaframe "${c}" is not an object`;
      if (!f.url)
        throw this.emitErrorMessage(`Metaframe "${c}" missing field: url`), `Metaframe "${c}" missing field: url`;
    });
    const o = this._definition;
    return this._definition = i, Object.keys(this._metaframes).forEach((c) => {
      (!i.metaframes || !i.metaframes[c]) && this.removeMetaframe(c);
    }), Object.keys(this._plugins).forEach((c) => {
      i.plugins && !i.plugins.includes(c) && this.removePlugin(c);
    }), this._pluginOrder = i.plugins ? i.plugins : [], n && (this._state = n), i.metaframes && Object.keys(i.metaframes).forEach((c) => {
      if (!this._metaframes.hasOwnProperty(c)) {
        const f = i.metaframes[c];
        this.addMetaframe(c, f);
      }
    }), i.plugins && i.plugins.forEach((c) => {
      this._plugins.hasOwnProperty(c) || this.addPlugin(c);
    }), o !== We && window.setTimeout(() => {
      if (!this.isDisposed() && i === this._definition && (this._emitDefinitionEvent(), n && this.listenerCount(k.State) > 0)) {
        const c = Z(this._state, (f) => {
        });
        this.emit(k.State, c);
      }
    }, 0), this;
  }
  _emitDefinitionEvent() {
    if (this.listenerCount(k.Definition) > 0) {
      const t = Z(this._definition, (c) => {
        c.meta && delete c.meta.sha256;
      }), n = Z(this._metaframes, (c) => {
      }), i = Z(this._plugins, (c) => {
      }), o = {
        definition: t,
        metaframes: n,
        plugins: i
      };
      this.emit(k.Definition, o);
    }
  }
  addPipe(t, n) {
    this._inputMap[t] || (this._inputMap[t] = []), this._inputMap[t].push(n);
  }
  removeMetaframe(t) {
    this._metaframes[t] && (this._metaframes[t].dispose(), delete this._metaframes[t], delete this._state.metaframes.inputs[t], delete this._state.metaframes.outputs[t], delete this._inputMap[t], Object.keys(this._inputMap).forEach((n) => {
      const i = this._inputMap[n];
      let o = 0;
      for (; o <= i.length; )
        i[o] && i[o].metaframe === t ? i.splice(o, 1) : o++;
    }), this._cachedInputLookupMap = {});
  }
  removePlugin(t) {
    this._plugins[t] && (this._plugins[t].dispose(), delete this._plugins[t], delete this._state.plugins.inputs[t], delete this._state.plugins.outputs[t]);
  }
  removeAll() {
    Object.keys(this._metaframes).forEach((t) => this._metaframes[t].dispose()), Object.keys(this._plugins).forEach((t) => this._plugins[t].dispose()), this._metaframes = {}, this._plugins = {}, this._state = Ce(), this._inputMap = {}, this._cachedInputLookupMap = {};
  }
  metaframes() {
    return this.getMetaframes();
  }
  metaframeIds() {
    return this.getMetaframeIds();
  }
  getMetaframeIds() {
    return Object.keys(this._metaframes);
  }
  getMetaframes() {
    return Object.assign({}, this._metaframes);
  }
  plugins() {
    return Object.assign({}, this._plugins);
  }
  pluginIds() {
    return this.getPluginIds();
  }
  getPluginIds() {
    return this._pluginOrder.slice(0);
  }
  getMetaframe(t) {
    return this == null ? void 0 : this._metaframes[t];
  }
  getPlugin(t) {
    var n;
    return (n = this == null ? void 0 : this._plugins) == null ? void 0 : n[t];
  }
  addMetaframe(t, n) {
    if (!t)
      throw "addMetaframe missing metaframeId";
    if (!n)
      throw "addMetaframe missing definition";
    if (this._metaframes[t])
      throw this.emitErrorMessage(`Existing metaframe for id=${t}`), `Existing metaframe for id=${t}`;
    if (!n.url)
      throw this.emitErrorMessage(`Metaframe definition missing url id=${t}`), `Metaframe definition missing url id=${t}`;
    var i = new Pe(this, n.url, t, this._id, this._consoleBackgroundColor, this.debug).setMetapage(this);
    return this._metaframes[t] = i, i.addListener(k.Error, (o) => {
      this.emit(k.Error, {
        metaframeId: i.id,
        metaframeUrl: i.url,
        error: o
      });
    }), n.inputs && n.inputs.forEach((o) => this.addPipe(t, o)), i.setInputs(this._state.metaframes.inputs[t]), i;
  }
  addPlugin(t) {
    if (!t)
      throw "Plugin missing url";
    const n = new Pe(this, t, t, this._id, this._consoleBackgroundColor, this.debug).setInputs(this._state.plugins.inputs[t]).setMetapage(this).setPlugin();
    return Dn(this, n), this._plugins[t] = n, n;
  }
  dispose() {
    this.log("disposing"), super.removeAllListeners(), window.removeEventListener("message", this.onMessage), this._metaframes && Object.keys(this._metaframes).forEach((t) => this._metaframes[t].dispose()), this._plugins && Object.keys(this._plugins).forEach((t) => this._plugins[t].dispose()), this._id = void 0, this._metaframes = void 0, this._plugins = void 0, this._state = void 0, this._cachedInputLookupMap = void 0, this._inputMap = void 0;
  }
  log(t, n, i) {
    this.debug && this.logInternal(t, n, i);
  }
  error(t) {
    this.logInternal(t, "f00", this._consoleBackgroundColor), this.emitErrorMessage(`${t}`);
  }
  emitErrorMessage(t) {
    this.emit(k.Error, t);
  }
  getInputsFromOutput(t, n) {
    if (this._cachedInputLookupMap[t] || (this._cachedInputLookupMap[t] = {}), !this._cachedInputLookupMap[t][n]) {
      var i = [];
      this._cachedInputLookupMap[t][n] = i, Object.keys(this._inputMap).forEach((o) => {
        o !== t && this._inputMap[o].forEach((c) => {
          if (c.metaframe == t && jn(n, c.source)) {
            var f = c.target;
            (!c.target || c.target.startsWith("*") || c.target === "") && (f = n), i.push({ metaframe: o, pipe: f });
          }
        });
      });
    }
    return this._cachedInputLookupMap[t][n];
  }
  isValidJSONRpcMessage(t) {
    if (t.jsonrpc !== "2.0")
      return !1;
    switch (t.method) {
      case tt.SetupIframeClientRequest:
        return !0;
      default:
        var i = t.iframeId;
        return !(i && !(t.parentId === this._id && (this._metaframes[i] || this._plugins[i])));
    }
  }
  setInput(t, n, i) {
    if (this.setInputStateOnly(t, n, i), this.setMetaframeClientInputAndSentClientEvent(t, n, i), this.listenerCount(k.State) > 0 || this.listenerCount(k.Inputs) > 0) {
      const o = Z(this._state, (c) => {
      });
      this.emit(k.State, o), this.emit(k.Inputs, o);
    }
  }
  setMetaframeClientInputAndSentClientEvent(t, n, i) {
    if (typeof t == "object") {
      if (n || i)
        throw "bad arguments, see API docs";
      const o = t;
      Object.keys(o).forEach((c) => {
        var f = c, h = o[f];
        if (typeof h != "object")
          throw "bad arguments, see API docs";
        var g = this._metaframes[f];
        g ? g.setInputs(h) : this.error("No iframe id=$metaframeId");
      });
    } else if (typeof t == "string") {
      const o = this._metaframes[t];
      if (o == null && this.error(`No iframe id=${t}`), typeof n == "string")
        o.setInput(n, i);
      else if (typeof n == "object")
        o.setInputs(n);
      else
        throw "bad arguments, see API docs";
    } else
      throw "bad arguments, see API docs";
  }
  setInputs(t, n, i) {
    this.setInput(t, n, i);
  }
  setOutputStateOnly(t, n, i) {
    this._setStateOnly(!1, t, n, i);
  }
  setInputStateOnly(t, n, i) {
    this._setStateOnly(!0, t, n, i);
  }
  _setStateOnly(t, n, i, o) {
    if (typeof n == "object") {
      if (i || o)
        throw "If first argument is an object, subsequent args should be undefined";
      const c = n;
      Object.keys(c).forEach((f) => {
        var h = c[f];
        if (typeof h != "object")
          throw "Object values must be objects";
        const g = this._metaframes.hasOwnProperty(f);
        if (!g && !this._plugins.hasOwnProperty(f))
          throw "No metaframe or plugin: ${metaframeId}";
        const y = g ? t ? this._state.metaframes.inputs : this._state.metaframes.outputs : t ? this._state.plugins.inputs : this._state.plugins.outputs;
        y[f] = y[f] ? y[f] : {}, Object.keys(h).forEach((b) => {
          h[b] === void 0 ? delete y[f][b] : y[f][b] = h[b];
        });
      });
    } else if (typeof n == "string") {
      const c = n, f = this._metaframes.hasOwnProperty(c);
      if (!f && !this._plugins.hasOwnProperty(c))
        throw `No metaframe or plugin: ${c}`;
      let h = f ? t ? this._state.metaframes.inputs : this._state.metaframes.outputs : t ? this._state.plugins.inputs : this._state.plugins.outputs;
      if (typeof i == "string") {
        h = { ...h }, h[c] = h[c] ? h[c] : {};
        const g = i;
        o === void 0 ? delete h[c][g] : h[c][g] = o;
      } else if (typeof i == "object") {
        h[c] = h[c] ? h[c] : {};
        const g = i;
        Object.keys(g).forEach((y) => {
          g[y] === void 0 ? delete h[c][y] : h[c][y] = g[y];
        });
      } else
        throw "Second argument must be a string or an object";
    } else
      throw "First argument must be a string or an object";
  }
  getMetaframeOrPlugin(t) {
    var n = this._metaframes[t];
    return n || (n = this._plugins[t]), n;
  }
  onMessage(t) {
    if (typeof t.data == "object") {
      const f = t.data;
      if (!this.isValidJSONRpcMessage(f))
        return;
      var n = f.method;
      const h = f.iframeId;
      if (!h)
        return;
      const g = this.getMetaframeOrPlugin(h), y = this._plugins[h];
      f._messageCount = ++this._internalReceivedMessageCounter, this.debug && this.log(`processing ${JSON.stringify(f, null, "  ").substr(0, 500)}`);
      let b;
      switch (n) {
        case tt.SetupIframeClientRequest:
          g && g.register();
          break;
        case tt.SetupIframeServerResponseAck:
          if (g) {
            const U = f.params;
            g.registered(U.version);
          }
          break;
        case tt.OutputsUpdate:
          const O = f.params;
          if (this._metaframes[h]) {
            var i = this._metaframes[h];
            this.setOutputStateOnly(h, O), i.setOutputs(O), this.listenerCount(k.State) > 0 && (b || (b = Z(this._state, (I) => {
            })), this.emit(k.State, b));
            var o = !1;
            const U = Object.keys(O), B = {};
            U.forEach((I, L) => {
              const d = this.getInputsFromOutput(h, I);
              d.length > 0 && d.forEach((S) => {
                B[S.metaframe] || (B[S.metaframe] = {}), B[S.metaframe][S.pipe] = O[I], this.setInputStateOnly(S.metaframe, S.pipe, O[I]), o = !0;
              });
            }), Object.keys(B).forEach((I) => {
              this._metaframes[I].setInputs(B[I]);
            }), o && this.listenerCount(k.State) > 0 && (b || (b = Z(this._state, (I) => {
            })), this.emit(k.State, b)), this.debug && (b || (b = Z(this._state, (I) => {
            })), i.ack({ jsonrpc: f, state: b }));
          } else if (this._plugins[h]) {
            const U = !O[yt] && !O[ct];
            U && this.setOutputStateOnly(h, O), this._plugins[h].setOutputs(O), U && this.listenerCount(k.State) > 0 && (b || (b = Z(this._state, (B) => {
            })), this.emit(k.State, b)), this.debug && (b || (b = Z(this._state, (B) => {
            })), this._plugins[h].ack({
              jsonrpc: f,
              state: b
            }));
          } else
            this.error("missing metaframe/plugin=$metaframeId");
          break;
        case tt.InputsUpdate:
          var c = f.params;
          if (this.debug && this.log(`inputs ${JSON.stringify(c)} from ${h}`), this._metaframes[h])
            this.setInputStateOnly(h, c), this._metaframes[h].setInputs(c), this.listenerCount(k.State) > 0 && (b || (b = Z(this._state, (U) => {
            })), this.emit(k.State, b)), this.debug && (b || (b = Z(this._state, (U) => {
            })), this._metaframes[h].ack({
              jsonrpc: f,
              state: b
            }));
          else if (this._plugins[h]) {
            const U = !c[yt] && !c[ct];
            U && this.setInputStateOnly(h, c), this._plugins[h].setInputs(c), U && this.listenerCount(k.State) > 0 && (b || (b = Z(this._state, (B) => {
            })), this.emit(k.State, b)), this.debug && (b || (b = Z(this._state, (B) => {
            })), this._plugins[h].ack({
              jsonrpc: f,
              state: b
            }));
          } else
            console.error(`InputsUpdate failed no metaframe or plugin id: "${h}"`), this.error(`InputsUpdate failed no metaframe or plugin id: "${h}"`);
          break;
        case tt.PluginRequest:
          y && g && g.hasPermissionsState() && (g.setInput(yt, this._state), this.debug && g.ack({ jsonrpc: f, state: this._state }));
          break;
        case tt.HashParamsUpdate:
          if (!y && g) {
            const U = f.params, B = new URL(g.url);
            B.hash = U.hash, g.url = B.href, this._definition = Z(this._definition, (I) => {
              I.metaframes[U.metaframe].url = B.href;
            }), this._emitDefinitionEvent();
          }
          break;
        default:
          this.debug && this.log(`Unknown RPC method: "${n}"`);
      }
      this.listenerCount(k.Message) > 0 && this.emit(k.Message, f);
    }
  }
  updatePluginsWithDefinition() {
    Object.values(this._plugins).forEach((t) => {
      t.hasPermissionsDefinition() && Ln(t);
    });
  }
  logInternal(t, n, i) {
    i = i || this._consoleBackgroundColor;
    let o;
    typeof t == "string" ? o = t : typeof t == "number" ? o = t + "" : o = JSON.stringify(t), o = this._id ? `Metapage[${this._id}] ${o}` : o, he(o, n, i);
  }
}
ot.version = ze;
ot.DEFINITION = k.Definition;
ot.DEFINITION_UPDATE_REQUEST = k.DefinitionUpdateRequest;
ot.ERROR = k.Error;
ot.INPUTS = k.Inputs;
ot.MESSAGE = k.Message;
ot.OUTPUTS = k.Outputs;
ot.STATE = k.State;
ot.deserializeInputs = Pt;
ot.serializeInputs = Jt;
const Dn = async (e, t) => {
  try {
    const o = await t.getDefinition();
    if (!o)
      throw `${t.url}`;
    if (t.isDisposed())
      return;
    if (t.hasPermissionsDefinition()) {
      var n = e.addListenerReturnDisposer(k.Definition, (c) => {
        t.setInput(ct, c.definition);
      });
      t._disposables.push(n);
      var i = e.getDefinition();
      if (i && (t.setInput(ct, i), o.outputs)) {
        var n = t.onOutput(ct, (f) => {
          e.listenerCount(k.DefinitionUpdateRequest) > 0 && Ie.sha1(f) !== Ie.sha1(i) && e.emit(k.DefinitionUpdateRequest, f);
        });
        t._disposables.push(n);
      }
    }
    if (t.hasPermissionsState() && o.outputs) {
      var n = t.onOutput(yt, (f) => {
        e.setState(f);
      });
      t._disposables.push(n);
    }
  } catch (o) {
    console.error(o), e.emit(k.Error, `Failed to get plugin definition from "${t.getDefinitionUrl()}", error=${o}`);
  }
}, Ln = (e) => {
  const t = e._metapage.getDefinition();
  e.setInput(ct, t);
};
var gt;
(function(e) {
  e.WaitingForPageLoad = "WaitingForPageLoad", e.SentSetupIframeClientRequest = "SentSetupIframeClientRequest", e.Ready = "Ready";
})(gt || (gt = {}));
var K;
(function(e) {
  e.Connected = "connected", e.Error = "error", e.Input = "input", e.Inputs = "inputs", e.Message = "message";
})(K || (K = {}));
class ft extends le.EventEmitter {
  constructor(t) {
    if (super(), this._inputPipeValues = {}, this._outputPipeValues = {}, this._state = gt.WaitingForPageLoad, this._messageSendCount = 0, this.debug = se(), this.isInputOutputBlobSerialization = !0, this.id = window.name, this.debug = se(), this._isIframe = vn(), this.addListener = this.addListener.bind(this), this.dispose = this.dispose.bind(this), this.error = this.error.bind(this), this.getInput = this.getInput.bind(this), this.getInputs = this.getInputs.bind(this), this.log = this.log.bind(this), this.logInternal = this.logInternal.bind(this), this.onInput = this.onInput.bind(this), this.onInputs = this.onInputs.bind(this), this.onMessage = this.onMessage.bind(this), this.sendRpc = this.sendRpc.bind(this), this.setInput = this.setInput.bind(this), this.setInputs = this.setInputs.bind(this), this.setInternalInputsAndNotify = this.setInternalInputsAndNotify.bind(this), this.setOutput = this.setOutput.bind(this), this.setOutputs = this.setOutputs.bind(this), this.warn = this.warn.bind(this), this._resolveSetupIframeServerResponse = this._resolveSetupIframeServerResponse.bind(this), this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this), this.connected = this.connected.bind(this), this.disableNotifyOnHashUrlChange = this.disableNotifyOnHashUrlChange.bind(this), this._onHashUrlChange = this._onHashUrlChange.bind(this), !this._isIframe) {
      this.log("Not an iframe, metaframe code disabled");
      return;
    }
    const n = this;
    pe().then(() => {
      this.log("pageLoaded"), window.addEventListener("message", this.onMessage), n.sendRpc(tt.SetupIframeClientRequest, {
        version: ft.version
      }), n._state = gt.SentSetupIframeClientRequest;
    }), t && t.disableHashChangeEvent || window.addEventListener("hashchange", this._onHashUrlChange);
  }
  _resolveSetupIframeServerResponse(t) {
    if (this._state === gt.WaitingForPageLoad)
      throw "Got message but page has not finished loading, we should never get in this state";
    (async () => this._parentId ? this.log("Got JsonRpcMethods.SetupIframeServerResponse but already resolved") : (this._parentVersion = t.version, this.color = Ke(this.id), this._parentId = t.parentId, this.log(`metapage[${this._parentId}](v${this._parentVersion ? this._parentVersion : "unknown"}) registered`), t.state && t.state.inputs && (this.isInputOutputBlobSerialization ? this._inputPipeValues = await Pt(t.state.inputs) : this._inputPipeValues = t.state.inputs), this._state = gt.Ready, this.sendRpc(tt.SetupIframeServerResponseAck, {
      version: ft.version
    }), this._inputPipeValues && Object.keys(this._inputPipeValues).length > 0 && (this.emit(K.Inputs, this._inputPipeValues), Object.keys(this._inputPipeValues).forEach((n) => this.emit(K.Input, n, this._inputPipeValues[n]))), this.emit(K.Inputs, this._inputPipeValues), t.plugin && (this.plugin = new Un(this)), this.emit(K.Connected)))();
  }
  async connected() {
    if (this._state !== gt.Ready)
      return new Promise((t, n) => {
        let i;
        i = this.addListenerReturnDisposer(K.Connected, () => {
          t(), i();
        });
      });
  }
  addListenerReturnDisposer(t, n) {
    return super.addListener(t, n), () => {
      super.removeListener(t, n);
    };
  }
  log(t, n, i) {
    this.debug && this.logInternal(t, n || this.color);
  }
  warn(t) {
    this.debug && this.logInternal(t, "000", this.color);
  }
  error(t) {
    this.logInternal(t, this.color, "f00");
  }
  logInternal(t, n, i) {
    let o;
    typeof t == "string" ? o = t : typeof t == "number" ? o = t + "" : o = JSON.stringify(t), n = n && n + "", o = (this.id ? `Metaframe[${this.id}] ` : "") + `${o}`, he(o, n, i);
  }
  dispose() {
    super.removeAllListeners(), window.removeEventListener("message", this.onMessage), this.disableNotifyOnHashUrlChange(), this._inputPipeValues = void 0, this._outputPipeValues = void 0;
  }
  addListener(t, n) {
    return super.addListener(t, n), t === K.Inputs && window.setTimeout(() => {
      this._inputPipeValues && n(this._inputPipeValues);
    }, 0), this;
  }
  onInput(t, n) {
    return this.addListenerReturnDisposer(K.Input, (i, o) => {
      t === i && n(o);
    });
  }
  onInputs(t) {
    return this.addListenerReturnDisposer(K.Inputs, t);
  }
  setInput(t, n) {
    var i = {};
    i[t] = n, this.setInputs(i);
  }
  async setInputs(t) {
    this.isInputOutputBlobSerialization && (t = await Pt(t)), this.sendRpc(tt.InputsUpdate, t);
  }
  async setInternalInputsAndNotify(t) {
    if (this.isInputOutputBlobSerialization && (t = await Pt(t)), !!Vt(this._inputPipeValues, t)) {
      Object.keys(t).forEach((n) => {
        try {
          this.emit(K.Input, n, t[n]);
        } catch (i) {
          console.error(`Error emitting input ${n}: ${i}`), this.emit(K.Error, `Error emitting input ${n}: ${i}`);
        }
      });
      try {
        this.emit(K.Inputs, t);
      } catch (n) {
        console.error(`Error emitting inputs: ${n}`), this.emit(K.Error, `Error emitting inputs: ${n}`);
      }
    }
  }
  getInput(t) {
    return console.assert(!!t), this._inputPipeValues[t];
  }
  getInputs() {
    return this._inputPipeValues;
  }
  setOutput(t, n) {
    console.assert(!!t);
    var i = {};
    i[t] = n, this.setOutputs(i);
  }
  async setOutputs(t) {
    this.isInputOutputBlobSerialization && (t = await Jt(t)), Vt(this._outputPipeValues, t) && this.sendRpc(tt.OutputsUpdate, t);
  }
  disableNotifyOnHashUrlChange() {
    window.removeEventListener("hashchange", this._onHashUrlChange);
  }
  _onHashUrlChange(t) {
    const n = {
      hash: window.location.hash,
      metaframe: this.id
    };
    this.sendRpc(tt.HashParamsUpdate, n);
  }
  sendRpc(t, n) {
    if (this._isIframe) {
      const i = {
        jsonrpc: "2.0",
        id: ++this._messageSendCount,
        method: t,
        params: n,
        iframeId: this.id,
        parentId: this._parentId
      };
      window.parent && window.parent.postMessage(i, "*");
    } else
      this.log("Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe");
  }
  onMessage(t) {
    if (typeof t.data == "object") {
      let i = t.data;
      if (i.jsonrpc === "2.0") {
        var n = i.method;
        if (!(n == pt.SetupIframeServerResponse || i.parentId == this._parentId && i.iframeId == this.id)) {
          this.log(`window.message: received message but jsonrpc.parentId=${i.parentId} _parentId=${this._parentId} jsonrpc.iframeId=${i.iframeId} id=${this.id}`);
          return;
        }
        switch (n) {
          case pt.SetupIframeServerResponse:
            this._resolveSetupIframeServerResponse(i.params);
            break;
          case pt.InputsUpdate:
            if (this._state !== gt.Ready)
              throw "Got InputsUpdate but metaframe is not MetaframeLoadingState.Ready";
            this.setInternalInputsAndNotify(i.params.inputs);
            break;
          case pt.MessageAck:
            this.debug && this.log(`ACK: ${JSON.stringify(i)}`);
            break;
          default:
            this.debug && this.log(`window.message: unknown JSON-RPC method: ${JSON.stringify(i)}`);
            break;
        }
        this.emit(K.Message, i);
      }
    }
  }
}
ft.version = pn;
ft.ERROR = K.Error;
ft.CONNECTED = K.Connected;
ft.INPUT = K.Input;
ft.INPUTS = K.Inputs;
ft.MESSAGE = K.Message;
ft.deserializeInputs = Pt;
ft.serializeInputs = Jt;
class Un {
  constructor(t) {
    this._metaframe = t, this.requestState = this.requestState.bind(this), this.onState = this.onState.bind(this), this.getState = this.getState.bind(this), this.setState = this.setState.bind(this), this.onDefinition = this.onDefinition.bind(this), this.getDefinition = this.getDefinition.bind(this), this.setDefinition = this.setDefinition.bind(this);
  }
  requestState() {
    var t = {
      method: ne.State
    };
    this._metaframe.sendRpc(tt.PluginRequest, t);
  }
  onState(t) {
    const n = this._metaframe.onInput(yt, t);
    return this.getState() && t(this.getState()), n;
  }
  getState() {
    return this._metaframe.getInput(yt);
  }
  setState(t) {
    this._metaframe.setOutput(yt, t);
  }
  onDefinition(t) {
    var n = this._metaframe.onInput(ct, t);
    return this.getDefinition() && t(this.getDefinition()), n;
  }
  setDefinition(t) {
    this._metaframe.setOutput(ct, t);
  }
  getDefinition() {
    return this._metaframe.getInput(ct);
  }
}
export {
  ne as ApiPayloadPluginRequestMethod,
  We as INITIAL_NULL_METAPAGE_DEFINITION,
  tt as JsonRpcMethodsFromChild,
  pt as JsonRpcMethodsFromParent,
  ft as Metaframe,
  K as MetaframeEvents,
  gt as MetaframeLoadingState,
  Un as MetaframePlugin,
  xn as MetaframeVersionCurrent,
  Ee as MetaframeVersionsAll,
  ot as Metapage,
  je as MetapageEventStateType,
  k as MetapageEvents,
  Ct as MetapageHashParams,
  Pe as MetapageIFrameRpcClient,
  In as MetapageShared,
  Rt as MetapageVersionCurrent,
  Se as MetapageVersionsAll,
  qe as convertMetaframeJsonToCurrentVersion,
  Ye as convertMetapageDefinitionToCurrentVersion,
  Pt as deserializeInputs,
  Mn as existsAnyUrlParam,
  ce as generateId,
  Tn as generateMetaframeId,
  An as generateMetapageId,
  Nn as generateNonce,
  Fn as getLibraryVersionMatching,
  He as getMatchingVersion,
  Bn as getUrlParam,
  kn as getUrlParamDebug,
  Rn as hashCode,
  Pn as intToRGB,
  se as isDebugFromUrlsParams,
  vn as isIframe,
  Kt as isPageLoaded,
  he as log,
  jn as matchPipe,
  Vt as merge,
  zn as metapageAllSha256Hash,
  $n as metapageOnlyEssentailSha256Hash,
  pe as pageLoaded,
  mn as possiblyDeserializeDatarefToValue,
  dn as possiblySerializeValueToDataref,
  Jt as serializeInputs,
  Ke as stringToRgb
};
//# sourceMappingURL=index.js.map
