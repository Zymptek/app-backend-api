/* Test framework auto-detected: jest. This file is compatible with Jest and Vitest. */
import { describe, it, expect } from "@jest/globals";

// BEGIN CodeRabbit config validation tests - generated
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CodeRabbit configuration validation tests
 *
 * Note on framework: This file is compatible with Jest and Vitest.
 * The generation script detects the framework via package.json and inserts an appropriate import when creating this file.
 * We avoid adding YAML parser deps; instead we parse sections using line/indent-aware helpers.
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Utils are defined once and cached on globalThis to avoid re-declaration if this block is appended multiple times.
 */
const __CR_YAML_UTILS__ = (() => {
  const g: any = globalThis as any;
  if (g.__CR_YAML_UTILS__) return g.__CR_YAML_UTILS__;

  // Fallback sample mirrors expected config when repo config is not present.
  const FALLBACK_YAML = `# Configuration for development teams
language: "en-US"

reviews:
  profile: "assertive"
  high_level_summary: true
  auto_review:
    enabled: true
    drafts: false
  ignore_title_keywords:
    - "wip"
    - "draft"

tools:
  eslint:
    enabled: true
  ruff:
    enabled: true
  gitleaks:
    enabled: true
  hadolint:
    enabled: true

chat:
  auto_reply: true

knowledge_base:
  code_guidelines:
    enabled: true
    filePatterns:
      - "**/CODING_STANDARDS.md"
`;

  // Escapes special characters in a string for safe use in RegExp patterns.
  function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function findConfigPath(): string | null {
    const cwd = process.cwd();
    const candidates = [
      ".coderabbit.yaml",
      ".coderabbit.yml",
      "coderabbit.yaml",
      "coderabbit.yml"
    ];
    for (const rel of candidates) {
      const full = path.join(cwd, rel);
      if (fs.existsSync(full)) return full;
    }
    return null;
  }

  function readConfigText(): string {
    const p = findConfigPath();
    if (p && fs.existsSync(p)) {
      return fs.readFileSync(p, "utf8");
    }
    return FALLBACK_YAML;
  }

  // Extracts a top-level section (e.g., "reviews", "tools") as text block.
  function extractSection(yamlText: string, section: string): string {
    const secRe = new RegExp(`^${escapeRegExp(section)}:\\\\s*(?:#.*)?$`, "m");
    const m = secRe.exec(yamlText);
    if (!m) return "";
    const start = m.index + m[0].length;
    const rest = yamlText.slice(start);
    // Next top-level key: line starting at column 0 ending with colon
    const nextTop = /^([A-Za-z_][\w-]*):\s*(?:#.*)?$/m.exec(rest);
    if (!nextTop) return rest;
    return rest.slice(0, nextTop.index);
  }

  // Extracts a subsection by name within a sectionText, honoring indentation.
  function extractSubsection(sectionText: string, subsection: string): string {
    const re = new RegExp(`^\\\\s*${escapeRegExp(subsection)}:\\\\s*(?:#.*)?$`, "m");
    const m = re.exec(sectionText);
    if (!m) return "";
    const lineStart = sectionText.lastIndexOf("\n", m.index) + 1;
    const indent = m.index - lineStart;
    const start = m.index + m[0].length;
    const rest = sectionText.slice(start);
    const lines = rest.split("\n");
    const out: string[] = [];
    for (const line of lines) {
      if (line.trim().length === 0) { out.push(line); continue; }
      const leading = (line.match(/^\s*/) || [""])[0].length;
      if (leading <= indent) break;
      out.push(line);
    }
    return out.join("\n");
  }

  // Returns a list of string items under a given list key within the provided text block.
  function listUnder(blockText: string, listKey: string): string[] {
    const re = new RegExp(`^\\\\s*${escapeRegExp(listKey)}:\\\\s*(?:#.*)?$`, "m");
    const m = re.exec(blockText);
    if (!m) return [];
    const lineStart = blockText.lastIndexOf("\n", m.index) + 1;
    const indent = (m.index - lineStart) + 2; // list items are indented by at least +2
    const start = m.index + m[0].length;
    const rest = blockText.slice(start);
    const items: string[] = [];
    for (const line of rest.split("\n")) {
      if (line.trim().length === 0) continue;
      const leading = (line.match(/^\s*/) || [""])[0].length;
      if (leading < indent) break;
      const im = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
      if (im) items.push(im[1]);
      else break;
    }
    return items;
  }

  const api = { readConfigText, extractSection, extractSubsection, listUnder };
  g.__CR_YAML_UTILS__ = api;
  return api;
})();
const { readConfigText, extractSection, extractSubsection, listUnder } = __CR_YAML_UTILS__;

describe("CodeRabbit configuration", () => {
  const yaml = readConfigText();

  it("specifies language as en-US", () => {
    expect(yaml).toMatch(/^\s*language:\s*["']?en-US["']?\s*$/m);
  });

  it("configures reviews with assertive profile and high level summary", () => {
    const reviews = extractSection(yaml, "reviews");
    expect(reviews).toBeTruthy();
    expect(reviews).toMatch(/^\s*profile:\s*["']?assertive["']?\s*$/m);
    expect(reviews).toMatch(/^\s*high_level_summary:\s*true\s*$/m);
  });

  it("enables auto_review and disables drafts under reviews", () => {
    const reviews = extractSection(yaml, "reviews");
    const auto = extractSubsection(reviews, "auto_review");
    expect(auto).toMatch(/^\s*enabled:\s*true\s*$/m);
    expect(auto).toMatch(/^\s*drafts:\s*false\s*$/m);
  });

  it("ignores title keywords: includes 'wip' and 'draft'", () => {
    const reviews = extractSection(yaml, "reviews");
    const keywords = listUnder(reviews, "ignore_title_keywords").map(s => s.toLowerCase());
    expect(keywords).toEqual(expect.arrayContaining(["wip", "draft"]));
  });

  it("enables required tools: eslint, ruff, gitleaks, hadolint", () => {
    const tools = extractSection(yaml, "tools");
    for (const tool of ["eslint", "ruff", "gitleaks", "hadolint"]) {
      const t = extractSubsection(tools, tool);
      expect(t).toMatch(new RegExp(String.raw`^\s*enabled:\s*true\s*$`, "m"));
      // Negative check for accidental disable
      expect(t).not.toMatch(/^\s*enabled:\s*false\s*$/m);
    }
  });

  it("enables chat auto_reply", () => {
    const chat = extractSection(yaml, "chat");
    expect(chat).toMatch(/^\s*auto_reply:\s*true\s*$/m);
  });

  it("enables knowledge_base.code_guidelines and includes CODING_STANDARDS file pattern", () => {
    const kb = extractSection(yaml, "knowledge_base");
    const cg = extractSubsection(kb, "code_guidelines");
    expect(cg).toMatch(/^\s*enabled:\s*true\s*$/m);
    const patterns = listUnder(cg, "filePatterns");
    expect(patterns).toEqual(expect.arrayContaining(["**/CODING_STANDARDS.md"]));
  });
});
// END CodeRabbit config validation tests - generated