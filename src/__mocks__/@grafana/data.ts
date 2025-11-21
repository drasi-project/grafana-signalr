export enum LoadingState {
  NotStarted = 'NotStarted',
  Loading = 'Loading',
  Streaming = 'Streaming',
  Done = 'Done',
  Error = 'Error',
}

export interface DataSourceInstanceSettings<T = any> {
  id: number;
  uid: string;
  type: string;
  name: string;
  meta: any;
  jsonData: T;
}

export interface DataQueryRequest<TQuery = any> {
  requestId: string;
  interval: string;
  intervalMs: number;
  range: any;
  scopedVars: any;
  targets: TQuery[];
  timezone: string;
  app: string;
  startTime: number;
}

export interface DataQueryResponse {
  data: any[];
  state?: LoadingState;
  error?: DataQueryError;
  key?: string;
}

export interface DataQueryError {
  message: string;
  status?: string;
  statusText?: string;
}

export interface DataFrame {
  name?: string;
  fields: any[];
  length: number;
}

export class DataSourceApi<TQuery = any, TOptions = any> {
  constructor(instanceSettings: DataSourceInstanceSettings<TOptions>) {}
  query(request: DataQueryRequest<TQuery>): any {}
  testDatasource(): Promise<any> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}
