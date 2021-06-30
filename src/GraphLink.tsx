import React, {ReactElement, useEffect, useRef} from "react";
import * as d3 from 'd3';

export interface Link {
  source: string;
  target: string;
}

interface GraphLinkProps<L extends Link> {
  link: L;
  draw?: (data: L) => ReactElement;
}

export default function GraphLink<L extends Link>(props: GraphLinkProps<L>): ReactElement {
  const ref = useRef<SVGGElement>(null);
  
  useEffect(() => {
    d3.select(ref.current).data([props.link])
  }, [props.link]);
  
  return (
    <g className="linkGroup" ref={ref}>
      { props.draw?.(props.link) ?? <line
          stroke={'#AAAAAAAA'}
          className="link"
      /> }
    </g>
  )
}
