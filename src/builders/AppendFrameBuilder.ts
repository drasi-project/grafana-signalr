import { DataFrame, FieldType, LoadingState, createDataFrame } from '@grafana/data';
import { DataFrameBuilder, ChangeEvent, BuilderResponse } from './DataFrameBuilder';

/**
 * AppendFrameBuilder creates new DataFrames for each incoming change event
 * and appends them to the collection. This allows for viewing the history
 * of changes over time rather than just the current state.
 */
export class AppendFrameBuilder implements DataFrameBuilder {
  private frames: DataFrame[] = [];
  private refId: string;
  private frameCounter = 0;

  constructor(queryId: string, refId?: string) {
    this.refId = refId || queryId;
  }

  processChange(event: ChangeEvent): BuilderResponse {
    let newFrame: DataFrame | null = null;

    switch (event.op) {
      case 'i': // Insert
        if (event.payload?.after) {
          newFrame = this.createFrameFromRow(event.payload.after, 'insert');
        }
        break;

      case 'u': // Update
        if (event.payload?.after) {
          newFrame = this.createFrameFromRow(event.payload.after, 'update');
        }
        break;

      case 'd': // Delete
        if (event.payload?.before) {
          newFrame = this.createFrameFromRow(event.payload.before, 'delete');
        }
        break;

      case 'x': // Control Signal
        // Control signals don't create new frames
        break;

      default:
        break;
    }

    if (newFrame) {
      this.frames.push(newFrame);
    }

    return {
      frames: newFrame ? [newFrame] : [],
      state: LoadingState.Streaming, // Use Streaming to append data
    };
  }

  processReload(data: any[]): BuilderResponse {
    // For reload, we can either:
    // 1. Clear existing frames and add all reload data as new frames
    // 2. Keep existing frames and add reload data
    // Let's clear and create frames for each reload item
    this.frames = [];
    this.frameCounter = 0;

    const newFrames: DataFrame[] = [];
    data.forEach((item) => {
      const frame = this.createFrameFromRow(item, 'snapshot');
      if (frame) {
        this.frames.push(frame);
        newFrames.push(frame);
      }
    });

    return {
      frames: newFrames,
      state: LoadingState.Done, // Use Done for initial snapshot load
    };
  }

  getCurrentFrames(): DataFrame[] {
    return [...this.frames];
  }

  clear(): void {
    this.frames = [];
    this.frameCounter = 0;
  }

  private createFrameFromRow(rowData: any, operation: string): DataFrame | null {
    if (!rowData || Object.keys(rowData).length === 0) {
      return null;
    }

    this.frameCounter++;

    // Create fields based on the row structure
    const fields = Object.keys(rowData).map(key => {
      const value = rowData[key];
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
        values: [value], // Single value since this is one row
      };
    });

    // Add operation type as a field to track what kind of change this was
    fields.unshift({
      name: '_operation',
      type: FieldType.string,
      values: [operation],
    });

    // Add timestamp field
    fields.unshift({
      name: '_timestamp',
      type: FieldType.time,
      values: [Date.now()],
    });

    return createDataFrame({
      fields,
      refId: this.refId,
      name: `${this.refId}_${operation}_${this.frameCounter}`
    });
  }
}
