import { GpsPosition } from './gps-position.vo';

export class DatatrackUnit {
  readonly id: number;
  readonly name: string;
  readonly position: GpsPosition | null;

  private constructor(props: { id: number; name: string; position: GpsPosition | null }) {
    this.id = props.id;
    this.name = props.name;
    this.position = props.position;
  }

  static fromApiResponse(data: {
    id: number;
    nm: string;
    pos?: {
      x: number;
      y: number;
      s: number;
      c: number;
      sc: number;
      t: number;
    } | null;
  }): DatatrackUnit {
    const position = data.pos ? GpsPosition.fromDatatrack(data.pos) : null;
    return new DatatrackUnit({ id: data.id, name: data.nm, position });
  }

  hasValidPosition(): boolean {
    return this.position !== null && this.position.isValid();
  }
}
