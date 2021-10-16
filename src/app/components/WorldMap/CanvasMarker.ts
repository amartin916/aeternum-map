import leaflet from 'leaflet';

type CanvasMarkerOptions = {
  image: {
    size: [number, number];
    src?: string;
    element?: HTMLImageElement;
    comments?: number;
  };
};

class CanvasMarker extends leaflet.CircleMarker {
  declare options: leaflet.CircleMarkerOptions & CanvasMarkerOptions;
  private _renderer: any;
  declare _point: any;

  constructor(
    latLng: leaflet.LatLngExpression,
    options: leaflet.CircleMarkerOptions & CanvasMarkerOptions
  ) {
    super(latLng, options);
  }

  _updatePath(): void {
    if (!this.options.image.element) {
      if (!this.options.image.src) {
        return;
      }
      const imageElement = document.createElement('img');
      imageElement.src = this.options.image.src;
      this.options.image.element = imageElement;
      imageElement.onload = () => {
        this.redraw();
      };
      imageElement.onerror = () => {
        this.options.image.element = undefined;
      };
    } else {
      this._renderer._updateCanvasImg(this);
    }
  }
}

leaflet.Canvas.include({
  _updateCanvasImg(layer: CanvasMarker) {
    const { image } = layer.options;
    if (!image.element) {
      return;
    }
    const p = layer._point.round();
    const ctx: CanvasRenderingContext2D = this._ctx;
    const dx = p.x - image.size[0] / 2;
    const dy = p.y - image.size[1] / 2;
    ctx.drawImage(image.element, dx, dy, image.size[0], image.size[1]);
    if (image.comments) {
      ctx.beginPath();
      ctx.arc(
        dx + image.size[0] - 8,
        dy + image.size[1] / 2 - 8,
        3,
        0,
        Math.PI * 2,
        true
      ); // Outer circle
      ctx.fillStyle = '#3791F9';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
    }
  },
});

export default CanvasMarker;
