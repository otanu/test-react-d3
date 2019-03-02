import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import * as d3 from "d3";
import "./SVGZoom.css";

const AxisX = (props: {
  transform: d3.ZoomTransform;
  width: number;
  height: number;
}) => {
  const { transform, width, height } = props;
  const { scale, axis } = useMemo(() => {
    const scale = d3
      .scaleLinear()
      .domain([-1, width + 1])
      .range([-1, width + 1]);
    const axis = d3
      .axisBottom(scale)
      .ticks(((width + 2) / (height + 2)) * 10)
      .tickSize(height)
      .tickPadding(8 - height);
    return { scale, axis };
  }, [width, height]);

  axis.scale(transform.rescaleX(scale));

  const gRef = useRef(null);
  useEffect(() => {
    d3.select(gRef.current).call(axis as any);
  });

  return <g className="axis axis--x" ref={gRef} />;
};

const AxisY = (props: {
  transform: d3.ZoomTransform;
  width: number;
  height: number;
}) => {
  const { transform, width, height } = props;
  const { scale, axis } = useMemo(() => {
    const scale = d3
      .scaleLinear()
      .domain([-1, height + 1])
      .range([-1, height + 1]);
    const axis = d3
      .axisRight(scale)
      .ticks(10)
      .tickSize(width)
      .tickPadding(8 - width);
    return { scale, axis };
  }, [width, height]);

  axis.scale(transform.rescaleY(scale));

  const gRef = useRef(null);
  useEffect(() => {
    d3.select(gRef.current).call(axis as any);
  });
  return <g className="axis axis--y" ref={gRef} />;
};

const View = (props: {
  transform: d3.ZoomTransform;
  width: number;
  height: number;
}) => {
  const { transform, width, height } = props;
  return (
    <rect
      className="view"
      x={0.5}
      y={0.5}
      width={width - 1}
      height={height - 1}
      transform={transform.toString()}
    />
  );
};

const Defs = () => (
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0.0%" stopColor="#2c7bb6" />
      <stop offset="12.5%" stopColor="#00a6ca" />
      <stop offset="25.0%" stopColor="#00ccbc" />
      <stop offset="37.5%" stopColor="#90eb9d" />
      <stop offset="50.0%" stopColor="#ffff8c" />
      <stop offset="62.5%" stopColor="#f9d057" />
      <stop offset="75.0%" stopColor="#f29e2e" />
      <stop offset="87.5%" stopColor="#e76818" />
      <stop offset="100.0%" stopColor="#d7191c" />
    </linearGradient>
  </defs>
);

const SVGZoom = (props: { width: number; height: number }) => {
  const svgRef = useRef(null);
  const buttonRef = useRef(null);
  const [transform, changeTransform] = useState(d3.zoomIdentity);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoomed = () => {
      changeTransform(d3.event.transform);
    };

    const zoom = d3
      .zoom()
      .scaleExtent([1 / 2, 8])
      .on("zoom", zoomed);
    zoom(svg as any);

    d3.select(buttonRef.current).on("click", () => {
      zoom.transform(svg.transition().duration(750) as any, d3.zoomIdentity);
    });
  }, []);

  return (
    <div className="svgZoom">
      <button ref={buttonRef}>Reset</button>
      <svg ref={svgRef} {...props}>
        <Defs />
        <View transform={transform} {...props} />
        <AxisX transform={transform} {...props} />
        <AxisY transform={transform} {...props} />
      </svg>
    </div>
  );
};

export default SVGZoom;
