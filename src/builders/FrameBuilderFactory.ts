import { DataFrameBuilder } from './DataFrameBuilder';
import { ReplaceFrameBuilder } from './ReplaceFrameBuilder';
import { AppendFrameBuilder } from './AppendFrameBuilder';
import { DataFrameMode } from '../types';

/**
 * Factory for creating the appropriate DataFrameBuilder based on the mode
 */
export class FrameBuilderFactory {
  static createBuilder(mode: DataFrameMode | undefined, queryId: string, refId?: string): DataFrameBuilder {
    const effectiveMode = mode || 'replace'; // Default to 'replace' mode

    switch (effectiveMode) {
      case 'append':
        return new AppendFrameBuilder(queryId, refId);
      case 'replace':
      default:
        return new ReplaceFrameBuilder(queryId, refId);
    }
  }
}
