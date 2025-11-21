import React, { ChangeEvent, useState } from 'react';
import { LegacyForms, Button, Alert, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { DrasiDataSourceOptions, DrasiQuery, DataFrameMode } from '../types';

const { FormField, Switch } = LegacyForms;

type Props = QueryEditorProps<any, DrasiQuery, DrasiDataSourceOptions>;

const MODE_OPTIONS: Array<SelectableValue<DataFrameMode>> = [
  { label: 'Replace', value: 'replace', description: 'Replace dataframe with latest values (default)' },
  { label: 'Append', value: 'append', description: 'Append each change as new rows' },
];

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const onQueryIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, queryId: event.target.value });
    // Clear error when user changes query ID
    if (error) {
      setError(null);
    }
  };

  const onSnapshotOnStartChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget as HTMLInputElement;
    onChange({ ...query, snapshotOnStart: target.checked });
    onRunQuery();
  };

  const onModeChange = (option: SelectableValue<DataFrameMode>) => {
    onChange({ ...query, mode: option.value || 'replace' });
    onRunQuery();
  };

  const onReloadSnapshot = async () => {
    if (query.queryId && datasource instanceof DataSource) {
      setIsReloading(true);
      setError(null);
      
      try {
        await datasource.reloadSnapshot(query.queryId, query.refId);
        // Trigger query execution to refresh the panel data
        onRunQuery();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to reload snapshot: ${errorMessage}`);
        console.error('Failed to reload snapshot:', error);
      } finally {
        setIsReloading(false);
      }
    }
  };

  return (
    <div className="gf-form-group">
      {error && (
        <div className="gf-form" style={{ marginBottom: '10px' }}>
          <Alert severity="error" title="Error">
            {error}
          </Alert>
        </div>
      )}

      <div className="gf-form">
        <FormField
          label="Query ID"
          labelWidth={8}
          inputWidth={20}
          onChange={onQueryIdChange}
          value={query.queryId || ''}
          placeholder="Enter query ID (e.g., query-1)"
          tooltip="The query ID to monitor for changes"
        />
      </div>

      <div className="gf-form">
        <label className="gf-form-label width-8">Data Mode</label>
        <Select
          options={MODE_OPTIONS}
          value={MODE_OPTIONS.find(option => option.value === (query.mode || 'replace'))}
          onChange={onModeChange}
          width={20}
        />
      </div>

      <div className="gf-form">
        <Switch
          label="Load snapshot on start"
          labelClass="width-8"
          checked={query.snapshotOnStart || false}
          onChange={onSnapshotOnStartChange}
          tooltip="Load current data snapshot when the query starts"
        />
      </div>

      <div className="gf-form">
        <Button 
          variant="secondary" 
          onClick={onReloadSnapshot} 
          disabled={!query.queryId || isReloading}
        >
          {isReloading ? 'Reloading...' : 'Reload Snapshot'}
        </Button>
      </div>

      <div className="gf-form-inline">
        <div className="gf-form">
          <h6>Streaming Configuration</h6>
          <p>
            This query will stream real-time changes from the SignalR endpoint for the specified query ID.
            Enable &quot;Load snapshot on start&quot; to get the current data state before streaming changes.
          </p>
        </div>
      </div>
    </div>
  );
}
