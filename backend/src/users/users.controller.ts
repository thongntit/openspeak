import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { CurrentUser } from './current-user.decorator';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('bootstrap')
  bootstrap(@CurrentUser() principal: AuthenticatedPrincipal) {
    return principal;
  }

  @Get('summary')
  summary(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.users.getProfileSummary(principal.id);
  }
}
