import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyCertificate } from "@/ai/services/verifier";
import { namesMatch } from "@/lib/nameMatcher";

// Helper to determine mime type from URL or file name
function getMimeType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}


export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get("Authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    let user: any = null;
    if (token) {
      const { data: { user: authedUser } } = await supabase.auth.getUser(token);
      user = authedUser;
    } else {
      // Fallback to cookies/session (for standard client API calls)
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      user = sessionUser;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // 2. Parse request payload
    const { credentialId } = await req.json();

    if (!credentialId) {
      return NextResponse.json({ error: "Missing credentialId parameter." }, { status: 400 });
    }

    // 3. Fetch credential and user profile
    const { data: credential, error: credError } = await supabase
      .from("credentials")
      .select("*")
      .eq("id", credentialId)
      .eq("user_id", user.id)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: "Credential record not found." }, { status: 404 });
    }

    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (!credential.document_url) {
      return NextResponse.json({ error: "No document attached to this credential." }, { status: 400 });
    }

    // 4. Fetch the document file and convert to base64
    const fileRes = await fetch(credential.document_url);
    if (!fileRes.ok) {
      throw new Error(`Failed to download certificate from storage: ${fileRes.statusText}`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = getMimeType(credential.document_url);

    // 5. Call Gemini AI Verifier
    const aiResult = await verifyCertificate(base64Data, mimeType);

    // 6. Cross-reference name on certificate with candidate name
    const candidateName = profile.full_name || "";
    const certRecipientName = aiResult.recipient_name || "";
    const nameIsMatch = namesMatch(candidateName, certRecipientName);

    // 7. Determine final verification status
    let finalVerificationStatus: "valid" | "invalid" | "needs_review" = "needs_review";
    let credentialStatus: "verified" | "rejected" | "pending" = "pending";

    if (aiResult.is_authentic && nameIsMatch && aiResult.confidence_score >= 0.8) {
      finalVerificationStatus = "valid";
      credentialStatus = "verified";
    } else if (!aiResult.is_authentic || !nameIsMatch) {
      finalVerificationStatus = "invalid";
      credentialStatus = "rejected";
    }

    const verificationNotes = `${aiResult.notes}. Name Matching Checked: ${
      nameIsMatch ? "MATCHED" : `MISMATCH (Expected: "${candidateName}", Got: "${certRecipientName}")`
    }`;

    // 8. Write verification results to public.verifications
    const { error: insertError } = await supabase.from("verifications").insert({
      credential_id: credentialId,
      verification_status: finalVerificationStatus,
      ai_confidence_score: aiResult.confidence_score,
      verification_details: {
        extracted_title: aiResult.title,
        extracted_organization: aiResult.issuing_organization,
        extracted_recipient: aiResult.recipient_name,
        extracted_date: aiResult.date_issued,
        name_matched: nameIsMatch,
        notes: aiResult.notes,
      },
      verified_by: "ai_service",
    });

    if (insertError) throw insertError;

    // 9. Update the credential row status
    const { error: updateError } = await supabase
      .from("credentials")
      .update({
        verification_status: credentialStatus,
        verified_at: new Date(),
        verification_notes: verificationNotes,
      })
      .eq("id", credentialId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      status: credentialStatus,
      confidenceScore: aiResult.confidence_score,
      extractedTitle: aiResult.title,
      extractedIssuer: aiResult.issuing_organization,
      recipient: certRecipientName,
      nameMatched: nameIsMatch,
      notes: verificationNotes,
    });
  } catch (err: any) {
    console.error("API /api/verify handler error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
