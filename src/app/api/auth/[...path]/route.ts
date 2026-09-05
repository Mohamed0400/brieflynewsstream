import { neonAuth } from "@/lib/neon-auth/server";

export const { GET, POST } = neonAuth.handler();
