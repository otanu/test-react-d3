import React, {
  useRef,
  useEffect,
  useReducer,
  createContext,
  useContext,
  useMemo
} from "react";
import * as d3 from "d3";
import "./SVGTree.css";

export interface NodeBase {
  name: string;
  children?: NodeBase[];
}
interface NodeData extends NodeBase {
  pos0: Point; // 移動開始位置
  pos1: Point; // 移動停止位置
  open: boolean; // 子のオープン状態
  visible: boolean;
  _children?: NodeData[]; // 子ノード保存用
  children?: NodeData[];
}
type Node = d3.HierarchyPointNode<NodeData>;
type NodeFuctory = (node: NodeData) => Node;

interface Point {
  x: number;
  y: number;
}

const createNodeFactory = (width: number, height: number): NodeFuctory => {
  const tree = d3.tree<NodeData>().size([height, width - 160]);
  return (node: NodeData) => tree(d3.hierarchy(node));
};

const initNode = (node: NodeBase, tree: NodeFuctory): Node => {
  const root = tree(node as NodeData);
  root.descendants().forEach(node => {
    node.data.pos0 = { x: root.x, y: root.y };
    node.data.pos1 = { x: node.x, y: node.y };
    node.data.visible = true;
    node.data.open = true;
  });
  return root;
};

const ActionClose = "ActionClose",
  ActionOpen = "ActionOpen",
  ActionRemove = "ActionRemove",
  ActionStop = "ActionStop";

type ActionType =
  | typeof ActionClose
  | typeof ActionOpen
  | typeof ActionRemove
  | typeof ActionStop;
interface Action {
  type: ActionType;
  node: Node;
  createNode: NodeFuctory;
}

function createOpenAction(node: Node, createNode: NodeFuctory): Action {
  return {
    type: ActionOpen,
    node,
    createNode
  };
}

function createCloseAction(node: Node, createNode: NodeFuctory): Action {
  return {
    type: ActionClose,
    node,
    createNode
  };
}
function createRemoveAction(node: Node, createNode: NodeFuctory): Action {
  return {
    type: ActionRemove,
    node,
    createNode
  };
}
function createStopAction(node: Node, createNode: NodeFuctory): Action {
  return {
    type: ActionStop,
    node,
    createNode
  };
}

function reducer(root: Node, action: Action): Node {
  const { type, node, createNode } = action;
  switch (type) {
    case ActionOpen:
      node.data.open = true;
      // 子が無い場合は退避されているものを戻す
      if (!node.children) {
        node.data.children = node.data._children;
        node.data._children = undefined;
      }
      // 位置再計算
      root = createNode(root.data);
      const newNode = root
        .descendants()
        .find(x => x.data.name == node.data.name);
      if (!newNode || !newNode.children) return root;

      const childrenUpdate = (children: Node[]) => {
        children.forEach(child => {
          child.data.visible = true;
          child.data.pos0 = { x: node.x, y: node.y };
          if (child.children) childrenUpdate(child.children);
        });
      };
      childrenUpdate(newNode.children);

      // 再計算で位置がズレている場合があるので、全ノードの位置を再設定する
      root.descendants().forEach(n => {
        if (n.data.visible) {
          n.data.pos1 = { x: n.x, y: n.y };
        }
      });
      return root;

    case ActionClose:
      if (!node.children) return root;
      node.data.open = false;

      const childUpdate = (children: Node[]) => {
        children.forEach(child => {
          child.data.visible = false;
          child.data.pos0 = child.data.pos1;
          child.data.pos1 = { x: node.x, y: node.y };
          if (child.children) {
            childUpdate(child.children);
          }
        });
      };
      childUpdate(node.children);
      return createNode(root.data);

    case ActionRemove:
      if (!node.parent || !node.parent.data.children || node.parent.data.open)
        return root;

      // 退避
      node.parent.data._children = node.parent.data.children;
      node.parent.data.children = undefined;

      // ノードが消えたことで位置が変わるので再計算
      root = createNode(root.data);
      root.descendants().forEach(n => {
        if (n.data.visible) {
          n.data.pos1 = { x: n.x, y: n.y };
        }
      });

      return root;
    case ActionStop:
      if (node.parent) {
        node.data.pos0 = { x: node.parent.x, y: node.parent.y };
      } else {
        node.data.pos0 = node.data.pos1;
      }
      return root; // 再計算なし
  }
  return root;
}

interface ContextState {
  dispatch: React.Dispatch<Action>;
  createNode: NodeFuctory;
}
const Context = createContext<ContextState>({} as any);

const App = (props: { width: number; height: number; data: NodeBase }) => {
  const { width, height, data } = props;
  const svgRef = useRef(null);

  // プロパティ更新時のみ動く初期化処理
  const { initialRoot, createNode } = useMemo(() => {
    const createNode = createNodeFactory(width, height);
    return {
      initialRoot: initNode(data, createNode),
      createNode
    };
  }, [width, height, data]);

  const [root, dispatch] = useReducer(reducer, initialRoot);

  return (
    <Context.Provider
      value={{
        dispatch: dispatch,
        createNode
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`-50,0,${width},${height}`}
        style={{ backgroundColor: "#ccc" }}
      >
        {root
          .descendants()
          .slice(1)
          .map(node => (
            <Link key={node.data.name} node={node} />
          ))}
        {root.descendants().map((node, i) => (
          <Node key={node.data.name} node={node} />
        ))}
      </svg>
    </Context.Provider>
  );
};

const dulation = 250;

const Node = (props: { node: Node }) => {
  const { node } = props;
  const { dispatch, createNode } = useContext(Context);
  const nodeGRef = useRef(null);

  useEffect(() => {
    const g = d3.select(nodeGRef.current);
    g.attr("transform", `translate(${node.data.pos0.y},${node.data.pos0.x})`);
  }, []);

  useEffect(() => {
    const g = d3.select(nodeGRef.current);
    g.on("click", () => {
      if (node.data.open) {
        dispatch(createCloseAction(node, createNode));
      } else {
        dispatch(createOpenAction(node, createNode));
      }
    });

    g.transition()
      .duration(dulation)
      .attr("transform", `translate(${node.data.pos1.y},${node.data.pos1.x})`)
      .attr("opacity", node.data.visible ? 1 : 0)
      .on("end", () => {
        if (!node.data.visible) {
          dispatch(createRemoveAction(node, createNode));
        } else {
          dispatch(createStopAction(node, createNode));
        }
      });
  }, [node]);

  return (
    <g ref={nodeGRef} opacity={0}>
      <circle r={8} fill={node.data.open ? "#999" : "#800"} />
      <text dy={3} x={-10} y={-5} style={{ textAnchor: "end" }} fontSize="200%">
        {props.node.data.name}
      </text>
    </g>
  );
};

const diagonal = d3
  .linkHorizontal<{}, Point>()
  .x(d => d.y)
  .y(d => d.x);

const Link = (props: { node: Node }) => {
  const { node } = props;
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = d3.select(pathRef.current);
    // transitionを有効にするため、初期位置に長さ0の属性を設定
    const data = { source: node.data.pos0, target: node.data.pos0 };
    path.datum(data).attr("d", diagonal);
  }, []);

  useEffect(() => {
    const path = d3.select(pathRef.current);
    let data: { source: Point; target: Point };
    if (node.data.visible) {
      data = { source: node.parent!, target: node.data.pos1 };
    } else {
      data = { source: node.data.pos1, target: node.data.pos1 };
    }

    path
      .datum(data)
      .transition()
      .duration(dulation)
      .attr("d", diagonal);
  }, [node]);

  return (
    <>
      <path ref={pathRef} className="link" />
    </>
  );
};

export default App;
