import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import * as Keycloak_ from 'keycloak-js';
export const Keycloak = Keycloak_;
import { NGXLogger } from 'ngx-logger';
import { map, tap } from 'rxjs/operators';
import { SgiAuthService, defaultAuthStatus, IAuthStatus } from './auth.service';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { SgiAuthConfig } from './auth.config';
import { extractModuleAccess } from './auth.authority';

interface IKeycloakToken extends Keycloak.KeycloakTokenParsed {
  preferred_username: string;
  investigador: boolean;
  user_ref_id: string;
}

/**
 * Keycloak authentication service implementation.
 */
@Injectable()
export class AuthKeycloakService extends SgiAuthService {

  private keycloak: Keycloak.KeycloakInstance;
  constructor(protected logger: NGXLogger, private router: Router, private platformLocation: PlatformLocation) {
    super(logger);
  }

  public init(authConfig: SgiAuthConfig): Observable<boolean> {
    this.logger.debug(`init() - START`);
    this.keycloak = Keycloak({
      clientId: authConfig.ssoClientId,
      realm: authConfig.ssoRealm,
      url: authConfig.ssoUrl
    });
    this.bindEvents();
    this.protectedResources = authConfig.protectedResources;
    let initOptions: Keycloak.KeycloakInitOptions;
    initOptions = {
      enableLogging: true
    };

    this.logger.debug(`initOptions: ${JSON.stringify(initOptions)}`);
    return from(this.keycloak.init(initOptions)).pipe(tap(() => this.logger.debug(`init() - END`)));
  }

  private bindEvents(): void {
    this.keycloak.onActionUpdate = (status) => {
      this.logger.debug(`onActionUpdate(${status}) - START`);
      this.logger.debug(`onActionUpdate(${status}) - END`);
    };
    this.keycloak.onAuthError = (errorData) => {
      this.logger.debug(`onAuthError(${JSON.stringify(errorData)}) - START`);
      this.logger.debug(`onAuthError(${JSON.stringify(errorData)}) - END`);
    };
    this.keycloak.onAuthLogout = () => {
      // Called automatically if cannot refresh token or after invoking logout or when session expires
      this.logger.debug(`onAuthLogout() - START`);
      this.publishAuthStatus(defaultAuthStatus);
      this.logger.debug(`onAuthLogout() - END`);
    };
    this.keycloak.onAuthRefreshError = () => {
      // Called when failed the refreshing token. If it is expired, onAuthLogout is called first
      this.logger.debug(`onAuthRefreshError() - START`);
      this.publishAuthStatus(defaultAuthStatus);
      this.logger.debug(`onAuthRefreshError() - END`);
    };
    this.keycloak.onAuthRefreshSuccess = () => {
      // Called when token is refreshed successfully.
      this.logger.debug(`onAuthRefreshSuccess() - START`);
      this.logger.debug(`onAuthRefreshSuccess() - END`);
    };
    this.keycloak.onAuthSuccess = () => {
      // Called after successfull login, or when a valid session exists during init
      this.logger.debug(`onAuthSuccess() - START`);
      this.publishAuthStatus(this.getAuthStatus());
      this.logger.debug(`onAuthSuccess() - END`);
    };
    this.keycloak.onReady = (authenticated) => {
      // Called after initialization of the adapter. If authenticated, onAuthSuccess is called first
      this.logger.debug(`onReady(${authenticated}) - START`);
      if (authenticated && this.keycloak.isTokenExpired(5)) {
        this.refreshToken().subscribe(
          () => this.publishAuthStatus(this.getAuthStatus()),
          () => this.publishAuthStatus(defaultAuthStatus)
        );
      }
      else if (!authenticated) {
        this.publishAuthStatus(defaultAuthStatus);
      }
      else {
        this.publishAuthStatus(this.getAuthStatus());
      }
      this.logger.debug(`onReady(${authenticated}) - END`);
    };
  }

  public login(redirectUri?: string): Observable<void> {
    this.logger.debug(`login(${redirectUri}) - START`);
    let loginOptions: Keycloak.KeycloakLoginOptions;
    if (redirectUri) {
      let baseUrl = `${this.platformLocation.protocol}//${this.platformLocation.hostname}`;
      if (this.platformLocation.port) {
        baseUrl += `:${this.platformLocation.port}`;
      }
      loginOptions = {
        redirectUri: baseUrl + redirectUri
      };
    }
    this.logger.debug(`loginOptions: ${JSON.stringify(loginOptions)}`);
    return from(this.keycloak.login(loginOptions)).pipe(tap(() => this.logger.debug(`login(${redirectUri}) - END`)));
  }

  public logout(redirectUri?: string): Observable<void> {
    this.logger.debug(`logout(${redirectUri}) - START`);
    let logoutOptios: Keycloak.KeycloakLogoutOptions;
    if (redirectUri) {
      let baseUrl = `${this.platformLocation.protocol}//${this.platformLocation.hostname}`;
      if (this.platformLocation.port) {
        baseUrl += `:${this.platformLocation.port}`;
      }
      logoutOptios = {
        redirectUri: baseUrl + redirectUri
      };
    }
    this.logger.debug(`logoutOptions: ${JSON.stringify(logoutOptios)}`);
    return from(this.keycloak.logout(logoutOptios)).pipe(tap(() => this.logger.debug(`logout(${redirectUri}) - END`)));
  }

  private get decodedToken(): IKeycloakToken {
    return this.keycloak.tokenParsed as IKeycloakToken;
  }

  private getAuthStatus(): IAuthStatus {
    const token: IKeycloakToken = this.decodedToken;
    return {
      isInvestigador: token.investigador,
      isAuthenticated: this.keycloak.authenticated,
      userRefId: token.user_ref_id,
      authorities: token.realm_access?.roles ? token.realm_access.roles : [],
      modules: token.realm_access?.roles ? extractModuleAccess(token.realm_access?.roles) : []
    };
  }

  private refreshToken(): Observable<boolean> {
    this.logger.debug(`refreshToken() - START`);
    return from(this.keycloak.updateToken(5)).pipe(tap(() => this.logger.debug(`refreshToken() - END`)));
  }

  public getToken(): Observable<string> {
    this.logger.debug(`getToken() - START`);
    let expired: boolean;
    try {
      expired = this.keycloak.isTokenExpired(5);
    }
    catch (e) {
      return throwError(e);
    }
    if (expired) {
      this.logger.debug('token expired -> refreshing');
      return this.refreshToken().pipe(
        map(() => this.keycloak.token),
        tap(() => this.logger.debug(`getToken() - END`))
      );
    }
    return of(this.keycloak.token).pipe(tap(() => this.logger.debug(`getToken() - END`)));
  }

  private publishAuthStatus(status: IAuthStatus) {
    this.logger.debug(`publishAuthStatus(${JSON.stringify(status)}) - START`);
    this.authStatus$.next(status);
    this.logger.debug(`publishAuthStatus(${JSON.stringify(status)}) - END`);
  }
}
