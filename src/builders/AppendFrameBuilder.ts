import { DataFrame, FieldType, LoadingState, createDataFrame } from '@grafana/data';
import { DataFrameBuilder, ChangeEvent, BuilderResponse } from './DataFrameBuilder';

/**
 * AppendFrameBuilder maintains a single DataFrame that appends all incoming
 * data as new rows. Insert and Update operations add new rows to the dataset.
 * Delete operations are ignored. This allows for viewing the complete history
 * of all inserts and updates over time.
 */
export class AppendFrameBuilder implements DataFrameBuilder {
  private dataset: Map<string, any> = new Map();
  private currentFrame: DataFrame | null = null;
  private refId: string;
  private rowCounter = 0;

  constructor(queryId: string, refId?: string) {
    this.refId = refId || queryId;
  }

  processChange(event: ChangeEvent): BuilderResponse {
    let needsRebuild = false;

    switch (event.op) {
      case 'i': // Insert - add new row
        if (event.payload?.after) {
          const rowData = event.payload.after;
          const rowKey = this.generateRowKey();
          this.dataset.set(rowKey, { ...rowData });
          needsRebuild = true;
        }
        break;

      case 'u': // Update - treat as insert, add new row
        if (event.payload?.after) {
          const rowData = event.payload.after;
          const rowKey = this.generateRowKey();
          this.dataset.set(rowKey, { ...rowData });
          needsRebuild = true;
        }
        break;

      case 'd': // Delete - ignored
        break;

      case 'x': // Control Signal
        break;

      default:
        break;
    }

    if (needsRebuild) {
      this.rebuildFrame();
    }

    return {
      frames: this.currentFrame ? [this.currentFrame] : [],
      state: LoadingState.Streaming,
    };
  }

  processReload(data: any[]): BuilderResponse {
    // Clear the existing dataset
    this.dataset.clear();
    this.rowCounter = 0;

    // Add each snapshot item to the dataset
    data.forEach((item) => {
      const rowKey = this.generateRowKey();
      this.dataset.set(rowKey, { ...item });
    });

    // Rebuild the data frame from the new dataset
    this.rebuildFrame();

    return {
      frames: this.currentFrame ? [this.currentFrame] : [],
      state: LoadingState.Streaming,
    };
  }

  getCurrentFrames(): DataFrame[] {
    return this.currentFrame ? [this.currentFrame] : [];
  }

  clear(): void {
    this.dataset.clear();
    this.currentFrame = null;
    this.rowCounter = 0;
  }

  private rebuildFrame(): void {
    const rows = Array.from(this.dataset.values());

    if (rows.length > 0) {
      const firstRow = rows[0];

      // Create fields based on the first row structure
      const fields = Object.keys(firstRow).map(key => {
        const value = firstRow[key];
        let fieldType = FieldType.string;

        if (typeof value === 'number') {
          fieldType = FieldType.number;
        } else if (typeof value === 'boolean') {
          fieldType = FieldType.boolean;
        } else if (value instanceof Date) {
          fieldType = FieldType.time;
        } else if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
          fieldType = FieldType.time;
        }

        return {
          name: key,
          type: fieldType,
          values: rows.map(row => row[key]),
        };
      });

      this.currentFrame = createDataFrame({
        fields,
        refId: this.refId,
        name: `Query ${this.refId}`
      });
    } else {
      // Empty dataset - create frame with placeholder field
      this.currentFrame = createDataFrame({
        fields: [{ name: 'id', type: FieldType.string, values: [] }],
        refId: this.refId,
        name: `Query ${this.refId} (empty)`
      });
    }
  }

  private generateRowKey(): string {
    return `row_${this.rowCounter++}`;
  }
}
