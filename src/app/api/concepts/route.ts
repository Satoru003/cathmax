import { getConcepts } from "@/lib/concepts";
import { Category } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = parseInt(searchParams.get("cursor") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
  const category = searchParams.get("category") as Category | undefined;

  const result = getConcepts(cursor, limit, category || undefined);

  return NextResponse.json(result);
}
