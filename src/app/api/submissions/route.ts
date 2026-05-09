import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

interface SubmissionPayload {
  submitterEmail?: unknown;
  submitterName?: unknown;
  proposedSlug?: unknown;
  proposedName?: unknown;
  manifest?: unknown;
}

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as SubmissionPayload;

  const submitterEmail = isString(body.submitterEmail)
    ? body.submitterEmail.trim().toLowerCase()
    : "";
  const submitterName = isString(body.submitterName)
    ? body.submitterName.trim()
    : null;
  const proposedSlug = isString(body.proposedSlug)
    ? body.proposedSlug.trim().toLowerCase()
    : "";
  const proposedName = isString(body.proposedName)
    ? body.proposedName.trim()
    : "";
  const manifest =
    body.manifest && typeof body.manifest === "object"
      ? (body.manifest as Record<string, unknown>)
      : null;

  if (!submitterEmail || !proposedSlug || !proposedName || !manifest) {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(proposedSlug)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_SLUG" },
      { status: 400 }
    );
  }

  const inserted = await db
    .insert(schema.toolSubmissions)
    .values({
      submitterEmail,
      submitterName,
      proposedSlug,
      proposedName,
      manifest,
    })
    .returning();

  return NextResponse.json({ ok: true, id: inserted[0].id });
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}
