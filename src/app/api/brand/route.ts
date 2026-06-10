import { getCurrentUserId } from "@/server/auth";
import { getUserBrand, upsertUserBrand } from "@/server/brand-store";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const brand = await getUserBrand(userId);
    return Response.json({ brand });
  } catch {
    return Response.json({ brand: null });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const brand = await upsertUserBrand(userId, body);
    return Response.json({ brand });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update brand." }, { status: 400 });
  }
}
