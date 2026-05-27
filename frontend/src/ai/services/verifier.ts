import { Buffer } from "buffer";

export interface VerificationResult {
  title: string;
  issuing_organization: string;
  recipient_name: string;
  date_issued: string; // ISO date or text representation
  is_authentic: boolean;
  confidence_score: number; // between 0.0 and 1.0
  notes: string;
}

/**
 * Invokes the Gemini API to analyze a certificate file (provided as base64 data)
 * and returns the structured extraction and validation metrics.
 */
export async function verifyCertificate(
  fileBase64: string,
  mimeType: string
): Promise<VerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  // Define the endpoint. We use gemini-1.5-flash as it is extremely fast and perfect for OCR + vision checks.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
    You are an expert AI credential verifier. 
    Analyze the attached qualification document (image or PDF) and extract its details.
    Evaluate its authenticity based on typical visual factors: layout structure, consistent typography, issuing authority emblems, signature blocks, and lack of amateur edits or copy-paste overlays.
    
    Extract the following details precisely in JSON format matching the schema:
    1. title: The name of the credential (e.g., "Bachelor of Science in Computer Science", "Certificate of Completion in React").
    2. issuing_organization: Who issued the credential (e.g., "University of Zimbabwe", "Coursera").
    3. recipient_name: The full name of the recipient who earned the credential.
    4. date_issued: The date the credential was awarded (convert to YYYY-MM-DD format if possible, otherwise use original string).
    5. is_authentic: True if the document looks genuine and contains no obvious edits, fraud markers, or copy-paste text overlaps. False otherwise.
    6. confidence_score: A decimal number between 0.0 (unverifiable/fake) and 1.0 (highly confident authenticity).
    7. notes: A summary of your findings, visual layout checks, or reasons for your authenticity assessment.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          issuing_organization: { type: "STRING" },
          recipient_name: { type: "STRING" },
          date_issued: { type: "STRING" },
          is_authentic: { type: "BOOLEAN" },
          confidence_score: { type: "NUMBER" },
          notes: { type: "STRING" },
        },
        required: [
          "title",
          "issuing_organization",
          "recipient_name",
          "date_issued",
          "is_authentic",
          "confidence_score",
          "notes",
        ],
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error status ${res.status}: ${errText}`);
    }

    const resJson = await res.json();
    const responseContentText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseContentText) {
      throw new Error("Invalid response received from Gemini API.");
    }

    const result: VerificationResult = JSON.parse(responseContentText.trim());
    return result;
  } catch (err: any) {
    console.error("Gemini Verifier Service failed:", err.message);
    throw err;
  }
}
