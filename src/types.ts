import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type DataFrameMode = 'replace' | 'append';

export interface DrasiQuery extends DataQuery {
  queryId: string;
  snapshotOnStart?: boolean;
  refId: string;
  mode?: DataFrameMode; // How to handle incoming data: 'replace' (default) or 'append'
}

export interface DrasiDataSourceOptions extends DataSourceJsonData {
  signalrUrl: string;
}

export interface DrasiSecureJsonData {
  // Add any secure fields here if needed
}

// SignalR message types based on TypeSpec definitions
export enum Op {
  Insert = 'i',
  Update = 'u',
  Delete = 'd',
  ControlSignal = 'x',
  ReloadHeader = 'h',
  ReloadItem = 'r',
}

export interface ChangeSource {
  queryId: string;
  ts_ms: number;
}

export interface ChangePayload {
  source: ChangeSource;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export interface ControlPayload {
  source: ChangeSource;
  kind: string;
}

export interface Notification {
  op: Op;
  ts_ms: number;
  metadata?: Record<string, any>;
}

export interface ChangeNotification extends Notification {
  op: Op.Insert | Op.Update | Op.Delete;
  payload: ChangePayload;
  seq: number;
}

export interface ControlSignalNotification extends Notification {
  op: Op.ControlSignal;
  payload: ControlPayload;
  seq: number;
}

export interface ReloadHeaderNotification extends Notification {
  op: Op.ReloadHeader;
  payload: ChangePayload;
}

export interface ReloadItemNotification extends Notification {
  op: Op.ReloadItem;
  payload: ChangePayload;
}
