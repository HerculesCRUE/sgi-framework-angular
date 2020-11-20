import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivate } from '@angular/router';
import { SgiAuthService } from './auth.service';
import { map, catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { hasAuthorityForAnyUO, hasAnyAuthorityForAnyUO, hasAuthority, hasAnyAuthority } from './auth.authority';
import { NGXLogger } from 'ngx-logger';
import { SgiAuthRouteData } from './auth.route';



enum GuardMode {
  /** Validates that the user has the authority */
  hasAuthority = 1,
  /** Validates that the user has at least one of the authorities */
  hasAnyAuthority = 2,
  /** Validates that the user has the authority, ignoring the UO suffix */
  hasAuthorityForAnyUO = 3,
  /** Validates that the user hast at least one of the authorities, ignoring the UO suffix */
  hasAnyAuthorityForAnyUO = 4
}

/**
 * Authentication and authorization guard to protect routes.
 *
 * If the user isn't authenticated, the will be redirected to login page configured in AuthService.
 * After a successfully login, they will be returned to the requested route and the additional checks will be performed.
 *
 * If the user is authenticated, then the additonal authorization checks defined in the route data are performed. 
 *
 * {@see AuthRouteData}
 */
@Injectable({
  providedIn: 'root'
})
export class SgiAuthGuard implements CanActivate {
  constructor(protected router: Router, protected authService: SgiAuthService, protected logger: NGXLogger) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {

    this.logger.debug(`canActivate(${route.toString()}) - START`);
    if (!this.authService.isAuthenticated()) {
      this.logger.warn(`not logged in`);
      // Because login do a redict an capture the current url, we need to provide the route target url.
      // When the auth succes, the user is returned to target url and then authorizations are checked.
      return this.authService.login(state.url).pipe(
        catchError(async (error) => {
          this.logger.error(error);
          return false;
        }),
        map((error) => {
          // Error calling login
          let success: boolean;
          if (typeof error === 'boolean') {
            this.logger.debug('loggin failed');
            success = false;
          }
          else {
            // This cannot happend because login do a change of url
            this.logger.debug('logging success');
            success = true;
          }
          this.logger.debug(`canActivate(${route.toString()}) - END`);
          return success;
        })
      );
    }

    let result: Observable<boolean>;
    try {
      result = this.checkAuthority(route);
    } catch (error) {
      this.logger.error(error);
      result = of(false);
    }
    // TODO: Check what to do when the user types a url and they don't have access to the requested route.
    //  - Redirect to /?
    //  - Redirect to a failsafe configured route in routeData?
    //  - Do nothing? (It's what currently happend)
    return result.pipe(
      tap(() => this.logger.debug(`canActivate(${route.toString()}) - END`))
    );

  }

  private checkAuthority(route: ActivatedRouteSnapshot): Observable<boolean> {
    const data = route.routeConfig.data as SgiAuthRouteData;
    if (!data) {
      // No route data
      return of(true);
    }
    let argsCount = 0;
    let guardMode: GuardMode;
    if (data.hasAuthority) {
      argsCount++;
      guardMode = GuardMode.hasAuthority;
    }
    if (data.hasAuthorityForAnyUO) {
      argsCount++;
      guardMode = GuardMode.hasAuthorityForAnyUO;
    }
    if (data.hasAnyAuthority) {
      argsCount++;
      guardMode = GuardMode.hasAnyAuthority;
    }
    if (data.hasAnyAuthorityForAnyUO) {
      argsCount++;
      guardMode = GuardMode.hasAnyAuthorityForAnyUO;
    }
    if (argsCount > 1) {
      throw Error('Mixing authority validations isn\'t supported');
    }
    switch (guardMode) {
      case GuardMode.hasAuthority:
        this.validateAuthority(data.hasAuthority);
        return of(this.authService.hasAuthority(data.hasAuthority));
      case GuardMode.hasAnyAuthority:
        this.validateAuthorities(data.hasAnyAuthority);
        return of(this.authService.hasAnyAuthority(data.hasAnyAuthority));
      case GuardMode.hasAuthorityForAnyUO:
        this.validateAuthority(data.hasAuthorityForAnyUO, false);
        return of(this.authService.hasAuthorityForAnyUO(data.hasAuthorityForAnyUO));
      case GuardMode.hasAnyAuthorityForAnyUO:
        this.validateAuthorities(data.hasAnyAuthorityForAnyUO, false);
        return of(this.authService.hasAnyAuthorityForAnyUO(data.hasAnyAuthorityForAnyUO));
      default:
        return of(true);
    }
  }

  private getResolvedUrl(route?: ActivatedRouteSnapshot): string {
    if (!route) {
      return '';
    }

    return route.pathFromRoot
      .map((r) => r.url.map((segment) => segment.toString()).join('/'))
      .join('/')
      .replace('//', '/');
  }

  private validateAuthority(authority: string, allowUO: boolean = true): void {
    if (!authority || typeof authority !== 'string' || authority.trim() === '') {
      throw Error('Must provide an authority');
    }
    if (!allowUO && authority.indexOf('_') >= 0) {
      throw Error('Authority cannot contain an underscore');
    }
  }

  private validateAuthorities(authorities: string[], allowUO: boolean = true): void {
    if (!authorities || authorities instanceof Array === false || authorities.length === 0) {
      throw Error('Must provide an array of authorities');
    }
    authorities.forEach((authority) => {
      this.validateAuthority(authority, allowUO);
    });
  }
}

