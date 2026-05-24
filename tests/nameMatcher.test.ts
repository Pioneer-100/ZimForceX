import { describe, it, expect } from "vitest";
import { namesMatch } from "../frontend/src/lib/nameMatcher";

describe("Names Matcher Utility", () => {
  it("should match exact names ignoring casing", () => {
    expect(namesMatch("John Doe", "john doe")).toBe(true);
    expect(namesMatch("JOHN DOE", "John Doe")).toBe(true);
  });

  it("should match names with middle initials or extra spaces", () => {
    expect(namesMatch("John M. Doe", "John Doe")).toBe(true);
    expect(namesMatch("John   Doe", "John Doe")).toBe(true);
  });

  it("should match names with professional titles", () => {
    expect(namesMatch("Dr. John Doe", "John Doe")).toBe(true);
    expect(namesMatch("Professor Jane Smith", "Jane Smith")).toBe(true);
  });

  it("should match single-token names exactly", () => {
    expect(namesMatch("Alice", "alice")).toBe(true);
    expect(namesMatch("Bob", "Alice")).toBe(false);
  });

  it("should fail when only one token matches in a multi-token name", () => {
    expect(namesMatch("John Doe", "Johnathan Doe")).toBe(false);
    expect(namesMatch("Jane Smith", "John Smith")).toBe(false);
  });

  it("should fail on complete mismatches", () => {
    expect(namesMatch("John Doe", "Jane Smith")).toBe(false);
  });

  it("should fail on empty or null inputs", () => {
    expect(namesMatch("", "John Doe")).toBe(false);
    expect(namesMatch("John Doe", "")).toBe(false);
  });
});
