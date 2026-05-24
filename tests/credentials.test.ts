import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyCertificate } from "../ai/services/verifier";

describe("AI Credential Verification Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test_key_123";
  });

  it("should successfully invoke the Gemini endpoint and parse the returned JSON schema", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: "Bachelor of Science in Computer Science",
                  issuing_organization: "University of Zimbabwe",
                  recipient_name: "Rolland Zumba",
                  date_issued: "2024-11-20",
                  is_authentic: true,
                  confidence_score: 0.95,
                  notes: "Document layout contains official crest and authentic signatures. High-contrast typography is consistent.",
                }),
              },
            ],
          },
        },
      ],
    };

    // Mock global fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const base64Data = "dGVzdF9kYXRh"; // "test_data" in base64
    const mimeType = "image/png";

    const result = await verifyCertificate(base64Data, mimeType);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("models/gemini-1.5-flash:generateContent?key=test_key_123"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    expect(result.title).toBe("Bachelor of Science in Computer Science");
    expect(result.issuing_organization).toBe("University of Zimbabwe");
    expect(result.recipient_name).toBe("Rolland Zumba");
    expect(result.is_authentic).toBe(true);
    expect(result.confidence_score).toBe(0.95);
    expect(result.notes).toContain("crest");
  });

  it("should throw an error when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(verifyCertificate("base64", "image/png")).rejects.toThrow(
      "Missing GEMINI_API_KEY"
    );
  });

  it("should handle HTTP errors gracefully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden Access",
    });
    global.fetch = fetchMock;

    await expect(verifyCertificate("base64", "image/png")).rejects.toThrow(
      "Gemini API error status 403: Forbidden Access"
    );
  });
});
