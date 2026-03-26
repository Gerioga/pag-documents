import { NextResponse } from "next/server";
import { SCRIPTS } from "@/scripts/definitions";

export async function GET() {
  return NextResponse.json({
    total: SCRIPTS.length,
    data: SCRIPTS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      docTypes: s.docTypes,
    })),
  });
}
