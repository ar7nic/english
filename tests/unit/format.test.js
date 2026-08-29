import { describe, expect, it } from "vitest";
import { formatDate, pct, plural, status } from "../../src/lib/format.js";

describe("plural", () => {
  const forms = ["спроба", "спроби", "спроб"];
  it("відмінює за українськими правилами", () => {
    expect(plural(1, forms)).toBe("спроба");
    expect(plural(2, forms)).toBe("спроби");
    expect(plural(4, forms)).toBe("спроби");
    expect(plural(5, forms)).toBe("спроб");
    expect(plural(11, forms)).toBe("спроб"); // не «спроба»
    expect(plural(12, forms)).toBe("спроб");
    expect(plural(21, forms)).toBe("спроба");
    expect(plural(22, forms)).toBe("спроби");
    expect(plural(0, forms)).toBe("спроб");
  });
});

describe("status", () => {
  it("ділить результат на три зони", () => {
    expect(status(1).t).toBe("Впевнено");
    expect(status(0.75).t).toBe("Впевнено");
    expect(status(0.74).t).toBe("Повторити");
    expect(status(0.5).t).toBe("Повторити");
    expect(status(0.49).t).toBe("Слабке місце");
    expect(status(0).t).toBe("Слабке місце");
  });
});

describe("pct і formatDate", () => {
  it("округлює відсотки", () => {
    expect(pct(0.755)).toBe(76);
    expect(pct(0)).toBe(0);
    expect(pct(1)).toBe(100);
  });

  it("на битій даті не падає", () => {
    expect(formatDate("не дата")).toBe("—");
    expect(formatDate("2026-08-29T10:00:00Z")).toMatch(/2026/);
  });
});
