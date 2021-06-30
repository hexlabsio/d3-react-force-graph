import {Simulation} from "d3";
import React, {memo, MouseEvent, ReactElement, useEffect, useLayoutEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import {Datum} from "./datum";
import GraphGroups, {GroupStyle} from "./GraphGroups";
import {Link} from "./GraphLink";
import GraphLinks from "./GraphLinks";
import {NodeData, NodeMouseEvents} from "./GraphNode";
import GraphNodes from "./GraphNodes";

export interface GraphData<N extends NodeData, L extends Link> {
  nodes: N[],
  links: L[]
}

export interface ForceDirectedGraphProps<N extends NodeData, L extends Link> {
  width: number;
  height: number;
  data: GraphData<N,L>;
  groupStyle?: (groupId: string) => GroupStyle;
  simulation?: () => Simulation<N & Datum, L>;
  node?: (data: N) => ReactElement;
  link?: (data: L) => ReactElement;
  mouseMove?: (x: number, y: number) => void;
  nodeMouseEvents?: Partial<NodeMouseEvents<N>>;
  restartDrag?: () => void;
  stopDrag?: () => void;
  fade?: number;
}

type NodeSelection<N extends NodeData> = d3.Selection<SVGGElement, N & Datum, any, any>;


function ForceDirectedGraph<N extends NodeData, L extends Link>(props: ForceDirectedGraphProps<N, L>): ReactElement {
  
  const simulation = useRef<Simulation<N & Datum, any> | null>(null);
  const groupUpdate = useRef<(() => void) | null>(null);
  const dragging = useRef(false);
  
  const svgElement = useRef<SVGSVGElement>(null);
  const graphContainer = useRef<SVGGElement>(null);
  const [nodes, setNodes] = useState<d3.Selection<SVGGElement, N & Datum, any, any>>();
  const links = useRef<d3.Selection<SVGGElement, LinkDatum<N, L>, any, any> | null>(null);
  
  function nodeSelection(): NodeSelection<N> {
    return d3.select(graphContainer.current).selectChild('.graph-nodes').selectChildren<SVGGElement, N & Datum>('.graph-node');
  }
  
  useEffect(() => { setNodes(nodeSelection()); }, []);
  useLayoutEffect(() => {
    if (nodes) {
      createSimulation()
      configureZoom();
    }
  });
  
  function createSimulation(){
      const newSimulation = (props.simulation ?? (() => {
        const simulation = d3.forceSimulation<N & Datum>();
        simulation.force('link', d3.forceLink<N & Datum, LinkDatum<N, L>>().id(({id}) => id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(props.width / 2, props.height / 2))
        .nodes(props.data.nodes as Array<N & Datum>);
  
        (simulation.force('link') as any)?.links(props.data.links);
        return simulation;
      }))();

      simulation.current = newSimulation;
      const nodes = d3.select(graphContainer.current).selectChild('.graph-nodes').selectChildren<SVGGElement, N & Datum>('.graph-node');
      nodes.data(props.data.nodes);
      links.current = d3.selectAll<SVGGElement, LinkDatum<N, L>>('.link');
      links.current.data(props.data.links)
      simulation.current.nodes(props.data.nodes as Array<N & Datum>).on('tick', onTickHandler(nodes, links.current, () => {
        if (groupUpdate.current) groupUpdate.current();
      }))
      
      if(props.fade)
        fadeOnHover(props.fade, nodes, links.current);
  }
  
  function fadeOnHover(opacity: number, nodes: d3.Selection<SVGGElement, N & Datum, any, any>, links: d3.Selection<SVGGElement, LinkDatum<N, L>, any, any>) {
    nodes.on('mouseover.fade', (event: MouseEvent<SVGGElement>, current: N) => {
      nodes.style('fill-opacity', n => {
        return (dragging.current || isConnected(links, current, n)) ? 1 : opacity;
      });
      links.style('stroke-opacity', o => (dragging.current || o.source === current || o.target === current ? 1 : opacity));
    });
    nodes.on('mouseout.fade', () => {
      nodes.style('fill-opacity', 1);
      links.style('stroke-opacity', 1);
    });
  }
  
  function isConnected(links: d3.Selection<SVGGElement, LinkDatum<N, L>, any, any>, source: N, target: N): boolean {
    if(source === target) return true;
    return links.data().some(it => (it.source === source && it.target === target) || (it.target === source && it.source === target))
  }
  
  function configureZoom() {
    d3.select(svgElement.current).call(d3.zoom().extent([[0, 0], [props.width, props.height]]).scaleExtent([0.1, 8]).on('zoom', event => {
      d3.select(graphContainer.current).attr('transform', event.transform);
    }) as any)
  }
  
  function restartDrag(){
    if (simulation.current) {
      dragging.current = true;
      nodes?.style('fill-opacity', 1);
      links.current?.style('stroke-opacity', 1);
      simulation.current.alphaTarget(0.2).restart();
      props.restartDrag?.();
    }
  }

  function stopDrag(){
    if (simulation.current) {
      dragging.current = false;
      simulation.current.alphaTarget(0);
      props.stopDrag?.();
    }
  }
  
  return (<svg ref={svgElement} viewBox={`0,0,${props.width}, ${props.height}`} width={props.width} height={props.height} pointerEvents={'all'} onMouseMove={event => props.mouseMove?.(event.clientX, event.clientY)}>
      <g ref={graphContainer} className="graph-container">
        {nodes ? <GraphGroups<N> nodes={nodes} onTick={callback => {
          groupUpdate.current = callback;
        }} groupStyle={props.groupStyle}/> : <></> }
        <GraphLinks<L> links={props.data.links} link={props.link} />
        <GraphNodes<N> nodes={props.data.nodes} node={props.node} restartDrag={() => restartDrag()} stopDrag={stopDrag} mouseEvents={props.nodeMouseEvents ?? {}} />
      </g>
    </svg>
  )
}

export default memo(ForceDirectedGraph, (a,b) => a.data === b.data && a.width === b.width && a.height === b.height) as typeof ForceDirectedGraph;

type LinkDatum<N extends NodeData, L extends Link> = Omit<L, 'source' | 'target'> & {source: N & Datum, target: N & Datum};

function onTickHandler<N extends NodeData, L extends Link>(
  nodes: d3.Selection<SVGGElement, N & Datum, any, any>,
  links: d3.Selection<SVGGElement, LinkDatum<N,L>, any, any>,
  updateGroups: () => void
  ) {
  return () => {
    nodes.attr('transform', d => `translate(${d.x}, ${d.y})`)
    links
      .attr('x1', link => link.source.x)
      .attr('y1', link => link.source.y)
      .attr('x2', link => link.target.x)
      .attr('y2', link => link.target.y);
    updateGroups();
  }
}
