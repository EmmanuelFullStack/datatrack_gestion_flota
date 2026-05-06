import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundError('User', userId);
    return user;
  }
}
