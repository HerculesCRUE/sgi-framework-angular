import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { SgiConverter } from '@sgi/framework/core';
import { SgiReadOnlyMutableRestService } from './read-only-mutable.rest.service';


/**
 * Base service to consume REST endpoints with support for transformation
 *
 * Contains the common operations.
 * 
 * @template K type of ID
 * @template S type of rest response
 * @template T type of return element
 */
export abstract class SgiMutableRestService<K extends number | string, S, T> extends SgiReadOnlyMutableRestService<K, S, T> {

  /**
   *
   * @param serviceName The service name to appear in log
   * @param logger The logger to use
   * @param endpointRelativePath The endpoint relative URL path
   * @param http The HttpClient to use
   * @param converter The converter to use in transformations between rest response and returned type
   */
  constructor(serviceName: string, logger: NGXLogger, endpointUrl: string, http: HttpClient, converter: SgiConverter<S, T>) {
    super(serviceName, logger, endpointUrl, http, converter);
  }

  /**
   * Create the element and return the persisted value
   *
   * @param element The element to create
   */
  public create(element: T): Observable<T> {
    this.logger.debug(this.serviceName, `create(${JSON.stringify(element)})`, '-', 'START');
    return this.http.post<S>(this.endpointUrl, this.converter.fromTarget(element)).pipe(
      // TODO: Explore the use a global HttpInterceptor with or without a custom error
      catchError((error: HttpErrorResponse) => {
        // Log the error
        this.logger.error(this.serviceName, `create(${JSON.stringify(element)}):`, error);
        // Pass the error to subscribers. Anyway they would decide what to do with the error.
        return throwError(error);
      }),
      map(response => {
        this.logger.debug(this.serviceName, `create(${JSON.stringify(element)})`, '-', 'END');
        return this.converter.toTarget(response);
      })
    );
  }

  /**
   * Update an element and return the persisted value
   *
   * @param id The ID of the element
   * @param element The element to update
   */
  public update(id: K, element: T): Observable<T> {
    this.logger.debug(this.serviceName, `update(${id}, ${JSON.stringify(element)})`, '-', 'START');
    return this.http.put<S>(`${this.endpointUrl}/${id}`, this.converter.fromTarget(element)).pipe(
      // TODO: Explore the use a global HttpInterceptor with or without a custom error
      catchError((error: HttpErrorResponse) => {
        // Log the error
        this.logger.error(this.serviceName, `update(${id}, ${JSON.stringify(element)}):`, error);
        // Pass the error to subscribers. Anyway they would decide what to do with the error.
        return throwError(error);
      }),
      map(response => {
        this.logger.debug(this.serviceName, `update(${id}, ${JSON.stringify(element)})`, '-', 'END');
        return this.converter.toTarget(response);
      })
    );
  }

  /**
   * Delete an element by their ID
   *
   * @param id The ID of the element
   */
  public deleteById(id: K) {
    this.logger.debug(this.serviceName, `deleteById(${id})`, '-', 'START');
    return this.http.delete<S>(`${this.endpointUrl}/${id}`).pipe(
      // TODO: Explore the use a global HttpInterceptor with or without a custom error
      catchError((error: HttpErrorResponse) => {
        // Log the error
        this.logger.error(this.serviceName, `deleteById(${id}):`, error);
        // Pass the error to subscribers. Anyway they would decide what to do with the error.
        return throwError(error);
      }),
      map(() => {
        this.logger.debug(this.serviceName, `deleteById(${id})`, '-', 'END');
      })
    );
  }

  /**
   * Delete all elements
   */
  public deleteAll() {
    this.logger.debug(this.serviceName, `deleteAll()`, '-', 'START');
    return this.http.delete<S>(`${this.endpointUrl}`).pipe(
      // TODO: Explore the use a global HttpInterceptor with or without a custom error
      catchError((error: HttpErrorResponse) => {
        // Log the error
        this.logger.error(this.serviceName, `deleteAll():`, error);
        // Pass the error to subscribers. Anyway they would decide what to do with the error.
        return throwError(error);
      }),
      map(() => {
        this.logger.debug(this.serviceName, `deleteAll()`, '-', 'END');
      })
    );
  }
}
