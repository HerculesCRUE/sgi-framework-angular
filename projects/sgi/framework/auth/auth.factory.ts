import { NGXLogger } from 'ngx-logger';
import { Router } from '@angular/router';
import { AuthKeycloakService } from './auth.keycloak.service';
import { PlatformLocation } from '@angular/common';
import { SgiAuthMode } from './auth.enum';
import { AuthInMemoryService } from './auth.inmemory.service';
import { SgiAuthService } from './auth.service';

/**
 * Factory for SgiAuthService. Buils the implementation based on configured SgiAuthMode
 *
 * @param logger The logger to use
 * @param router The router to use
 * @param platformLocation The platformLocation to use
 */
export function authFactory(mode: SgiAuthMode, logger: NGXLogger, router: Router, platformLocation: PlatformLocation): SgiAuthService {
  switch (mode) {
    case SgiAuthMode.Keycloak:
      return new AuthKeycloakService(logger, router, platformLocation);
    case SgiAuthMode.InMemory:
      return new AuthInMemoryService(logger, router);
  }
}
