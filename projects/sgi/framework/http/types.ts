/**
 * Find options for a list of elements. Can be combined
 */
export interface SgiRestFindOptions {
  /**
   * To request a page
   */
  page?: SgiRestPageRequest;
  /**
   * To request a sort
   */
  sort?: SgiRestSort;
  /**
   * To request a group of filters
   */
  filters?: SgiRestFilter[];
}

/**
 * Page to request
 */
export interface SgiRestPageRequest {
  /**
   * The number of elements per page
   */
  size: number;
  /**
   * The page index
   */
  index: number;
}

/**
 * Sort to apply
 */
export interface SgiRestSort {
  /**
   * The field to sort on
   */
  field: string;
  /**
   * The direction of the sort
   */
  direction: SgiRestSortDirection;
}

/**
 * Sort direction
 */
export class SgiRestSortDirection {
  /** Ascending */
  public static readonly ASC = new SgiRestSortDirection('+');
  /** Descending */
  public static readonly DESC = new SgiRestSortDirection('-');

  private constructor(
    private value: string
  ) { }

  /**
   * Maps values of MatSorte direction.
   * @param sortDirection MatSorter direction
   */
  public static fromSortDirection(sortDirection: '' | 'asc' | 'desc'): SgiRestSortDirection {
    if (sortDirection === 'asc') {
      return SgiRestSortDirection.ASC;
    }
    if (sortDirection === 'desc') {
      return SgiRestSortDirection.DESC;
    }
    return undefined;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * Filter to apply
 */
export interface SgiRestFilter {
  /**
   * The entity field name
   */
  field: string;
  /**
   * The type of the filter
   */
  type: SgiRestFilterType;
  /**
   * The value to apply
   */
  value: string;
}


/**
 * Filter type
 */
export class SgiRestFilterType {

  private constructor(
    private value: string
  ) { }

  /** No filter */
  public static readonly NONE = new SgiRestFilterType(undefined);
  /** Filter by 'equals' operator */
  public static readonly EQUALS = new SgiRestFilterType(':');
  /** Filter by 'notEquals' operator */
  public static readonly NOT_EQUALS = new SgiRestFilterType('!:');
  /** Filter by 'like' operator */
  public static readonly LIKE = new SgiRestFilterType('~');
  /** Filter by 'notLike' operator */
  public static readonly NOT_LIKE = new SgiRestFilterType('!~');
  /** Filter by 'greather' operator */
  public static readonly GREATHER = new SgiRestFilterType('>');
  /** Filter by 'greatherOrEqual' operator */
  public static readonly GREATHER_OR_EQUAL = new SgiRestFilterType('>:');
  /** Filter by 'lower' operator */
  public static readonly LOWER = new SgiRestFilterType('<');
  /** Filter by 'lowerOrEqual' operator */
  public static readonly LOWER_OR_EQUAL = new SgiRestFilterType('<:');

  private reference = SgiRestFilterType;

  public toString(): string {
    return this.value;
  }
}

/**
 * Result of request for a list of elements
 */
export interface SgiRestListResult<T> {
  /**
   * Page information
   */
  page: SgiRestPage;
  /**
   * Total number of elements
   */
  total: number;
  /**
   * Returned elements
   */
  items: T[];
}

/**
 * Page information
 */
interface SgiRestPage {
  /**
   * The number of elements per page
   */
  size: number;
  /**
   * The page index
   */
  index: number;
  /**
   * Elements in the page
   */
  count: number;
  /**
   * Total number of pages
   */
  total: number;
}
