import { SgiReadOnlyMutableRestService } from './read-only-mutable.rest.service';
import { NGXLogger } from 'ngx-logger';
import { HttpClient } from '@angular/common/http';
import { SgiNoConversionConverter } from '@sgi/framework/core';

/**
 * Base service to consume REST endpoints of read only entites without transformation
 *
 * Contains the common operations.
 *
 * @template K type of ID
 * @template T type of return element
 */
export class SgiReadOnlyRestService<K extends number | string, T> extends SgiReadOnlyMutableRestService<K, T, T> {
  constructor(serviceName: string, logger: NGXLogger, endpointUrl: string, http: HttpClient) {
    super(serviceName, logger, endpointUrl, http, new SgiNoConversionConverter<T, T>());
  }
}