/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it } from "vitest";
import {
  collectTransferables,
  deepCopyInputsWithTransferables,
  deserializeInputs,
  serializeInputs,
} from "../src/metapage/data";

// Helper: compare ArrayBuffer contents
function buffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  if (va.length !== vb.length) return false;
  for (let i = 0; i < va.length; i++) {
    if (va[i] !== vb[i]) return false;
  }
  return true;
}

describe("collectTransferables", () => {
  it("collects a flat ArrayBuffer", () => {
    const buf = new ArrayBuffer(8);
    const result = collectTransferables(buf);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(buf);
  });

  it("collects ArrayBuffer from Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = collectTransferables(arr);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(arr.buffer);
  });

  it("collects ArrayBuffer from Float32Array", () => {
    const arr = new Float32Array([1.0, 2.0]);
    const result = collectTransferables(arr);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(arr.buffer);
  });

  it("de-duplicates shared backing buffers", () => {
    const buf = new ArrayBuffer(8);
    const view1 = new Uint8Array(buf, 0, 4);
    const view2 = new Int32Array(buf);
    const inputs = { a: view1, b: view2 };
    const result = collectTransferables(inputs);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(buf);
  });

  it("collects from nested objects", () => {
    const buf1 = new ArrayBuffer(4);
    const buf2 = new ArrayBuffer(8);
    const inputs = { outer: { inner: buf1 }, other: buf2 };
    const result = collectTransferables(inputs);
    expect(result).toHaveLength(2);
    expect(result).toContain(buf1);
    expect(result).toContain(buf2);
  });

  it("collects from arrays", () => {
    const buf1 = new ArrayBuffer(4);
    const buf2 = new ArrayBuffer(4);
    const result = collectTransferables([buf1, buf2]);
    expect(result).toHaveLength(2);
    expect(result).toContain(buf1);
    expect(result).toContain(buf2);
  });

  it("returns empty array for non-binary values", () => {
    expect(collectTransferables("hello")).toHaveLength(0);
    expect(collectTransferables(42)).toHaveLength(0);
    expect(collectTransferables(null)).toHaveLength(0);
    expect(collectTransferables(undefined)).toHaveLength(0);
    expect(collectTransferables({ foo: "bar" })).toHaveLength(0);
    expect(collectTransferables([1, 2, 3])).toHaveLength(0);
  });

  it("returns empty array for Blob (not transferable, uses structured clone)", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const result = collectTransferables(blob);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for File", () => {
    const file = new File(["data"], "test.txt");
    const result = collectTransferables(file);
    expect(result).toHaveLength(0);
  });

  it("collects multiple TypedArrays with different buffers", () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Uint8Array([4, 5, 6]);
    const inputs = { x: a, y: b };
    const result = collectTransferables(inputs);
    expect(result).toHaveLength(2);
    expect(result).toContain(a.buffer);
    expect(result).toContain(b.buffer);
  });
});

describe("deepCopyInputsWithTransferables", () => {
  it("clones ArrayBuffer with same content", () => {
    const original = new Uint8Array([1, 2, 3]).buffer;
    const inputs = { data: original };
    const copied = deepCopyInputsWithTransferables(inputs);
    expect(copied.data).toBeInstanceOf(ArrayBuffer);
    expect(copied.data).not.toBe(original);
    expect(buffersEqual(copied.data as ArrayBuffer, original)).toBe(true);
  });

  it("clones TypedArray with same content", () => {
    const original = new Float32Array([1.5, 2.5, 3.5]);
    const inputs = { arr: original };
    const copied = deepCopyInputsWithTransferables(inputs);
    expect(copied.arr).toBeInstanceOf(Float32Array);
    expect(copied.arr).not.toBe(original);
    expect(Array.from(copied.arr as Float32Array)).toEqual([1.5, 2.5, 3.5]);
  });

  it("clones Uint8Array with same content", () => {
    const original = new Uint8Array([10, 20, 30]);
    const copied = deepCopyInputsWithTransferables({ data: original });
    expect(copied.data).toBeInstanceOf(Uint8Array);
    expect(Array.from(copied.data as Uint8Array)).toEqual([10, 20, 30]);
  });

  it("returns Blob by reference (structured clone handles it)", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const copied = deepCopyInputsWithTransferables({ b: blob });
    expect(copied.b).toBe(blob);
  });

  it("returns File by reference", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const copied = deepCopyInputsWithTransferables({ f: file });
    expect(copied.f).toBe(file);
  });

  it("passes through plain values unchanged", () => {
    const copied = deepCopyInputsWithTransferables({
      str: "hello",
      num: 42,
      bool: true,
      nil: null,
    });
    expect(copied.str).toBe("hello");
    expect(copied.num).toBe(42);
    expect(copied.bool).toBe(true);
    expect(copied.nil).toBeNull();
  });

  it("deep-copies nested objects with ArrayBuffers", () => {
    const buf = new ArrayBuffer(4);
    new Uint8Array(buf).set([1, 2, 3, 4]);
    const copied = deepCopyInputsWithTransferables({
      nested: { inner: buf },
    });
    const innerCopy = (copied.nested as any).inner as ArrayBuffer;
    expect(innerCopy).toBeInstanceOf(ArrayBuffer);
    expect(innerCopy).not.toBe(buf);
    expect(buffersEqual(innerCopy, buf)).toBe(true);
  });

  it("clones multiple keys independently", () => {
    const buf1 = new ArrayBuffer(4);
    const buf2 = new ArrayBuffer(8);
    const copied = deepCopyInputsWithTransferables({ a: buf1, b: buf2 });
    expect(copied.a).not.toBe(buf1);
    expect(copied.b).not.toBe(buf2);
    expect((copied.a as ArrayBuffer).byteLength).toBe(4);
    expect((copied.b as ArrayBuffer).byteLength).toBe(8);
  });

  it("handles empty inputs map", () => {
    const copied = deepCopyInputsWithTransferables({});
    expect(Object.keys(copied)).toHaveLength(0);
  });
});

describe("Version compatibility: deserializeInputs is safe on already-binary values", () => {
  // This validates the key invariant that makes old-sender → new-receiver work:
  // deserializeInputs() is always a no-op for values that are already binary,
  // so calling it unconditionally in transferable mode is safe.

  it("deserializeInputs is a no-op for ArrayBuffer", async () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const result = await deserializeInputs({ data: buf });
    expect(result.data).toBe(buf); // same reference, untouched
  });

  it("deserializeInputs is a no-op for Float32Array", async () => {
    const arr = new Float32Array([1.5, 2.5]);
    const result = await deserializeInputs({ data: arr });
    expect(result.data).toBe(arr);
  });

  it("deserializeInputs is a no-op for Blob", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const result = await deserializeInputs({ data: blob });
    expect(result.data).toBe(blob);
  });

  it("deserializeInputs is a no-op for File", async () => {
    const file = new File(["content"], "test.txt");
    const result = await deserializeInputs({ data: file });
    expect(result.data).toBe(file);
  });

  it("old-sender data URL still deserializes when receiver is in transferable mode", async () => {
    // Simulate an old metaframe serializing a Float32Array to a data URL
    const original = new Float32Array([1.1, 2.2, 3.3]);
    const serialized = await serializeInputs({ data: original });
    expect(typeof serialized.data).toBe("string"); // old format: data URL string

    // New receiver in transferable mode should still deserialize it
    // (deserializeInputs is called unconditionally - it's not skipped in transferable mode)
    const received = await deserializeInputs(serialized);
    expect(received.data).toBeInstanceOf(Float32Array);
    expect(Array.from(received.data as Float32Array)[0]).toBeCloseTo(1.1);
  });

  it("mixed old-format and new-format values in same inputs map", async () => {
    // Old sender serialized some values; new-format binary arrived natively
    const nativeBuf = new ArrayBuffer(4);
    new Uint8Array(nativeBuf).set([10, 20, 30, 40]);

    const oldSerialized = await serializeInputs({
      legacy: new Uint8Array([1, 2, 3]),
    });

    const mixed = {
      native: nativeBuf,         // arrived via postMessage transfer (already binary)
      legacy: oldSerialized.legacy, // arrived as data URL from old sender
      plain: "hello",
    };

    const result = await deserializeInputs(mixed);
    expect(result.native).toBe(nativeBuf);           // unchanged
    expect(result.legacy).toBeInstanceOf(Uint8Array); // deserialized from data URL
    expect(result.plain).toBe("hello");               // unchanged
  });
});
