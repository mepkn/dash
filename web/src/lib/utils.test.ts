import { describe, expect, it } from "vitest";
import { formatUptime, groupBy, hostname, iconCandidates, normalizeUrl, primaryLink } from "./utils";

describe("normalizeUrl", () => {
  it("adds https and strips trailing slashes", () => {
    expect(normalizeUrl(" picki.pknspace.com/ ")).toBe("https://picki.pknspace.com");
    expect(normalizeUrl("http://x.dev")).toBe("http://x.dev");
  });
});

describe("hostname", () => {
  it("falls back to the input for bad URLs", () => {
    expect(hostname("https://a.b.com/x")).toBe("a.b.com");
    expect(hostname("nope")).toBe("nope");
  });
});

describe("formatUptime", () => {
  it("picks the two largest units", () => {
    expect(formatUptime(59)).toBe("0m");
    expect(formatUptime(3 * 3600 + 120)).toBe("3h 2m");
    expect(formatUptime(23 * 86400 + 5 * 3600)).toBe("23d 5h");
  });
});

describe("groupBy", () => {
  it("keeps first-seen group order", () => {
    const out = groupBy(["b1", "a1", "b2"], (s) => s[0]);
    expect(out).toEqual([["b", ["b1", "b2"]], ["a", ["a1"]]]);
  });
});

describe("iconCandidates", () => {
  it("tries the custom icon, then svg and ico favicons", () => {
    expect(iconCandidates("https://a.com/x", "https://cdn/i.png")).toEqual([
      "https://cdn/i.png",
      "https://a.com/favicon.svg",
      "https://a.com/favicon.ico",
    ]);
    expect(iconCandidates("nope")).toEqual([]);
    expect(iconCandidates("https://a.com", "https://cdn/i.png", false)).toEqual(["https://cdn/i.png"]);
  });
});

describe("primaryLink", () => {
  it("prefers web, then android, then desktop", () => {
    expect(primaryLink({ web: "w", android: "a" })).toBe("w");
    expect(primaryLink({ android: "a", desktop: "d" })).toBe("a");
    expect(primaryLink({ desktop: "d" })).toBe("d");
  });
});
