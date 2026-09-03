import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStorage, KEYS, readJSON, writeJSON } from "../../src/lib/storage.js";

/* Мінімальний localStorage: тестам не потрібен цілий jsdom заради
   трьох методів, а поведінку на помилках так задавати простіше. */
function fakeLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get size() {
      return map.size;
    },
  };
}

let ls;
let store;

beforeEach(() => {
  ls = fakeLocalStorage();
  store = createStorage(() => ls);
});

describe("адаптер сховища", () => {
  it("тримає той самий async-інтерфейс, що й window.storage", async () => {
    expect(await store.get("k")).toBeNull();
    expect(await store.set("k", "v")).toBe(true);
    expect(await store.get("k")).toEqual({ key: "k", value: "v" });
    expect(await store.delete("k")).toBe(true);
    expect(await store.get("k")).toBeNull();
  });

  it("не глушить помилку запису", async () => {
    const failing = createStorage(() => ({
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => {},
    }));
    await expect(failing.set("k", "v")).rejects.toThrow();
  });

  it("падає зрозуміло, коли localStorage узагалі недоступний", async () => {
    const blocked = createStorage(() => {
      throw new Error("доступ заблоковано");
    });
    await expect(blocked.get("k")).rejects.toThrow("доступ заблоковано");
  });

  it("тримає незалежні ключі під спільним префіксом", () => {
    const keys = Object.values(KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(k.startsWith("grammar-diagnostic:")).toBe(true));
  });
});

describe("readJSON / writeJSON", () => {
  it("робить круг туди-назад", async () => {
    await writeJSON(KEYS.usage, { run: 3, used: { "0-A2-mc-1": 2 } }, store);
    expect(await readJSON(KEYS.usage, null, store)).toEqual({
      run: 3,
      used: { "0-A2-mc-1": 2 },
    });
  });

  it("на биті дані повертає fallback, а не валить додаток", async () => {
    await store.set(KEYS.progress, "{не json");
    expect(await readJSON(KEYS.progress, "запасне", store)).toBe("запасне");
  });

  it("на порожньому ключі повертає fallback", async () => {
    expect(await readJSON(KEYS.attempts, [], store)).toEqual([]);
  });

  it("а от помилку запису пропускає нагору", async () => {
    const failing = createStorage(() => ({
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error("повно");
      }),
      removeItem: () => {},
    }));
    await expect(writeJSON(KEYS.progress, { a: 1 }, failing)).rejects.toThrow("повно");
  });
});
