import * as d3 from "d3";
import React, {ReactElement} from "react";
import {Datum} from "./datum";
import {NodeData} from "./GraphNode";

export interface GroupStyle {
  fill: string;
  stroke: string;
  opacity: number;
}

interface GraphGroupsProps<N extends NodeData> {
  onTick: (callback: () => void) => void;
  groupStyle: (groupId: string) => GroupStyle;
  nodes: d3.Selection<SVGGElement, N & Datum, any, any>;
}

function groupIdsFrom(nodes: NodeData[]): string[] {
  return [...new Set(nodes.flatMap( node => node.groups ?? []))]
  .map( groupId => ({
    groupId: groupId,
    count: nodes.filter(node => node.groups?.includes(groupId)).length
  }))
  .filter( function(group) { return group.count > 2;})
  .map( function(group) { return group.groupId; });
}

export default class GraphGroups<N extends NodeData> extends React.PureComponent<GraphGroupsProps<N>> {
  
  groupIds = groupIdsFrom(this.props.nodes.data());
  
  groupPath = d3.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; })
    .curve(d3.curveCatmullRomClosed)
  
  polygon(groupId: string): [number, number][] {
    const nodeCoords = this.props.nodes
    .filter( (node: any) => {
      return (node?.groups ?? []).includes(groupId); })
    .data()
    .map((node: any) => { return [node.x, node.y] as [number, number]; });
    return d3.polygonHull(nodeCoords)!;
  }
  
  updateGroup(): void{
    this.groupIds.forEach((groupId) =>  {
  
      let centroid: [number, number] = [0,0];
      const path = d3.selectAll('path').filter( (d) => { return d === groupId;})
      .attr('transform', 'scale(1) translate(0,0)')
      .attr('d', (d: any) => {
        const polygon = this.polygon(d);
        centroid = d3.polygonCentroid(polygon);
        return this.groupPath(
          polygon.map(function(point) {
            return [  point[0] - centroid[0], point[1] - centroid[1] ];
          })
        );
      });
    
      d3.select((path.node()! as any).parentNode).attr('transform', 'translate('  + centroid[0] + ',' + (centroid[1]) + ') scale(1.4)');
    });
  }
  
  initializeGroups(): void {
    d3.select('.groups')
    .selectAll('.path_placeholder')
    .data(this.groupIds)
    .enter()
    .append('g')
    .attr('class', 'path_placeholder')
    .append('path')
    .attr('stroke', d => this.props.groupStyle(d).stroke)
    .attr('fill', d => this.props.groupStyle(d).fill)
    .attr('opacity', d => this.props.groupStyle(d).opacity);
  }
  
  componentDidMount(): void {
    this.initializeGroups();
    this.props.onTick(() => {
      this.updateGroup();
    });
  }
  
  render(): ReactElement {
    return (
      <g className="groups" />
    )
  }
}
