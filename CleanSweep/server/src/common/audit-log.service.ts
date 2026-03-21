import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    action: string;
    resourceId: string;
    accountId: string;
    userId: string;
    details?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        resourceId: data.resourceId,
        accountId: data.accountId,
        userId: data.userId,
        details: data.details || {},
      },
    });
  }

  async getLogs(userId: string, accountId?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        account: {
          select: { accountName: true },
        },
      },
    });
  }
}
