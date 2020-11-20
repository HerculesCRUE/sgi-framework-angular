import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { SgiReadOnlyRestService } from './read-only-rest.service';
import { NGXLogger } from 'ngx-logger';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SgiRestFindOptions, SgiRestSortDirection, SgiRestFilterType } from './types';

const fakeEndpoint = 'http://localhost:8080/fake';

interface DummyData {
  id: number;
  name: string;
  surname: string;
  age: number;
}

class FakeService extends SgiReadOnlyRestService<number, DummyData> {
  constructor(logger: NGXLogger, http: HttpClient) {
    super(FakeService.name, logger, fakeEndpoint, http);
  }
}

describe('SgiReadOnlyRestService', () => {

  // existing entities
  const dummyEntityList: DummyData[] = [
    { id: 1, name: 'George', surname: 'Michael', age: 51 },
    { id: 2, name: 'Janet', surname: 'Jackson', age: 48 },
    { id: 3, name: 'Emma', surname: 'Watson', age: 28 },
  ];
  // Not Found response
  const NOT_FOUND = {
    status: 404,
    statusText: 'Not Found'
  };


  let service: FakeService;
  let httpMock: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LoggerTestingModule]
    });
    service = new FakeService(TestBed.inject(NGXLogger), TestBed.inject(HttpClient));
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // then: verify that there are not pending http calls
    httpMock.verify();
  });

  it('findById() should return data', () => {
    // given: existing entity
    const dummyEntity = dummyEntityList[0];

    // when: findOne method called with existing entity id
    service.findById(dummyEntity.id).subscribe((res) => {
      // then: the existing entity is returned
      expect(res).toEqual(dummyEntity);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}/${dummyEntity.id}`, 'GET to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // "fire" the request with the modcked result
    req.flush(dummyEntity);
  });

  it('findById() of not existing entity should throw error', () => {
    // given: no existing entity id
    const id = 99;
    // when: findOne method called with that id
    service.findById(id).subscribe(
      () => {
        fail('Expected error');
      },
      (error) => {
        // then: a 404 status should be returned
        expect(error.status).toEqual(NOT_FOUND.status);
      }
    );

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}/${id}`, 'GET to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // "fire" the request with not found result
    req.flush('', NOT_FOUND);
  });


  it('findAll() should GET ListResult', () => {
    // when: findAll method called
    service.findAll().subscribe((res) => {
      // then: a new entity is created with the given name
      expect(res.items).toEqual(dummyEntityList);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}`, 'GET to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush(dummyEntityList);
  });

  it('findAll(options.page) should GET ListResult paged with one element', () => {
    // given: find pagination options
    const findOptions: SgiRestFindOptions = {
      page: {
        index: 0,
        size: 1
      }
    };

    // when: findAll method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the available pages
      expect(res.page.count).toEqual(3);
      // then: the requested page
      expect(res.page.index).toEqual(0);
      // then: the total number of elements
      expect(res.total).toEqual(dummyEntityList.length);
      // then: the amount of elements per page
      expect(res.items.length).toEqual(1);
      // then: the first element
      expect(res.items[0]).toEqual(dummyEntityList[0]);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}`, 'GET pagination to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');
    // then: the right Pagination page header
    expect(req.request.headers.get('X-Page')).toBe(findOptions.page.index.toString());
    // then: the right Pagination index header
    expect(req.request.headers.get('X-Page-Size')).toBe(findOptions.page.size.toString());

    // “fire” the request with the mocked result
    req.flush([dummyEntityList[0]], {
      headers: {
        // The requested page index
        'X-Page': findOptions.page.index.toString(),
        // The requested elements per page
        'X-Page-Size': findOptions.page.size.toString(),
        // The number of elements in the page
        'X-Page-Count': dummyEntityList.length.toString(),
        // The number of available pages
        'X-Page-Total-Count': dummyEntityList.length.toString(),
        // The number of available elements
        'X-Total-Count': dummyEntityList.length.toString(),
      }
    });
  });

  it('findAll(options.sort) should GET ListResult with sort ASC parameter', () => {
    // given: find sort options
    const findOptions: SgiRestFindOptions = {
      sort: {
        field: 'id',
        direction: SgiRestSortDirection.ASC
      }
    };

    // when: create method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the list
      expect(res.items).toEqual(dummyEntityList);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}?s=id+`, 'GET with sort to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush(dummyEntityList);
  });

  it('findAll(options.sort) should GET ListResult with sort DESC parameter', () => {
    // given: find sort options
    const findOptions: SgiRestFindOptions = {
      sort: {
        field: 'id',
        direction: SgiRestSortDirection.DESC
      }
    };

    // when: findAll method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the list
      expect(res.items).toEqual(dummyEntityList);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}?s=id-`, 'GET with sort to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush(dummyEntityList);
  });

  it('findAll(options.filters) with GREATHER, EQUALS, NOT_EQUALS and LOWER should GET ListResult with filter parameter', () => {
    // given: find filters options
    const findOptions: SgiRestFindOptions = {
      filters: [
        {
          field: 'id',
          type: SgiRestFilterType.GREATHER,
          value: '1'
        },
        {
          field: 'name',
          type: SgiRestFilterType.EQUALS,
          value: 'George'
        },
        {
          field: 'surname',
          type: SgiRestFilterType.NOT_EQUALS,
          value: 'Watson'
        },
        {
          field: 'age',
          type: SgiRestFilterType.LOWER,
          value: '50'
        }
      ]
    };

    // when: findAll method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the list
      expect(res.items).toEqual(dummyEntityList);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}?q=${encodeURI('id>1,name:George,surname!:Watson,age<50')}`, 'GET with filter to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush(dummyEntityList);
  });

  it('findAll(options.filters) with GREATHER_OR_EQUAL, LIKE, NOT_LIKE and LOWER_OR_EQUAL should GET ListResult with filter parameter', () => {
    // given: find filters options
    const findOptions: SgiRestFindOptions = {
      filters: [
        {
          field: 'id',
          type: SgiRestFilterType.GREATHER_OR_EQUAL,
          value: '1'
        },
        {
          field: 'name',
          type: SgiRestFilterType.LIKE,
          value: 'George'
        },
        {
          field: 'surname',
          type: SgiRestFilterType.NOT_LIKE,
          value: 'Watson'
        },
        {
          field: 'age',
          type: SgiRestFilterType.LOWER_OR_EQUAL,
          value: '50'
        }
      ]
    };

    // when: findAll method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the list
      expect(res.items).toEqual(dummyEntityList);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}?q=${encodeURI('id>:1,name~George,surname!~Watson,age<:50')}`, 'GET with filter to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush(dummyEntityList);
  });

  it('findAll(options) should GET ListResult paged with sort and filter parameters', () => {
    // given: find paging, sorting and filter options
    const findOptions: SgiRestFindOptions = {
      page: {
        index: 0,
        size: 1
      },
      sort: {
        field: 'id',
        direction: SgiRestSortDirection.DESC
      },
      filters: [
        {
          field: 'id',
          type: SgiRestFilterType.GREATHER,
          value: '1'
        },
        {
          field: 'name',
          type: SgiRestFilterType.EQUALS,
          value: 'George'
        },
        {
          field: 'surname',
          type: SgiRestFilterType.LIKE,
          value: 'Watson'
        },
        {
          field: 'age',
          type: SgiRestFilterType.LOWER_OR_EQUAL,
          value: '50'
        }
      ]
    };

    // when: findAll method called
    service.findAll(findOptions).subscribe((res) => {
      // then: the available pages
      expect(res.page.count).toEqual(3);
      // then: the requested page
      expect(res.page.index).toEqual(0);
      // then: the total number of elements
      expect(res.total).toEqual(dummyEntityList.length);
      // then: the amount of elements per page
      expect(res.items.length).toEqual(1);
      // then: the first element
      expect(res.items[0]).toEqual(dummyEntityList[0]);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}?q=${encodeURI('id>1,name:George,surname~Watson,age<:50')}&s=id-`, 'GET pagination with filter and sort to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');
    // then: the right Pagination page header
    expect(req.request.headers.get('X-Page')).toBe(findOptions.page.index.toString());
    // then: the right Pagination index header
    expect(req.request.headers.get('X-Page-Size')).toBe(findOptions.page.size.toString());

    // “fire” the request with the mocked result
    req.flush([dummyEntityList[0]], {
      headers: {
        // The requested page index
        'X-Page': findOptions.page.index.toString(),
        // The requested elements per page
        'X-Page-Size': findOptions.page.size.toString(),
        // The number of elements in the page
        'X-Page-Count': dummyEntityList.length.toString(),
        // The number of available pages
        'X-Page-Total-Count': dummyEntityList.length.toString(),
        // The number of available elements
        'X-Total-Count': dummyEntityList.length.toString(),
      }
    });
  });

  it('findAll() should GET empty ListResult if no data', () => {
    // when: findAll method called
    service.findAll().subscribe((res) => {
      // then: the empty list
      expect(res.items.length).toEqual(0);
    });

    // then: the right backend API is called
    const req = httpMock.expectOne(`${fakeEndpoint}`, 'GET to API');
    // then: the right HTTP method is used to call the backend API
    expect(req.request.method).toBe('GET');

    // “fire” the request with the mocked result
    req.flush([]);
  });
});
