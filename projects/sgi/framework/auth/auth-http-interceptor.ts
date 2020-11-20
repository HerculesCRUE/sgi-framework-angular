import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpEventType,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, EMPTY, } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { SgiAuthService } from './auth.service';
import { NGXLogger } from 'ngx-logger';

/**
 * Interceptor that injects authorization header with the JWT token.
 *
 * If the token cannot be obtained from the AuthService, and the user isn't authenticated or the session is expired,
 * then the request is aborted and the user is redirected to login page
 */
@Injectable()
export class SgiAuthHttpInterceptor implements HttpInterceptor {

  constructor(private authService: SgiAuthService, private router: Router, private logger: NGXLogger) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.logger.debug(`${SgiAuthHttpInterceptor.name} Intercept ${req.method} to ${req.url}`);
    if (this.authService.isProtectedRequest(req)) {
      this.logger.debug(`${SgiAuthHttpInterceptor.name}: Protected resource, injecting token`);
      return this.authService.getToken().pipe(
        catchError((error) => {
          this.logger.warn(`${SgiAuthHttpInterceptor.name}: ${JSON.stringify(error)}`);
          return undefined as string;
        }),
        switchMap((token) => {
          if (token) {
            const authRequest = req.clone({ setHeaders: { authorization: `Bearer ${token}` } });
            this.logger.debug(`${SgiAuthHttpInterceptor.name}: Token injected`);
            return next.handle(authRequest);
          }
          else {
            return next.handle(req);
          }
        })
      );
    }
    else {
      this.logger.debug(`${SgiAuthHttpInterceptor.name}: Ignoring request, isn't a protected resource`);
      return next.handle(req);
    }
  }
}
