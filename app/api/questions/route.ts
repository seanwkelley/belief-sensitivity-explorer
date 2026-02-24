import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET() {
  try {
    const summaryPath = path.join(process.cwd(), "public/data/summary.json");
    const raw = await fs.readFile(summaryPath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No pre-computed data found. Run prepare-data first." },
      { status: 404 }
    );
  }
}
