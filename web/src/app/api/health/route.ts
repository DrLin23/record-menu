// Health check (spec §6). Reports that the app is up and how long this
// server process has been running. The age of the last good sync is added
// in step 7 once the DB exists.
//
// A health check must reflect live state, so opt it out of all caching.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
  });
}
