import * as d3 from "d3";
import React, {MouseEvent, MouseEventHandler, ReactElement, useEffect, useRef} from "react";

export interface NodeData {
  id: string;
  radius?: number;
  fill?: string;
  groups?: string[];
}

export type NodeMouseEvent<N extends NodeData> = (event: MouseEvent<SVGGElement>, node: N) => void

export interface NodeMouseEvents<N extends NodeData> {
  onClick: NodeMouseEvent<N>;
  onMouseEnter: NodeMouseEvent<N>;
  onMouseLeave: NodeMouseEvent<N>;
  onMouseDown: NodeMouseEvent<N>;
  onMouseUp: NodeMouseEvent<N>;
}

export interface NodeProps<N extends NodeData> {
  node: N
  draw?: (data: N) => ReactElement;
  mouseEvents: Partial<NodeMouseEvents<N>>
}

export default function GraphNode<N extends NodeData>(props: NodeProps<N>): ReactElement {
  const ref = useRef<SVGGElement>(null);
  
  useEffect(() => {
    d3.select(ref.current).data([props.node])
  }, [props.node])
  
    const mouseEvents = (Object.keys(props.mouseEvents) as (keyof NodeMouseEvents<N>)[])
    .reduce((events, eventName) => ({...events, [eventName]: (event: MouseEvent<SVGGElement>) => props.mouseEvents?.[eventName]?.(event, props.node)}), {} as { [K in keyof NodeMouseEvents<any>]: MouseEventHandler<SVGGElement>});
    return (
      <g className="graph-node" ref={ref} {...mouseEvents}>
        { props.draw?.(props.node) ?? <path
          d="M 0,-1 L .866,-.5 L .866,.5 L 0,1 L -.866,.5 L -.866,-.5 Z"
          transform={"scale(" + (props.node.radius ?? 10) + ")"}
          fill={'black'}
        /> }
      </g>
    )
}
