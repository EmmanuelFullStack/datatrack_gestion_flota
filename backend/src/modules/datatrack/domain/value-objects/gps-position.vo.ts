export class GpsPosition {
  readonly lat: number;
  readonly lon: number;
  readonly speed: number;
  readonly heading: number;
  readonly satellites: number;
  readonly timestamp: Date;

  private constructor(props: {
    lat: number;
    lon: number;
    speed: number;
    heading: number;
    satellites: number;
    timestamp: Date;
  }) {
    this.lat = props.lat;
    this.lon = props.lon;
    this.speed = props.speed;
    this.heading = props.heading;
    this.satellites = props.satellites;
    this.timestamp = props.timestamp;
  }

  static fromDatatrack(pos: {
    x: number;  // longitude
    y: number;  // latitude
    s: number;  // speed
    c: number;  // course/heading
    sc: number; // satellites
    t: number;  // unix timestamp
  }): GpsPosition {
    return new GpsPosition({
      lat: pos.y,
      lon: pos.x,
      speed: pos.s,
      heading: pos.c,
      satellites: pos.sc,
      timestamp: new Date(pos.t * 1000),
    });
  }

  isValid(): boolean {
    return (
      this.lat !== 0 &&
      this.lon !== 0 &&
      this.lat >= -90 &&
      this.lat <= 90 &&
      this.lon >= -180 &&
      this.lon <= 180
    );
  }

  toJSON() {
    return {
      lat: this.lat,
      lon: this.lon,
      speed: this.speed,
      heading: this.heading,
      satellites: this.satellites,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
