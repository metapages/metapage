/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it } from "vitest";
import { encode } from "base64-arraybuffer";
import {
  serializeInputs,
  deserializeInputs,
  possiblySerializeValueToDataref,
  possiblyDeserializeDatarefToValue,
  possiblyDeserializeDatarefToFile,
  valueToFile,
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

describe("Bug fix: serializeInputs/deserializeInputs process ALL keys", () => {
  it("serializeInputs serializes all keys, not just the first", async () => {
    const inputs = {
      a: new Float32Array([1, 2, 3]),
      b: new Uint8Array([4, 5, 6]),
      c: "plain string",
    };
    const result = await serializeInputs(inputs);
    expect(typeof result.a).toBe("string");
    expect((result.a as string).startsWith("data:")).toBe(true);
    expect(typeof result.b).toBe("string");
    expect((result.b as string).startsWith("data:")).toBe(true);
    expect(result.c).toBe("plain string");
  });

  it("deserializeInputs deserializes all keys, not just the first", async () => {
    const inputs = {
      a: new Float32Array([1, 2, 3]),
      b: new Uint8Array([4, 5, 6]),
    };
    const serialized = await serializeInputs(inputs);
    const result = await deserializeInputs(serialized);
    expect(result.a).toBeInstanceOf(Float32Array);
    expect(result.b).toBeInstanceOf(Uint8Array);
    expect(Array.from(result.a as Float32Array)).toEqual([1, 2, 3]);
    expect(Array.from(result.b as Uint8Array)).toEqual([4, 5, 6]);
  });
});

describe("Round-trip serialization: TypedArrays", () => {
  const typedArrayCases: [string, () => ArrayBufferView][] = [
    ["Int8Array", () => new Int8Array([1, -2, 3])],
    ["Uint8Array", () => new Uint8Array([1, 2, 3])],
    ["Uint8ClampedArray", () => new Uint8ClampedArray([1, 2, 3])],
    ["Int16Array", () => new Int16Array([1, -2, 3])],
    ["Uint16Array", () => new Uint16Array([1, 2, 3])],
    ["Int32Array", () => new Int32Array([1, -2, 3])],
    ["Uint32Array", () => new Uint32Array([1, 2, 3])],
    ["Float32Array", () => new Float32Array([1.5, -2.5, 3.5])],
    ["Float64Array", () => new Float64Array([1.5, -2.5, 3.5])],
  ];

  for (const [name, factory] of typedArrayCases) {
    it(`round-trips ${name}`, async () => {
      const original = factory();
      const serialized = await possiblySerializeValueToDataref(original);
      expect(typeof serialized).toBe("string");
      expect((serialized as string).startsWith("data:")).toBe(true);
      expect(serialized as string).toContain(`type=${name}`);

      const deserialized = await possiblyDeserializeDatarefToValue(serialized);
      expect(deserialized.constructor.name).toBe(name);
      expect(Array.from(deserialized as any)).toEqual(
        Array.from(original as any),
      );
    });
  }
});

describe("Round-trip serialization: ArrayBuffer", () => {
  it("round-trips ArrayBuffer", async () => {
    const original = new Uint8Array([10, 20, 30]).buffer;
    const serialized = await possiblySerializeValueToDataref(original);
    expect(typeof serialized).toBe("string");
    expect((serialized as string).startsWith("data:")).toBe(true);

    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(ArrayBuffer);
    expect(buffersEqual(deserialized, original)).toBe(true);
  });
});

describe("Round-trip serialization: Blob", () => {
  it("round-trips Blob with MIME type", async () => {
    const original = new Blob(["hello world"], { type: "text/plain" });
    const serialized = await possiblySerializeValueToDataref(original);
    expect(typeof serialized).toBe("string");
    expect(serialized as string).toContain("blob=true");
    expect(serialized as string).toContain("text/plain");

    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(Blob);
    expect(deserialized.type).toBe("text/plain");
    const text = await deserialized.text();
    expect(text).toBe("hello world");
  });

  it("round-trips Blob with no MIME type", async () => {
    const original = new Blob([new Uint8Array([1, 2, 3])]);
    const serialized = await possiblySerializeValueToDataref(original);
    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(Blob);
    const buf = await deserialized.arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe("Round-trip serialization: File", () => {
  it("round-trips File with name, type, and lastModified", async () => {
    const lastMod = 1700000000000;
    const original = new File(["file content"], "test.txt", {
      type: "text/plain",
      lastModified: lastMod,
    });
    const serialized = await possiblySerializeValueToDataref(original);
    expect(typeof serialized).toBe("string");
    expect(serialized as string).toContain("file=true");
    expect(serialized as string).toContain("name=test.txt");
    expect(serialized as string).toContain(`lastModified=${lastMod}`);

    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(File);
    expect(deserialized.name).toBe("test.txt");
    expect(deserialized.type).toBe("text/plain");
    expect(deserialized.lastModified).toBe(lastMod);
    const text = await deserialized.text();
    expect(text).toBe("file content");
  });

  it("round-trips File with special characters in name", async () => {
    const original = new File(["data"], "my file (1).txt", {
      type: "application/octet-stream",
    });
    const serialized = await possiblySerializeValueToDataref(original);
    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(File);
    expect(deserialized.name).toBe("my file (1).txt");
  });
});

describe("Legacy metapage _s/_c format deserialization", () => {
  it("deserializes Float32Array", async () => {
    const original = new Float32Array([1.5, 2.5, 3.5]);
    const legacy = {
      _s: true,
      _c: "Float32Array",
      value: encode(original.buffer),
      byteLength: original.byteLength,
      byteOffset: original.byteOffset,
      size: original.byteLength,
    };
    const result = await possiblyDeserializeDatarefToValue(legacy);
    expect(result).toBeInstanceOf(Float32Array);
    expect(Array.from(result as Float32Array)).toEqual([1.5, 2.5, 3.5]);
  });

  it("deserializes ArrayBuffer", async () => {
    const original = new Uint8Array([7, 8, 9]).buffer;
    const legacy = {
      _s: true,
      _c: "ArrayBuffer",
      value: encode(original),
      size: original.byteLength,
    };
    const result = await possiblyDeserializeDatarefToValue(legacy);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(buffersEqual(result, original)).toBe(true);
  });

  it("deserializes Blob", async () => {
    const buf = new TextEncoder().encode("blob data").buffer;
    const legacy = {
      _s: true,
      _c: "Blob",
      value: encode(buf),
      fileType: "text/plain",
      size: buf.byteLength,
    };
    const result = await possiblyDeserializeDatarefToValue(legacy);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("text/plain");
    const text = await result.text();
    expect(text).toBe("blob data");
  });

  it("deserializes File", async () => {
    const buf = new TextEncoder().encode("file data").buffer;
    const lastMod = 1600000000000;
    const legacy = {
      _s: true,
      _c: "File",
      value: encode(buf),
      name: "legacy.txt",
      fileType: "text/plain",
      lastModified: lastMod,
      size: buf.byteLength,
    };
    const result = await possiblyDeserializeDatarefToValue(legacy);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("legacy.txt");
    expect(result.type).toBe("text/plain");
    expect(result.lastModified).toBe(lastMod);
    const text = await result.text();
    expect(text).toBe("file data");
  });
});

describe("dataref v1 ref/c format deserialization", () => {
  it("deserializes Float32Array", async () => {
    const original = new Float32Array([4.0, 5.0]);
    const v1 = {
      ref: "base64",
      c: "Float32Array",
      value: encode(original.buffer),
    };
    const result = await possiblyDeserializeDatarefToValue(v1);
    expect(result).toBeInstanceOf(Float32Array);
    expect(Array.from(result as Float32Array)).toEqual([4.0, 5.0]);
  });

  it("deserializes ArrayBuffer", async () => {
    const original = new Uint8Array([11, 12]).buffer;
    const v1 = {
      ref: "base64",
      c: "ArrayBuffer",
      value: encode(original),
    };
    const result = await possiblyDeserializeDatarefToValue(v1);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(buffersEqual(result, original)).toBe(true);
  });

  it("deserializes Blob", async () => {
    const buf = new TextEncoder().encode("v1 blob").buffer;
    const v1 = {
      ref: "base64",
      c: "Blob",
      value: encode(buf),
      fileType: "application/json",
    };
    const result = await possiblyDeserializeDatarefToValue(v1);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/json");
  });

  it("deserializes File", async () => {
    const buf = new TextEncoder().encode("v1 file").buffer;
    const v1 = {
      ref: "base64",
      c: "File",
      value: encode(buf),
      name: "v1file.bin",
      fileType: "application/octet-stream",
      lastModified: 1500000000000,
    };
    const result = await possiblyDeserializeDatarefToValue(v1);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("v1file.bin");
    expect(result.lastModified).toBe(1500000000000);
  });
});

describe("Passthrough: non-binary values", () => {
  const passthroughCases: [string, any][] = [
    ["string", "hello"],
    ["number", 42],
    ["boolean true", true],
    ["boolean false", false],
    ["null", null],
    ["undefined", undefined],
    ["plain object", { foo: "bar", nested: { a: 1 } }],
    ["array", [1, "two", 3]],
  ];

  for (const [label, value] of passthroughCases) {
    it(`passes through ${label}`, async () => {
      const serialized = await possiblySerializeValueToDataref(value);
      expect(serialized).toEqual(value);
      const deserialized = await possiblyDeserializeDatarefToValue(value);
      expect(deserialized).toEqual(value);
    });
  }
});

describe("Edge cases", () => {
  it("handles empty typed arrays", async () => {
    const original = new Float32Array([]);
    const serialized = await possiblySerializeValueToDataref(original);
    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(Float32Array);
    expect((deserialized as Float32Array).length).toBe(0);
  });

  it("handles empty ArrayBuffer", async () => {
    const original = new ArrayBuffer(0);
    const serialized = await possiblySerializeValueToDataref(original);
    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(ArrayBuffer);
    expect((deserialized as ArrayBuffer).byteLength).toBe(0);
  });

  it("handles empty File", async () => {
    const original = new File([], "empty.bin", {
      type: "application/octet-stream",
    });
    const serialized = await possiblySerializeValueToDataref(original);
    const deserialized = await possiblyDeserializeDatarefToValue(serialized);
    expect(deserialized).toBeInstanceOf(File);
    expect(deserialized.name).toBe("empty.bin");
    expect(deserialized.size).toBe(0);
  });

  it("does not treat objects that look like but aren't legacy format", async () => {
    // Has _s but not true
    const notLegacy1 = { _s: false, _c: "Float32Array", value: "AAAA" };
    const r1 = await possiblyDeserializeDatarefToValue(notLegacy1);
    expect(r1).toEqual(notLegacy1);

    // Has _s:true but no _c
    const notLegacy2 = { _s: true, value: "AAAA" };
    const r2 = await possiblyDeserializeDatarefToValue(notLegacy2);
    expect(r2).toEqual(notLegacy2);

    // Has ref but not "base64"
    const notV1 = { ref: "url", c: "Float32Array", value: "http://x" };
    const r3 = await possiblyDeserializeDatarefToValue(notV1);
    expect(r3).toEqual(notV1);
  });
});

describe("possiblyDeserializeDatarefToFile", () => {
  it("returns File from serialized File", async () => {
    const original = new File(["content"], "test.txt", { type: "text/plain" });
    const serialized = await possiblySerializeValueToDataref(original);
    const file = await possiblyDeserializeDatarefToFile(serialized);
    expect(file).toBeInstanceOf(File);
    expect(file!.name).toBe("test.txt");
  });

  it("returns File from serialized Blob", async () => {
    const original = new Blob(["data"], { type: "text/plain" });
    const serialized = await possiblySerializeValueToDataref(original);
    const file = await possiblyDeserializeDatarefToFile(serialized);
    expect(file).toBeInstanceOf(File);
    expect(file!.type).toBe("text/plain");
  });

  it("returns File from serialized ArrayBuffer", async () => {
    const original = new Uint8Array([1, 2]).buffer;
    const serialized = await possiblySerializeValueToDataref(original);
    const file = await possiblyDeserializeDatarefToFile(serialized);
    expect(file).toBeInstanceOf(File);
    expect(file!.size).toBe(2);
  });

  it("returns File from serialized TypedArray", async () => {
    const original = new Uint8Array([1, 2, 3]);
    const serialized = await possiblySerializeValueToDataref(original);
    const file = await possiblyDeserializeDatarefToFile(serialized);
    expect(file).toBeInstanceOf(File);
  });

  it("returns undefined for non-serialized values", async () => {
    expect(await possiblyDeserializeDatarefToFile("hello")).toBeUndefined();
    expect(await possiblyDeserializeDatarefToFile(42)).toBeUndefined();
    expect(await possiblyDeserializeDatarefToFile(null)).toBeUndefined();
    expect(
      await possiblyDeserializeDatarefToFile({ foo: "bar" }),
    ).toBeUndefined();
  });
});

describe("valueToFile", () => {
  it("converts serialized data URL to File", async () => {
    const original = new Float32Array([1.0, 2.0]);
    const serialized = await possiblySerializeValueToDataref(original);
    const file = await valueToFile(serialized, "data.bin");
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("data.bin");
    expect(file.size).toBeGreaterThan(0);
  });

  it("converts plain string to File", async () => {
    const file = await valueToFile("hello world", "hello.txt");
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("hello.txt");
    expect(file.type).toBe("text/plain");
    const text = await file.text();
    expect(text).toBe("hello world");
  });

  it("converts object to JSON File", async () => {
    const obj = { key: "value" };
    const file = await valueToFile(obj, "data.json");
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("application/json");
    const text = await file.text();
    expect(JSON.parse(text)).toEqual(obj);
  });
});
