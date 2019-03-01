import React, {
  Component,
  useRef,
  useState,
  useCallback,
  useEffect
} from "react";
import "./App.css";
import * as d3 from "d3";

const SVGPure = () => {
  return (
    <svg className="svg-root" width="200" height="100">
      <circle cx="100" cy="50" r="10" fill="red" />
    </svg>
  );
};

const SVGPureClick = () => {
  const [fill, fillChg] = useState(true);
  const onClick = useCallback(() => {
    fillChg(prev => !prev);
  }, []);
  return (
    <svg className="svg-root" width="200" height="100">
      <circle
        cx="100"
        cy="50"
        r="10"
        fill={fill ? "red" : "blue"}
        onClick={onClick}
      />
    </svg>
  );
};

const SVGD3 = () => {
  const svgRef = useRef(null);
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .append("circle")
      .attr("cx", 100)
      .attr("cy", 50)
      .attr("r", 10)
      .attr("fill", "red");
  }, []);
  return <svg ref={svgRef} className="svg-root" width="200" height="100" />;
};
const SVGD3Click = () => {
  const svgRef = useRef(null);
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .append("circle")
      .datum({ fill: true })
      .attr("cx", 100)
      .attr("cy", 50)
      .attr("r", 10)
      .attr("fill", "red")
      .on("click", function(this) {
        d3.select<SVGCircleElement, { fill: boolean }>(this).attr("fill", d => {
          d.fill = !d.fill;
          return d.fill ? "blue" : "red";
        });
      });
  }, []);
  return <svg ref={svgRef} className="svg-root" width="200" height="100" />;
};

const SVGD3ClickTransition = () => {
  const svgRef = useRef(null);
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .append("circle")
      .datum({ fill: true })
      .attr("cx", 100)
      .attr("cy", 50)
      .attr("r", 10)
      .attr("fill", "red")
      .on("click", function(this) {
        d3.select<SVGCircleElement, { fill: boolean }>(this)
          .transition()
          .duration(1000)
          .attr("fill", d => {
            d.fill = !d.fill;
            return d.fill ? "blue" : "red";
          });
      });
  }, []);
  return <svg ref={svgRef} className="svg-root" width="200" height="100" />;
};

const Circl = (props: { x: number; y: number; r: number }) => {
  const { x, y, r } = props;
  const [fill, fillChg] = useState(true);
  const onClick = useCallback(() => {
    fillChg(prev => !prev);
  }, []);
  const circleRef = useRef(null);

  useEffect(() => {
    const circle = d3.select(circleRef.current);
    circle
      .transition()
      .duration(1000)
      .attr("fill", fill ? "red" : "blue");
  }, [fill]);

  return (
    <circle ref={circleRef} cx={x} cy={y} r={r} onClick={onClick} fill="red" />
  );
};

const SVGD3ClickTransitionReact = () => {
  return (
    <svg className="svg-root" width="200" height="100">
      <Circl x={50} y={50} r={10} />
      <Circl x={100} y={50} r={10} />
      <Circl x={150} y={50} r={10} />
    </svg>
  );
};

const Circl2 = (props: { x: number; y: number; r: number }) => {
  const { x, y, r } = props;
  const [fill, fillChg] = useState(true);
  const [fillAttr, fillAttrChg] = useState("red");
  const onClick = useCallback(() => {
    fillChg(prev => !prev);
  }, []);
  const circleRef = useRef(null);

  useEffect(() => {
    const circle = d3.select(circleRef.current);
    circle
      .transition()
      .duration(1000)
      .attr("fill", fill ? "red" : "blue")
      .on("end", () => {
        fillAttrChg(fill ? "red" : "blue");
      });
  }, [fill]);

  return (
    <circle
      ref={circleRef}
      cx={x}
      cy={y}
      r={r}
      onClick={onClick}
      fill={fillAttr}
    />
  );
};

const SVGD3ClickTransitionReact2 = () => {
  return (
    <svg className="svg-root" width="200" height="100">
      <Circl2 x={50} y={50} r={10} />
      <Circl2 x={100} y={50} r={10} />
      <Circl2 x={150} y={50} r={10} />
    </svg>
  );
};


class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>D3なし</h1>
        <SVGPure />
        <h1>D3なし+クリック</h1>
        <SVGPureClick />
        <h1>D3</h1>
        <SVGD3 />
        <h1>D3+クリック</h1>
        <SVGD3Click />
        <h1>D3+クリック+トランジション</h1>
        <SVGD3ClickTransition />
        <h1>React+トランジション(D3)</h1>
        <SVGD3ClickTransitionReact />
        <h1>React+トランジション(D3)+完了イベント追加</h1>
        <SVGD3ClickTransitionReact2 />
      </div>
    );
  }
}

export default App;
