import React, { ChangeEvent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DrasiDataSourceOptions } from '../types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<DrasiDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  const onSignalrUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        signalrUrl: event.target.value,
      },
    });
  };


  return (
    <div className="gf-form-group">
      <div className="gf-form">
        <FormField
          label="SignalR URL"
          labelWidth={12}
          inputWidth={30}
          onChange={onSignalrUrlChange}
          value={options.jsonData.signalrUrl || ''}
          placeholder="http://localhost:8080/hub"
          tooltip="The URL of the SignalR hub endpoint"
        />
      </div>
      <div className="gf-form-inline">
        <div className="gf-form">
          <h6>Connection Information</h6>
          <p>
            This data source connects to a Drasi SignalR endpoint to stream real-time data changes.
            Configure the SignalR hub URL below.
          </p>
        </div>
      </div>
    </div>
  );
}
