import React, {ReactElement} from "react";
import GraphLink, {Link} from "./GraphLink";
import {v4 as uuid} from 'uuid';

interface GraphLinksProps<L extends Link> {
  links: L[];
  link?: (link: L) => ReactElement;
}

export default function GraphLinks<L extends Link>(props: GraphLinksProps<L>): ReactElement {
  return <g className="links">{props.links.map(link => <GraphLink key={`links-${uuid()}`} link={link} draw={props.link}/>)}</g>
}
