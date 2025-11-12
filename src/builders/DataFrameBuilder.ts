import { DataFrame, LoadingState } from '@grafana/data';

export interface ChangeEvent {
  op: string;
  payload?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    source?: any;
    kind?: string;
  };
}

export interface BuilderResponse {
  frames: DataFrame[];
  state: LoadingState;
}

/**
 * Interface for building DataFrames from incoming change events.
 * Different implementations can handle data differently (replace vs append).
 */
export interface DataFrameBuilder {
  /**
   * Process a change notification and return updated DataFrames
   */
  processChange(event: ChangeEvent): BuilderResponse;

  /**
   * Process a reload/snapshot of data
   */
  processReload(data: any[]): BuilderResponse;

  /**
   * Get the current state of DataFrames
   */
  getCurrentFrames(): DataFrame[];

  /**
   * Clear all data
   */
  clear(): void;
}
