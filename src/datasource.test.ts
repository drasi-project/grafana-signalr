import { DataSource } from './datasource';
import { DataSourceInstanceSettings, LoadingState } from '@grafana/data';
import { DrasiDataSourceOptions, DrasiQuery } from './types';
import { ReactionListener } from '@drasi/signalr-react';

// Mock the ReactionListener
jest.mock('@drasi/signalr-react', () => ({
  ReactionListener: jest.fn(),
}));

// Mock the builders
jest.mock('./builders', () => ({
  FrameBuilderFactory: {
    createBuilder: jest.fn(() => ({
      processChange: jest.fn(() => ({ frames: [], state: LoadingState.Streaming })),
      processReload: jest.fn(() => ({ frames: [], state: LoadingState.Done })),
      getCurrentFrames: jest.fn(() => []),
      clear: jest.fn(),
    })),
  },
}));

describe('DataSource', () => {
  let datasource: DataSource;
  let instanceSettings: DataSourceInstanceSettings<DrasiDataSourceOptions>;
  let mockReactionListener: any;
  let mockSigRConn: any;

  beforeEach(() => {
    // Setup mock SignalR connection
    mockSigRConn = {
      connection: {
        on: jest.fn(),
        onreconnected: jest.fn(),
      },
      started: Promise.resolve(),
    };

    // Setup mock ReactionListener
    mockReactionListener = {
      reload: jest.fn((callback) => {
        // Simulate successful reload
        callback([]);
      }),
      sigRConn: mockSigRConn,
    };

    (ReactionListener as jest.Mock).mockImplementation((url) => {
      // Simulate connection failure for empty URL
      if (!url || url.trim() === '') {
        return {
          reload: mockReactionListener.reload,
          sigRConn: {
            connection: mockSigRConn.connection,
            started: Promise.reject(new Error('Invalid URL')),
          },
        };
      }
      return mockReactionListener;
    });

    instanceSettings = {
      id: 1,
      uid: 'test-uid',
      type: 'drasi-signalr-datasource',
      name: 'Test SignalR',
      meta: {} as any,
      jsonData: {
        signalrUrl: 'http://localhost:8002/hub',
      },
    } as DataSourceInstanceSettings<DrasiDataSourceOptions>;

    datasource = new DataSource(instanceSettings);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the correct signalrUrl', () => {
      expect((datasource as any).signalrUrl).toBe('http://localhost:8002/hub');
    });

    it('should initialize empty maps for listeners, builders, observers, and queryIdToRefIds', () => {
      expect((datasource as any).listeners.size).toBe(0);
      expect((datasource as any).builders.size).toBe(0);
      expect((datasource as any).observers.size).toBe(0);
      expect((datasource as any).queryIdToRefIds.size).toBe(0);
    });
  });

  describe('getDefaultQuery', () => {
    it('should return default query with empty queryId and snapshotOnStart false', () => {
      const defaultQuery = datasource.getDefaultQuery();
      expect(defaultQuery).toEqual({
        queryId: '',
        snapshotOnStart: false,
      });
    });
  });

  describe('filterQuery', () => {
    it('should return true for valid query with queryId', () => {
      const query: DrasiQuery = { queryId: 'test-query', refId: 'A' };
      expect(datasource.filterQuery(query)).toBe(true);
    });

    it('should return false for query with empty queryId', () => {
      const query: DrasiQuery = { queryId: '', refId: 'A' };
      expect(datasource.filterQuery(query)).toBe(false);
    });

    it('should return false for query with whitespace-only queryId', () => {
      const query: DrasiQuery = { queryId: '   ', refId: 'A' };
      expect(datasource.filterQuery(query)).toBe(false);
    });

    it('should return false for query without queryId', () => {
      const query: DrasiQuery = { refId: 'A' } as any;
      expect(datasource.filterQuery(query)).toBe(false);
    });
  });

  describe('testDatasource', () => {
    it('should use default URL when not configured', async () => {
      const emptySettings = {
        ...instanceSettings,
        jsonData: {},
      } as DataSourceInstanceSettings<DrasiDataSourceOptions>;
      const emptyDatasource = new DataSource(emptySettings);

      // Should use default URL, so connection should work with our mock
      const result = await emptyDatasource.testDatasource();
      expect(result.status).toBe('success');
    });

    it('should return success when connection is established', async () => {
      const result = await datasource.testDatasource();
      expect(result.status).toBe('success');
      expect(result.message).toBe('Successfully connected to SignalR endpoint');
    });

    it('should return error when connection fails', async () => {
      mockSigRConn.started = Promise.reject(new Error('Connection failed'));

      const result = await datasource.testDatasource();
      expect(result.status).toBe('error');
      expect(result.message).toContain('Failed to connect');
    });

    it('should handle connection timeout', async () => {
      mockSigRConn.started = new Promise(() => {}); // Never resolves

      const result = await datasource.testDatasource();
      expect(result.status).toBe('error');
      expect(result.message).toContain('timeout');
    }, 10000);
  });

  describe('query', () => {
    it('should return error for empty query list', (done) => {
      const options = {
        targets: [],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(response.state).toBe(LoadingState.Error);
          expect(response.error?.message).toContain('No valid query IDs');
          done();
        },
      });
    });

    it('should filter out invalid queries', (done) => {
      const options = {
        targets: [
          { queryId: '', refId: 'A' },
          { queryId: '  ', refId: 'B' },
        ],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(response.state).toBe(LoadingState.Error);
          done();
        },
      });
    });

    it('should create listener and builder for valid query', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(response.state).toBe(LoadingState.Streaming);
          expect(ReactionListener).toHaveBeenCalledWith(
            'http://localhost:8002/hub',
            'test-query',
            expect.any(Function)
          );
          done();
        },
      });
    });

    it('should trigger reload when snapshotOnStart is true', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: true }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(mockReactionListener.reload).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle multiple targets', (done) => {
      const options = {
        targets: [
          { queryId: 'query-1', refId: 'A', snapshotOnStart: false },
          { queryId: 'query-2', refId: 'B', snapshotOnStart: false },
        ],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(ReactionListener).toHaveBeenCalledTimes(2);
          expect(response.state).toBe(LoadingState.Streaming);
          done();
        },
      });
    });

    it('should use replace mode by default', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A' }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      const { FrameBuilderFactory } = require('./builders');

      const observable = datasource.query(options);
      observable.subscribe({
        next: () => {
          expect(FrameBuilderFactory.createBuilder).toHaveBeenCalledWith(
            'replace',
            'test-query',
            'd1-1-test-query'
          );
          done();
        },
      });
    });

    it('should use specified mode when provided', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', mode: 'append' as const }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      const { FrameBuilderFactory } = require('./builders');

      const observable = datasource.query(options);
      observable.subscribe({
        next: () => {
          expect(FrameBuilderFactory.createBuilder).toHaveBeenCalledWith(
            'append',
            'test-query',
            'd1-1-test-query'
          );
          done();
        },
      });
    });
  });

  describe('reloadSnapshot', () => {
    it('should create infrastructure if query is not active', async () => {
      await datasource.reloadSnapshot('test-query', 'A');

      expect(ReactionListener).toHaveBeenCalled();
      expect(mockReactionListener.reload).toHaveBeenCalled();
    });

    it('should use existing infrastructure if query is active', async () => {
      // First query to set up infrastructure
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      datasource.query(options).subscribe(() => {});

      // Clear the mock to count new calls
      (ReactionListener as jest.Mock).mockClear();

      await datasource.reloadSnapshot('test-query', 'A');

      // Should not create a new listener
      expect(ReactionListener).not.toHaveBeenCalled();
      expect(mockReactionListener.reload).toHaveBeenCalled();
    });

    it('should handle reload timeout for invalid query', async () => {
      mockReactionListener.reload = jest.fn(() => {
        // Never calls the callback - simulates timeout
      });

      await expect(datasource.reloadSnapshot('invalid-query')).rejects.toThrow('timeout');
    }, 15000);

    it('should use queryId as refId if refId not provided', async () => {
      await datasource.reloadSnapshot('test-query');

      const queryIdToRefIds = (datasource as any).queryIdToRefIds;
      expect(queryIdToRefIds.get('test-query')?.has('test-query')).toBe(true);
    });
  });

  describe('reconnection handling', () => {
    it('should set up reconnection handler when creating listener', () => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      datasource.query(options).subscribe(() => {});

      expect(mockSigRConn.connection.onreconnected).toHaveBeenCalled();
    });

    it('should reload snapshot on reconnection', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      datasource.query(options).subscribe(() => {});

      // Get the reconnection handler
      const reconnectionHandler = mockSigRConn.connection.onreconnected.mock.calls[0][0];

      // Clear reload mock
      mockReactionListener.reload.mockClear();

      // Trigger reconnection
      reconnectionHandler();

      // Give it a moment to process
      setTimeout(() => {
        expect(mockReactionListener.reload).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('cleanup and disposal', () => {
    it('should clean up observer when subscription is cancelled', (done) => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      const subscription = datasource.query(options).subscribe(() => {});

      const observers = (datasource as any).observers;
      expect(observers.size).toBeGreaterThan(0);

      subscription.unsubscribe();

      setTimeout(() => {
        expect(observers.size).toBe(0);
        done();
      }, 100);
    });

    it('should dispose all resources', async () => {
      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      datasource.query(options).subscribe(() => {});

      await datasource.dispose();

      expect((datasource as any).listeners.size).toBe(0);
      expect((datasource as any).builders.size).toBe(0);
      expect((datasource as any).observers.size).toBe(0);
      expect((datasource as any).queryIdToRefIds.size).toBe(0);
    });
  });

  describe('builder mode changes', () => {
    it('should recreate builder when mode changes', (done) => {
      const { FrameBuilderFactory } = require('./builders');
      const mockBuilder = {
        processChange: jest.fn(() => ({ frames: [], state: LoadingState.Streaming })),
        processReload: jest.fn(() => ({ frames: [], state: LoadingState.Done })),
        getCurrentFrames: jest.fn(() => []),
        clear: jest.fn(),
      };

      FrameBuilderFactory.createBuilder.mockReturnValue(mockBuilder);

      // First query with replace mode
      const options1 = {
        targets: [{ queryId: 'test-query', refId: 'A', mode: 'replace' as const }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test1',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      datasource.query(options1).subscribe(() => {
        // Second query with append mode
        const options2 = {
          targets: [{ queryId: 'test-query', refId: 'A', mode: 'append' as const }],
          range: {} as any,
          scopedVars: {},
          timezone: 'browser',
          app: 'dashboard',
          requestId: 'test2',
          interval: '1s',
          intervalMs: 1000,
          startTime: Date.now(),
          dashboardUID: 'd1',
          panelId: 1,
        };

        datasource.query(options2).subscribe(() => {
          expect(mockBuilder.clear).toHaveBeenCalled();
          expect(FrameBuilderFactory.createBuilder).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  describe('metricFindQuery', () => {
    it('should return empty array', async () => {
      const result = await datasource.metricFindQuery({});
      expect(result).toEqual([]);
    });
  });

  describe('checkHealth', () => {
    it('should delegate to testDatasource', async () => {
      const testResult = await datasource.testDatasource();
      const healthResult = await datasource.checkHealth();

      expect(healthResult.status).toBe(testResult.status);
      expect(healthResult.message).toBe(testResult.message);
    });
  });

  describe('error handling', () => {
    it('should handle errors in query setup', (done) => {
      const { FrameBuilderFactory } = require('./builders');
      FrameBuilderFactory.createBuilder.mockImplementation(() => {
        throw new Error('Builder creation failed');
      });

      const options = {
        targets: [{ queryId: 'test-query', refId: 'A', snapshotOnStart: false }],
        range: {} as any,
        scopedVars: {},
        timezone: 'browser',
        app: 'dashboard',
        requestId: 'test',
        interval: '1s',
        intervalMs: 1000,
        startTime: Date.now(),
        dashboardUID: 'd1',
        panelId: 1,
      };

      const observable = datasource.query(options);
      observable.subscribe({
        next: (response: any) => {
          expect(response.state).toBe(LoadingState.Error);
          expect(response.error?.message).toContain('Builder creation failed');
          done();
        },
      });
    });

    it('should handle reload errors gracefully', async () => {
      mockReactionListener.reload = jest.fn(() => {
        throw new Error('Reload failed');
      });

      await expect(datasource.reloadSnapshot('test-query')).rejects.toThrow();
    });
  });
});
