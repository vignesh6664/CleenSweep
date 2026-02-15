import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create a user based on Kinde authentication data
   * This ensures users are automatically provisioned on first login
   */
  async findOrCreateUser(kindeId: string, email: string, name?: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: kindeId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: kindeId,
          email,
          name,
        },
      });
    }

    return user;
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
