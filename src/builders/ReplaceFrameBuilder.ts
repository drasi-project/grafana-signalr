import { DataFrame, FieldType, LoadingState, createDataFrame } from '@grafana/data';
import { DataFrameBuilder, ChangeEvent, BuilderResponse } from './DataFrameBuilder';

/**
 * ReplaceFrameBuilder maintains a single DataFrame per query that represents
 * the current state of all data. When changes arrive, it updates the internal
 * dataset and rebuilds the entire DataFrame.
 */
export class ReplaceFrameBuilder implements DataFrameBuilder {
  private dataset: Map<string, any> = new Map();
  private currentFrame: DataFrame | null = null;
  private refId: string;

  constructor(queryId: string, refId?: string) {
    this.refId = refId || queryId;
  }

  processChange(event: ChangeEvent): BuilderResponse {
    let needsRebuild = false;

    switch (event.op) {
      case 'i': // Insert
        if (event.payload?.after) {
          const rowData = event.payload.after;
          const rowKey = this.generateRowKey(rowData);
          this.dataset.set(rowKey, { ...rowData });
          needsRebuild = true;
        }
        break;

      case 'u': // Update
        if (event.payload?.before && event.payload?.after) {
          const beforeData = event.payload.before;
          const afterData = event.payload.after;

          // Find and remove the old row
          const oldRowKey = this.findRowByData(beforeData);
          if (oldRowKey) {
            this.dataset.delete(oldRowKey);
          }

          // Add the new row
          const newRowKey = this.generateRowKey(afterData);
          this.dataset.set(newRowKey, { ...afterData });
          needsRebuild = true;
        }
        break;

      case 'd': // Delete
        if (event.payload?.before) {
          const beforeData = event.payload.before;
          const rowKey = this.findRowByData(beforeData);
          if (rowKey) {
            this.dataset.delete(rowKey);
            needsRebuild = true;
          }
        }
        break;

      case 'x': // Control Signal
        // Control signals don't modify the dataset
        break;

      default:
        break;
    }

    if (needsRebuild) {
      this.rebuildFrame();
    }

    return {
      frames: this.currentFrame ? [this.currentFrame] : [],
      state: LoadingState.Done, // Use Done to replace data
    };
  }

  processReload(data: any[]): BuilderResponse {
    // Clear the existing dataset
    this.dataset.clear();

    // Add each snapshot item to the dataset
    data.forEach((item) => {
      const rowKey = this.generateRowKey(item);
      this.dataset.set(rowKey, { ...item });
    });

    // Rebuild the data frame from the new dataset
    this.rebuildFrame();

    return {
      frames: this.currentFrame ? [this.currentFrame] : [],
      state: LoadingState.Done,
    };
  }

  getCurrentFrames(): DataFrame[] {
    return this.currentFrame ? [this.currentFrame] : [];
  }

  clear(): void {
    this.dataset.clear();
    this.currentFrame = null;
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

  private generateRowKey(rowData: any): string {
    // Create a hash from all fields for consistent identity
    const sortedKeys = Object.keys(rowData).sort();
    const keyString = sortedKeys.map(key => `${key}:${JSON.stringify(rowData[key])}`).join('|');

    // Simple hash function (djb2 algorithm)
    let hash = 5381;
    for (let i = 0; i < keyString.length; i++) {
      hash = ((hash << 5) + hash) + keyString.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  private findRowByData(targetData: any): string | null {
    for (const [key, rowData] of this.dataset.entries()) {
      if (this.objectsMatch(rowData, targetData)) {
        return key;
      }
    }
    return null;
  }

  private objectsMatch(obj1: any, obj2: any): boolean {
    const keys2 = Object.keys(obj2);

    // Check if all keys in obj2 exist in obj1 and have matching values
    for (const key of keys2) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }
}
