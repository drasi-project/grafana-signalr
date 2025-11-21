import {
  DataSourceInstanceSettings,
  DataFrame,
  LoadingState,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
} from '@grafana/data';
import { Observable } from 'rxjs';
import { ReactionListener } from '@drasi/signalr-react';

import {
  DrasiQuery,
  DrasiDataSourceOptions,
} from './types';
import { FrameBuilderFactory, type DataFrameBuilder } from './builders';

export class DataSource extends DataSourceApi<DrasiQuery, DrasiDataSourceOptions> {
  annotations = {};
  private signalrUrl: string;
  private listeners: Map<string, ReactionListener> = new Map(); // queryId -> ReactionListener
  private builders: Map<string, { builder: DataFrameBuilder; mode: string }> = new Map(); // refId -> { builder, mode }
  private queryIdToRefIds: Map<string, Set<string>> = new Map(); // queryId -> Set<refId>

  constructor(instanceSettings: DataSourceInstanceSettings<DrasiDataSourceOptions>) {
    super(instanceSettings);
    this.signalrUrl = instanceSettings.jsonData.signalrUrl || 'http://localhost:8002/hub';
  }

  // Required method for Grafana to recognize this as a queryable data source
  getDefaultQuery(): Partial<DrasiQuery> {
    return {
      queryId: '',
      snapshotOnStart: false,
    };
  }

  // Required for data source to appear in query builder
  metricFindQuery(query: any): Promise<any[]> {
    return Promise.resolve([]);
  }

  // Filter out invalid queries
  filterQuery(query: DrasiQuery): boolean {
    return !!query.queryId && query.queryId.trim() !== '';
  }

  // Check if data source is working
  async checkHealth(): Promise<{ status: string; message: string }> {
    return this.testDatasource();
  }

  private observers: Map<string, any[]> = new Map();

  private getOrCreateListener(queryId: string): ReactionListener {
    if (!this.listeners.has(queryId)) {
      const listener = new ReactionListener(this.signalrUrl, queryId, (event) => {
        // A single queryId can be used by multiple refIds, so we need to process for each
        const refIds = this.queryIdToRefIds.get(queryId);
        if (!refIds || refIds.size === 0) {
          console.error(`No refIds found for query ${queryId}`);
          return;
        }

        // Process the change for each refId that uses this queryId
        refIds.forEach(refId => {
          const builderEntry = this.builders.get(refId);
          if (!builderEntry) {
            console.error(`No builder found for refId ${refId}`);
            return;
          }

          // Process the change using the builder
          const result = builderEntry.builder.processChange(event);

          // Notify all observers for this refId
          const refIdObservers = this.observers.get(refId) || [];
          refIdObservers.forEach(observer => {
            observer.next({
              data: result.frames,
              state: result.state,
              key: refId,
            });
          });
        });
      });
      
      // Set up reconnection handler
      this.setupReconnectionHandler(listener, queryId);
      
      this.listeners.set(queryId, listener);
    }
    return this.listeners.get(queryId)!;
  }

  private setupReconnectionHandler(listener: ReactionListener, queryId: string): void {
    try {
      // Access the internal SignalR connection
      const sigRConn = (listener as any).sigRConn;
      if (sigRConn && sigRConn.connection) {
        // Listen for reconnected event
        sigRConn.connection.onreconnected(() => {
          // Reload data after reconnection to resync state
          this.performReload(queryId).catch(err => {
            console.error(`Failed to reload after reconnection for query ${queryId}:`, err);
          });
        });
      }
    } catch (error) {
      console.warn('Failed to setup reconnection handler:', error);
    }
  }

  private getOrCreateBuilder(refId: string, queryId: string, mode: 'replace' | 'append'): DataFrameBuilder {
    const existingEntry = this.builders.get(refId);

    // If builder exists but mode changed, recreate it
    if (existingEntry && existingEntry.mode !== mode) {
      existingEntry.builder.clear();
      this.builders.delete(refId);
    }

    // Create new builder if it doesn't exist
    if (!this.builders.has(refId)) {
      const builder = FrameBuilderFactory.createBuilder(mode, queryId, refId);
      this.builders.set(refId, { builder, mode });
    }

    return this.builders.get(refId)!.builder;
  }

  private async performReload(queryId: string): Promise<void> {
    const listener = this.getOrCreateListener(queryId);

    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging on invalid query IDs
      const timeout = setTimeout(() => {
        reject(new Error(`Reload timeout - query ID "${queryId}" may not exist or is not responding`));
      }, 10000); // 10 second timeout

      try {
        listener.reload((data: any[]) => {
          try {
            clearTimeout(timeout);
            
            // A single queryId can be used by multiple refIds, reload for all of them
            const refIds = this.queryIdToRefIds.get(queryId);
            
            // If there are no refIds, the query infrastructure hasn't been set up
            if (!refIds || refIds.size === 0) {
              resolve();
              return;
            }

            // Process the reload for each refId that uses this queryId
            refIds.forEach(refId => {
              const builderEntry = this.builders.get(refId);
              if (!builderEntry) {
                console.error(`No builder found for refId ${refId}`);
                return;
              }

              // Process the reload using the builder
              const result = builderEntry.builder.processReload(data);

              // Notify all observers for this refId with the refreshed data
              // Observers may not exist if manually triggered from QueryEditor
              const refIdObservers = this.observers.get(refId) || [];
              refIdObservers.forEach(observer => {
                observer.next({
                  data: result.frames,
                  state: result.state,
                  key: refId,
                });
              });
            });

            resolve();
          } catch (processingError) {
            clearTimeout(timeout);
            const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
            console.error('Error processing reload data:', processingError);
            reject(new Error(`Failed to process reload data: ${errorMessage}`));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Reload error:', error);
        reject(new Error(`Failed to initiate reload: ${errorMessage}`));
      }
    });
  }

  query(options: DataQueryRequest<DrasiQuery>): any {
    
    return new Observable<DataQueryResponse>((observer: any) => {
      // Handle multiple targets by merging them into a single response
      const activeQueries = options.targets.filter(target => target.queryId && target.queryId.trim() !== '');
      
      if (activeQueries.length === 0) {
        observer.next({
          data: [],
          state: LoadingState.Error,
          error: { message: 'No valid query IDs provided' },
          key: 'error',
        });
        observer.complete();
        return;
      }

      const setupQueries = async () => {
        try {
          const frames: DataFrame[] = [];

          for (const target of activeQueries) {
            try {
              const refId = target.refId || target.queryId;

              // Register this observer for the refId
              if (!this.observers.has(refId)) {
                this.observers.set(refId, []);
              }
              this.observers.get(refId)!.push(observer);

              // Register the queryId -> refId mapping
              if (!this.queryIdToRefIds.has(target.queryId)) {
                this.queryIdToRefIds.set(target.queryId, new Set());
              }
              this.queryIdToRefIds.get(target.queryId)!.add(refId);

              // Create or get builder with the specified mode (mode change handled internally)
              const builder = this.getOrCreateBuilder(
                refId,
                target.queryId,
                target.mode || 'replace'
              );

              // Get or create listener for this query
              this.getOrCreateListener(target.queryId);

              // Perform initial snapshot if requested
              if (target.snapshotOnStart) {
                await this.performReload(target.queryId);
              }

              // Get current frames from the builder
              const currentFrames = builder.getCurrentFrames();
              frames.push(...currentFrames);

            } catch (queryError) {
              const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
              console.error(`Failed to setup query ${target.queryId}:`, queryError);

              // Send error for this specific query
              observer.next({
                data: [],
                state: LoadingState.Error,
                error: { message: `Failed to setup query "${target.queryId}": ${errorMessage}` },
                key: target.refId || target.queryId,
              });
              return; // Exit early on query setup failure
            }
          }

          // Send single response with all frames if all queries succeeded
          observer.next({
            data: frames,
            state: LoadingState.Streaming,
            key: activeQueries.map(t => t.refId || t.queryId).join(','),
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Failed to setup queries:', error);
          observer.next({
            data: [],
            state: LoadingState.Error,
            error: { message: `Failed to setup queries: ${errorMessage}` },
            key: 'error',
          });
        }
      };

      setupQueries();

      // Return cleanup function
      return () => {
        for (const target of activeQueries) {
          const refId = target.refId || target.queryId;

          // Remove observer for this refId
          const refIdObservers = this.observers.get(refId);
          if (refIdObservers) {
            const index = refIdObservers.indexOf(observer);
            if (index > -1) {
              refIdObservers.splice(index, 1);
            }
            if (refIdObservers.length === 0) {
              this.observers.delete(refId);
              // Clean up builder for this refId
              this.builders.delete(refId);

              // Remove refId from queryId mapping
              const refIds = this.queryIdToRefIds.get(target.queryId);
              if (refIds) {
                refIds.delete(refId);
                if (refIds.size === 0) {
                  this.queryIdToRefIds.delete(target.queryId);
                  // If no more refIds use this queryId, clean up the listener
                  this.listeners.delete(target.queryId);
                }
              }
            }
          }
        }
      };
    });
  }

  async testDatasource(): Promise<{ status: string; message: string }> {
    try {
      // Validate URL is configured
      if (!this.signalrUrl || this.signalrUrl.trim() === '') {
        return {
          status: 'error',
          message: 'SignalR URL is required',
        };
      }

      // Try to establish a connection to verify the endpoint exists
      const testListener = new ReactionListener(this.signalrUrl, '__test__', () => {});
      
      // Wait for the connection to be established (or fail)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - unable to reach SignalR endpoint'));
        }, 5000);

        // Access the internal connection promise
        (testListener as any).sigRConn.started
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch((err: Error) => {
            clearTimeout(timeout);
            reject(err);
          });
      });
      
      return {
        status: 'success',
        message: 'Successfully connected to SignalR endpoint',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        status: 'error',
        message: `Failed to connect: ${errorMessage}`,
      };
    }
  }

  async dispose() {
    // Clean up all listeners, builders, and mappings
    this.listeners.clear();
    this.builders.clear();
    this.observers.clear();
    this.queryIdToRefIds.clear();
  }

  // Public method to allow QueryEditor to trigger reload
  async reloadSnapshot(queryId: string, refId?: string): Promise<void> {
    // Ensure we have the infrastructure set up for this query
    const effectiveRefId = refId || queryId;
    
    // If the query isn't already active, set it up
    if (!this.queryIdToRefIds.has(queryId) || this.queryIdToRefIds.get(queryId)!.size === 0) {
      // Register the queryId -> refId mapping
      if (!this.queryIdToRefIds.has(queryId)) {
        this.queryIdToRefIds.set(queryId, new Set());
      }
      this.queryIdToRefIds.get(queryId)!.add(effectiveRefId);
      
      // Create builder for this query
      this.getOrCreateBuilder(effectiveRefId, queryId, 'replace');
      
      // Create listener
      this.getOrCreateListener(queryId);
    }
    
    return this.performReload(queryId);
  }
}
