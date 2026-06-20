import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { UserRole } from "@/lib/db"

type Handler = (
  req: Request,
  ctx: { params: Promise<Record<string, string>>; session: { user: { id: string; role: UserRole; name: string; email: string } } }
) => Promise<Response>

export function withAuth(handler: Handler, allowedRoles?: UserRole[]) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return handler(req, { ...ctx, session: session as { user: { id: string; role: UserRole; name: string; email: string } } })
  }
}
