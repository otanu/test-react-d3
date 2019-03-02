import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";
import * as d3 from "d3";
import { SimulationNodeDatum } from "d3-force";
import "./SVGForceSimulation.css";


interface NodeItem extends SimulationNodeDatum {
  id: number;
  name: string;
  val: number;
}

function useStateRef<S>(
  init: S
): [S, (t: S | ((prev: S) => S)) => void, React.MutableRefObject<S>] {
  const [s, sf] = useState(init);
  const r = useRef(s);
  r.current = s;
  return [s, sf, r];
}

const Node = (props: {
  node: NodeItem;
  dragStart: () => void;
  dragEnd: () => void;
  updateNodes: () => void;
}) => {
  const gRef = useRef(null);
  const { node, dragStart, dragEnd, updateNodes } = props;
  const transform = `translate(${node.x},${node.y})`;

  useEffect(() => {
    const g = d3.select(gRef.current!);
    g.datum(node).call(d3
      .drag<Element, NodeItem>()
      .on("start", d => {
        d.fx = d.x;
        d.fy = d.y;
        dragStart();
      })
      .on("drag", d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
        updateNodes();
      })
      .on("end", d => {
        d.fy = d.fx = undefined;
        dragEnd();
      }) as any);
  }, []);

  return (
    <g className="node" ref={gRef} transform={transform}>
      <circle r={node.val} />
      <text x={node.val + 5} dy=".35em">
        {node.name}
      </text>
    </g>
  );
};

const SVGForceSimulation = (props: { width: number; height: number, nodes: NodeItem[] }) => {
  const { width, height } = props;
  const svgRef = useRef(null);
  const [zoomTransform, changeZoromTransform, zoomTransformRef] = useStateRef(
    d3.zoomIdentity
  );
  const [nodes, nodesChg] = useState(props.nodes);

  const force = useMemo(() => {
    const force = d3
      .forceSimulation()
      .nodes(nodes)
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collide", d3.forceCollide<NodeItem>().radius(d => d.val));
    force.on("tick", () => {
      nodesChg(prev => [...prev]);
    });
    return force;
  }, [width, height]);

  const dragStart = useCallback(() => {
    force.alphaTarget(0.3).restart();
  }, [force]);
  const dragEnd = useCallback(() => {
    force.alphaTarget(0);
  }, [force]);
  const updateNodes = useCallback(() => {
    force.alpha(1).restart();
  }, [force]);

  const svgClick = useCallback(() => {
    const [x, y] = zoomTransformRef.current.invert([
      d3.event.offsetX,
      d3.event.offsetY
    ]);
    nodesChg(prev => {
      const item: NodeItem = {
        id: prev.length + 1,
        name: `${prev.length + 1}`,
        val: 30,
        x: x,
        y: y
      };
      const newNodes = [...prev, item];
      force.nodes(newNodes);
      return newNodes;
    });
    updateNodes();
  }, [force]);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);

    const zoom = d3
      .zoom()
      .scaleExtent([1, 40])
      .translateExtent([[-100, -100], [width + 90, height + 100]]);
    zoom.on("zoom", () => {
      changeZoromTransform(d3.event.transform);
    });
    zoom(svg as any);

    svg.on("click", svgClick);
  }, []);

  return (
    <svg
      width={width}
      height={height}
      style={{ backgroundColor: "#ccc" }}
      className="xxx"
      ref={svgRef}
    >
      <g transform={zoomTransform.toString()}>
        {nodes.map(node => {
          return (
            <Node
              key={node.id}
              node={node}
              updateNodes={updateNodes}
              dragStart={dragStart}
              dragEnd={dragEnd}
            />
          );
        })}
      </g>
    </svg>
  );
};

export default SVGForceSimulation;
