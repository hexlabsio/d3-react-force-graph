import React, {ReactElement, useState} from "react";
import ForceDirectedGraph, {ForceDirectedGraphProps} from "./ForceDirectedGraph";
import {Link} from "./GraphLink";
import {NodeData} from "./GraphNode";

type VisualizeProps<N extends NodeData, L extends Link> = ForceDirectedGraphProps<N,L> & {
  tooltip?: (node: N, location: {x: number, y: number}) => ReactElement;
};

export function Visualize<N extends NodeData, L extends Link>(props: VisualizeProps<N, L> ): ReactElement {
  const [node, setNode] = useState<N | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mouseLocation, setMouseLocation] = useState({x:0, y: 0});
  const graphProps: ForceDirectedGraphProps<N, L> = {
    ...props,
    mouseMove: (x: number, y: number) => {setMouseLocation({x,y})},
    nodeMouseEvents: {
      ...props.nodeMouseEvents,
      onMouseEnter: (e, node) => {
        setTimeout(() => setNode(node), 200);
        props.nodeMouseEvents?.onMouseEnter?.(e, node);
      },
      onMouseLeave: (e, node) => {
        setNode(null);
        setTimeout(() => setNode(null), 200);
        props.nodeMouseEvents?.onMouseLeave?.(e, node);
      }
    },
    restartDrag: () => setDragging(true),
    stopDrag: () => setDragging(false),
  }
  return <>
    <ForceDirectedGraph<N,L> {...graphProps}/>
    {(props.tooltip && node && !dragging) ? props.tooltip(node, {x: mouseLocation.x + 30, y: mouseLocation.y - 30}) : <></> }
  </>;
}

