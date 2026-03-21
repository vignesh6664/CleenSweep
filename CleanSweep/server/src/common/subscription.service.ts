import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async isPro(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    return user?.subscriptionTier === 'PRO';
  }

  async setTier(userId: string, tier: 'FREE' | 'PRO') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    });
  }
}
