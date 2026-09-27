import { ValueTransformer } from 'typeorm';

export class ColumnBigIntTransformer implements ValueTransformer {
  to(data: bigint | null): bigint | null {
    return data;
  }
  from(data: string | null): bigint | null {
    return data !== null ? BigInt(data) : null;
  }
}
