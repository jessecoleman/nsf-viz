import * as d3 from 'd3';
import { Selection } from './D3utils';
import D3Timeline, { BrushCallback, TimelineData } from './D3Timeline';
import { colorScales } from 'theme';
import { removeTooltip, transitionTooltip } from './D3Tooltip';

export type AggFields = {
  count: number
  amount: number
}

export type Data = {
  year: number
  aggs: Record<string, AggFields>
}

type Series = {
  key: string
  data: Data
}

export type Dimensions = {
  width: number
  height: number
}

type ChartCallback = (key: string, year: number) => void

type ChartProps = {
  dimensions: Dimensions
  containerEl: HTMLDivElement
  onTooltipEnter: ChartCallback
  onTooltipLeave: ChartCallback
  onBarClick: ChartCallback
  onBrushEnded: BrushCallback
};

export type Layout = {
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  stack: d3.Series<Data, string>[];
  divs: string[];
  years: number[];
 };
 
export default class D3Component {
  // DOM layout
  containerEl: HTMLDivElement;
  tooltip?: Selection<HTMLDivElement>;
  padding = { top: 10, bottom: 20, left: 50, right: 10 };
  timelineLayout = { height: 80, padding: this.padding };
  svg: Selection<SVGSVGElement>;
  chart: Selection<SVGGElement>;
  timeline: D3Timeline;
  // chart dimensions
  chartWidth: number;
  chartHeight: number;
  x = d3.scaleBand<number>().padding(0.2);
  y = d3.scaleLinear().nice();
  // data
  stack: d3.Series<Data, string>[] = [];
  divs: string[] = [];
  years: number[] = [];
  agg: keyof AggFields = 'count';
  color: d3.ScaleOrdinal<string, string> = colorScales[this.agg];
  prev?: Layout;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  gridLines: Selection<SVGGElement>;
  onTooltipEnter: ChartCallback
  onTooltipLeave: ChartCallback
  onBarClick: ChartCallback
  animationDur = 1000;
  
  constructor(props: ChartProps) {
    
    this.containerEl = props.containerEl;
    // bind callbacks
    this.onTooltipEnter = props.onTooltipEnter;
    this.onTooltipLeave = props.onTooltipLeave;
    this.onBarClick = props.onBarClick;

    this.chartWidth = props.dimensions.width - this.padding.left - this.padding.right;
    // TODO better formula
    this.chartHeight = props.dimensions.height - this.padding.top - 2*this.padding.bottom - this.timelineLayout.height;

    const container = d3.select(this.containerEl);
    // react-dev-server keeps appending on hot-reload
    container.select('#chart-area').remove();
    
    // append elements
    this.svg = container.append('svg')
      .attr('id', 'chart-area')
      // .attr('xmlns', 'http://www.w3.org/2000/svg')
      // .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('version', '1.1')
      .attr('xml:space', 'preserve');
    
    this.chart = this.svg
      .append('g')
      .classed('chart', true);

    this.gridLines = this.chart.append('g')
      .classed('gridline', true);

    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x');

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y');
    
      
    this.timeline = new D3Timeline({
      svg: this.svg,
      padding: {
        ...this.padding,
        top: this.padding.top + this.chartHeight + this.padding.bottom
      },
      chartWidth: this.chartWidth,
      chartHeight: this.timelineLayout.height,
      onBrushEnded: props.onBrushEnded,
      tickFormat: this.tickFormat,
    });
      
    const defs = this.svg.append('defs');
    
    defs.append('style')
      .attr('type', 'text/css')
      // eslint-disable-next-line quotes
      .text("@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700,800');");
        
    // TODO implement filter for hover?
    defs.append('filter')
      .attr('id', 'shadow')
      .html(`
        <filter id="f3" x="0" y="0" width="200%" height="200%">
        <feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      `);
    
    this.measure(props.containerEl.clientWidth, props.containerEl.clientHeight);
  }
  
  // TODO better formatting of decimals
  tickFormat = {
    x: d3.format('d'),
    y: (d: number) => (this.agg === 'amount' ? '$' : '') + d3.format('.2s')(d)
      .replace(/G/, 'B')
      .replace(/\.0$/, '')
      .replace(/\d+m/, '')
  }
      
  getGridLines = () => d3.axisLeft<number>(this.y)
    .tickSize(-this.chartWidth)
    .tickFormat(() => '');

  // takes scale as prop to support animating between prev/next state
  getXAxis = (scale: d3.ScaleBand<number>) => d3.axisBottom<number>(scale)
    .tickFormat(this.tickFormat.x);

  getYAxis = () => d3.axisLeft<number>(this.y)
    .tickFormat(this.tickFormat.y)
    .ticks(5);
    
  measure = (width: number, height: number) => {
    this.chartWidth = width - this.padding.left - this.padding.right;
    this.chartHeight = height - this.padding.top - 2*this.padding.bottom - this.timelineLayout.height;

    this.svg
      .attr('width', width)
      .attr('height', height);
      
    this.chart
      .attr('transform', `translate(${this.padding.left}, ${this.padding.top})`);
      
    this.x.rangeRound([0, this.chartWidth]);
      
    this.y.rangeRound([this.chartHeight, 0]);

    this.redraw();
    
    this.timeline.measure(
      {
        ...this.padding,
        top: this.padding.top + this.chartHeight + this.padding.bottom
      },
      this.chartWidth,
      this.timelineLayout.height,
    );
  }
 
  update = (data: Data[], divDomain: string[], agg?: keyof AggFields) => {

    this.years = data.map(d => d.year);
    this.divs = divDomain;
    if (agg) this.agg = agg;

    this.stack = this.getStack(data, divDomain, this.agg);
    this.x.domain(this.years);
    this.y.domain([0, Math.max(...this.stack.flat().flat())]);
    this.color = colorScales[this.agg];
    this.color.domain(this.divs);
    this.redraw();
  }
  
  redraw = () => {
   
    this.updateAxes();

    const prevDivIndices = Object.fromEntries(this.prev?.divs.map((d, i) => [d, i]) ?? []);
    const divIndices = Object.fromEntries(this.divs.map((d, i) => [d, i]));

    const sameDomain = (
      this.prev &&
      this.prev.years[0] === this.years[0] &&
      this.prev.years.length === this.years.length
    );
 
    const offsets = {};
    if (this.prev && this.prev.divs.length !== this.divs.length) {
      // determine whether groups were added or removed
      const [ sub, sup ] = this.prev.divs.length < this.divs.length 
        ? [ this.prev.divs, this.divs ]
        : [ this.divs, this.prev.divs ];
      
      let offset = 0; // track offset between sub/sup
      sub.forEach((key, i) => {
        while (key !== sup[i + offset]) {
          offsets[sup[i + offset]] = offset;
          offset += 1;
        }
      });
    } else {
      this.divs.forEach(d => {
        offsets[d] = -1;
      });
    }
 
    const stacks = this.chart.selectAll<SVGGElement, Series>('.bars')
      .data(this.stack, d => d.key)
      .join(
        enter => enter.append('g')
          .attr('class', d => `bars ${d.key}`),
        update => update,
        // only applies to exiting div groups, not year stacks
        exit => {
          exit.each((div, i, stack) => {
            d3.select<SVGGElement, Series[]>(stack[i])
              .selectAll<SVGGElement, Series>('.bar')
              .transition()
              .duration(this.animationDur)
              .attr('height', 0)
              .attr('y', (d, i) => {
                if (this.prev) {
                  const idx = prevDivIndices[div.key];
                  const prevGroup = this.stack[idx - offsets[div.key]];
                  if (prevGroup) {
                    return this.y(prevGroup[i][0]);
                  }
                }
                return this.y(d[0]);
              })
              .remove();
          });
          exit.transition()
            .duration(this.animationDur)
            .remove();
        }
      );
      
    stacks
      .transition()
      .duration(this.animationDur)
      .attr('fill', d => this.color(d.key));
      
   
    stacks.each((div, i, stack) => {
      const bars = d3.select<SVGGElement, Series[]>(stack[i])
        .selectAll<SVGRectElement, Series>('.bar')
        .data(d => d, d => d.data.year)
        .join(
          enter => enter
            .append('rect')
            .classed('bar', true)
            .attr('x', d => this.getXTransition(d.data.year, this.prev))
            .attr('width', this.prev ? this.prev.x.bandwidth : this.x.bandwidth())
            // TODO we need these transitions for entering years
            // .attr('y', d => this.prev ? this.prev.y(d[1]) : 0)
            // .attr('height', d => this.prev ? this.prev.y(d[0]) - this.prev.y(d[1]) : 0)
            .attr('height', 0)
            // necessary to align new bars vertically during transition
            .attr('y', (d, i) => {
              if (this.prev) {
                const idx = divIndices[div.key];
                // will be undefined if bottom of stack
                const prevGroup = this.prev.stack[idx - offsets[div.key]];
                if (prevGroup && sameDomain) {
                  return this.prev.y(prevGroup[i][0]);
                }
              }
              // first group in stack, first load, or entering years
              return this.chartHeight;
            })
            // only fade in from sides
            .style('opacity', d => this.prev?.x(d.data.year) ? 1 : 0),
          update => update,
          // only applies to exiting year stacks, not div groups
          exit => exit
            .transition()
            .duration(this.animationDur)
            .attr('width', this.x.bandwidth())
            .attr('x', d => this.getXTransition(d.data.year, this))
            .attr('height', d => this.y(d[0]) - this.y(d[1]))
            .attr('y', d => this.y(d[1]))
            .style('opacity', 0)
            .remove()
        );
      
      bars
        .transition()
        .duration(this.animationDur)
        .attr('width', this.x.bandwidth())
        .attr('x', d => this.x(d.data.year) ?? 0)
        .attr('height', d => this.y(d[0]) - this.y(d[1]))
        .attr('y', d => this.y(d[1]))
        .style('opacity', 1)
        .on('end', () => {
          this.prev = {
            x: this.x.copy(),
            y: this.y.copy(),
            stack: this.stack,
            divs: this.divs,
            years: this.years,
          };
        });

      bars
        .on('mouseover', (e, d) => {
          const rect: SVGRectElement = e.target;
          d3.select(rect).classed('selected', true);

          this.onTooltipEnter(div.key, d.data.year);

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const chart = this.svg.node()!.getBoundingClientRect();
          const bar = rect.getBoundingClientRect();
          const bandwidth = this.x.bandwidth();
          const padding = bandwidth * this.x.padding();
          transitionTooltip(div.key, {
            chart,
            bar,
            bandwidth,
            padding,
          });
        })
        .on('mouseleave', (e, d) => {
          d3.select(e.target).classed('selected', false);
          this.onTooltipLeave(d.key, d.data.year);
          removeTooltip();
        })
        .on('click', (e, d) => {
          d3.select(e.target).classed('selected', false);
          this.onBarClick(d.key, d.data.year);
        });
    });
  }
  
  getStack = (data: Data[], domain: string[], agg: keyof AggFields) => (
    d3.stack<Data, string>()
      .keys(domain)
      .value((d, key) => d.aggs[key]?.[agg] ?? 0)
      .order(d3.stackOrderNone)(data)
  )

  // TODO make this implement ScaleBand interface
  getXTransition = (year: number, layout?: Layout) => {
    // layout is null on initial render
    if (layout) {
      const [ first, last ] = [
        layout.years[0],
        layout.years[layout.years.length - 1]
      ];
      const width = layout.x.step(); 

      if (year < first) {
        return (year - first) * width;
      } else if (year > last) {
        return this.chartWidth + (year - last) * width;
      }
    }
    return this.x(year) ?? 0;
  }
  
 
  updateAxes = () => {

    /*
    *const domain = this.x.domain();
    *const padding = this.x(domain[0])!;
    *const range = [-15, 15];
    *const newDomain = Array.from({ length: domain.length + range[1] - range[0] }, (x, i) => domain[0] + range[0] + i);
    *const newRange = range.map((r, i) => ((i + 1) * padding) + (this.x.bandwidth() * (r + i * newDomain.length)));
    *const x2 = d3.scaleBand<number>()
    *  .rangeRound(range.map((r, i) => padding + this.x.bandwidth() * (r + i * domain.length)))
    *  .domain(newDomain)
    *  .padding(0.2);
    */

    this.xAxis.transition()
      .duration(this.animationDur)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.getXAxis(this.x));
      
    this.yAxis.transition()
      .duration(this.animationDur)
      .call(this.getYAxis());
      
    this.gridLines.transition()
      .duration(this.animationDur)
      .call(this.getGridLines());
  }
  
  highlightGroup = (group?: string) => {
    d3.selectAll('.bars')
      .selectAll('.bar')
      .classed('selected', false);
    
    if (group) {
      d3.selectAll(`.${group}-count`)
        .selectAll('.bar')
        .classed('selected', true);
    }
  }
}
