import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAdminAction(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listAdminAuditLog(options: {
  limit?: number;
  offset?: number;
  action?: string;
}) {
  const limit = Math.min(200, Math.max(1, options.limit ?? 50));
  const offset = Math.max(0, options.offset ?? 0);
  const where = options.action?.trim()
    ? { action: { contains: options.action.trim() } }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  const actorIds = [...new Set(items.map((row) => row.actorId))];
  const actors = actorIds.length
    ? await prisma.account.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      })
    : [];
  const actorById = new Map(actors.map((row) => [row.id, row.email]));

  return {
    total,
    items: items.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      actorEmail: actorById.get(row.actorId) || row.actorId,
    })),
  };
}
