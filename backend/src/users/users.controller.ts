import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { CurrentUser } from './current-user.decorator';

@Controller('me')
export class UsersController {
  @Get('bootstrap')
  bootstrap(@CurrentUser() principal: AuthenticatedPrincipal) {
    return principal;
  }
}
