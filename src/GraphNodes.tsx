import * as d3 from "d3";
import React, {ReactElement, useEffect, useRef} from "react";
import {v4 as uuid} from "uuid";
import {Datum} from "./datum";
import GraphNode, {NodeData, NodeMouseEvents} from "./GraphNode";

interface NodesProps<N extends NodeData> {
  nodes: N[];
  restartDrag: () => void;
  stopDrag: () => void;
  node?: (data: N) => ReactElement;
  mouseEvents: Partial<NodeMouseEvents<N>>;
}

export default function GraphNodes<N extends NodeData>(props: NodesProps<N>): ReactElement{
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    d3.select(ref.current).selectChildren<SVGGElement, N & Datum>()
    .call(
      d3.drag<SVGGElement, N & Datum>()
      .on('start', (event: any, d: Datum) => {
        if (!event.active) props.restartDrag()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event: any, d: Datum) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event: any, d: Datum) => {
        if (!event.active) {
          props.stopDrag()
        }
        d.fx = null
        d.fy = null
      })
    );
  })
  
  return <g ref={ref} className="graph-nodes">{props.nodes.map(node => <GraphNode<N> draw={props.node} key={`node-${uuid()}`} node={node} mouseEvents={props.mouseEvents}/>)}</g>;
}
