import { TestBed } from '@angular/core/testing';

import { AuthKeycloakService } from './auth.keycloak.service';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Routes } from '@angular/router';

describe('AuthKeycloakService', () => {
  const routes: Routes = [];
  let service: AuthKeycloakService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthKeycloakService],
      imports: [LoggerTestingModule, RouterTestingModule.withRoutes(routes)]
    });
    service = TestBed.inject(AuthKeycloakService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
