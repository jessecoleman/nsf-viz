import * as d3 from 'd3';
import { Selection, debounce } from './D3utils';
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

type ChartCallback = (key: string, year: number) => void

type D3Props = {
  containerEl: HTMLDivElement;
  tooltipEl?: HTMLDivElement;
  data: Data[]
  divDomain: string[]
  onTooltipEnter: ChartCallback
  onTooltipLeave: ChartCallback
  onBarClick: ChartCallback;
  onBrushEnded: BrushCallback
  // width: number
  // height: number
};

export type Layout = {
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  stack: d3.Series<Data, string>[];
  divs: string[];
  years: number[];
 };
 
class D3Component {
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
  stack: d3.Series<Data, string>[];
  divs: string[] = [];
  years: number[] = [];
  agg: keyof AggFields = 'count';
  color: d3.ScaleOrdinal<string, string> = colorScales[this.agg];
  prev?: Layout;
  getXAxis: (scale: d3.ScaleBand<number>) => d3.Axis<number>;
  getYAxis: () => d3.Axis<number>;
  getGridLines: () => d3.Axis<number>;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  gridLines: Selection<SVGGElement>;
  onTooltipEnter: ChartCallback
  onTooltipLeave: ChartCallback
  onBarClick: ChartCallback
  resizeDebounced = debounce();
  animationDur = 1000;
  
  constructor(props: D3Props) {
    
    this.containerEl = props.containerEl;
    // this.tooltip = d3.select(props.tooltipEl);
    this.onTooltipEnter = props.onTooltipEnter;
    this.onTooltipLeave = props.onTooltipLeave;
    this.onBarClick = props.onBarClick;
    const { clientWidth, clientHeight } = this.containerEl;

    // TODO wait until data loaded?
    this.stack = this.getStack(props.data, props.divDomain, 'count'); 

    this.chartWidth = clientWidth - this.padding.left - this.padding.right;
    // TODO better formula
    this.chartHeight = clientHeight - this.padding.top - 2*this.padding.bottom - this.timelineLayout.height;

    const container = d3.select(this.containerEl);
    // react-dev-server keeps appending on hot-reload
    container.select('#chart-area').remove();
    this.svg = container.append('svg')
      .attr('id', 'chart-area')
      // .attr('xmlns', 'http://www.w3.org/2000/svg')
      // .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('version', '1.1')
      .attr('xml:space', 'preserve');
    
    this.timeline = new D3Timeline({
      svg: this.svg,
      padding: { ...this.padding, top: this.chartHeight + this.padding.top + this.padding.bottom },
      chartWidth: this.chartWidth,
      chartHeight: this.timelineLayout.height,
      onBrushEnded: props.onBrushEnded,
    });
      
    const defs = this.svg.append('defs');
    
    defs.append('style')
      .attr('type', 'text/css')
      // eslint-disable-next-line quotes
      .text("@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700,800');");
        
    const filter = defs.append('filter')
      .attr('id', 'shadow')
      .html(`
        <filter id="f3" x="0" y="0" width="200%" height="200%">
        <feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      `);

    this.chart = this.svg
      .append('g')
      .classed('chart', true);
      
    // TODO better formatting of decimals
    const numberFormat = (d: number) => d3.format('.2s')(d).replace(/G/, 'B').replace(/\.\d/, '');
      
    this.getGridLines = () => d3.axisLeft<number>(this.y).tickSize(-this.chartWidth).tickFormat(() => '');
    this.getXAxis = (scale) => d3.axisBottom<number>(scale).tickFormat(d3.format('d'));
    this.getYAxis = () => d3.axisLeft<number>(this.y).tickFormat(numberFormat).ticks(5);
    
    this.gridLines = this.chart.append('g')
      .classed('gridline', true);

    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x');

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y');
      
    // add resize listener
    d3.select(window).on('resize', () => (
      this.resizeDebounced(this.measure, 200)
    ));
    
    this.measure();
  }
  
  measure = () => {
    const { clientWidth, clientHeight } = this.containerEl;
    this.chartWidth = clientWidth - this.padding.left - this.padding.right;
    this.chartHeight = clientHeight - this.padding.top - 2*this.padding.bottom - this.timelineLayout.height;

    this.svg
      .attr('width', clientWidth)
      .attr('height', clientHeight);
      
    this.chart
      .attr('transform', `translate(${this.padding.left}, ${this.padding.top})`);
      
    this.xAxis
      .attr('transform', `translate(0 ${this.chartHeight})`);

    this.x.rangeRound([0, this.chartWidth]);
      
    this.y.rangeRound([this.chartHeight, 0]);

    this.updateAxes();

    this.redraw();
  }
 
  updateYears(data: TimelineData[]) {
    this.timeline.update(data);
  }
  
  // updateField(field) {};
  
  updateData(data: Data[], divDomain: string[], agg?: keyof AggFields) {

    this.years = data.map(d => d.year);
    this.divs = divDomain;
    if (agg) this.agg = agg;

    this.stack = this.getStack(data, divDomain, this.agg);
    this.redraw();
  }

  redraw() {
    this.x.domain(this.years);
    this.y.domain([0, Math.max(...this.stack.flat().flat())]);
    this.color = colorScales[this.agg];
    this.color.domain(this.divs);
    
    this.updateAxes();

    const stacks = this.chart.selectAll<SVGGElement, Series>('.bars')
      .data(this.stack, d => d.key)
      .join(
        enter => enter.append('g')
          .attr('class', d => `bars ${d.key}`),
        update => update,
        exit => {
          // only applies to exiting div groups, not year stacks
          exit.selectAll<SVGGElement, Series>('.bar')
            .transition()
            .duration(this.animationDur)
            .attr('height', 0)
            .attr('y', d => this.y(d[0]))
            .remove();
          exit.transition()
            .duration(this.animationDur)
            .remove();
        }
      );
      
    stacks
      .transition()
      .duration(this.animationDur)
      .attr('fill', d => this.color(d.key));
      
    const divIndices = Object.fromEntries(this.divs.map((d, i) => [d, i]));
    const barChart = stacks.selectAll<SVGRectElement, Series>('.bar')
      .data<Series>(d => (d as any), (d, i, g) => {
        d.key = (g as any).key;
        return d.data.year;
      })
      .join(
        enter => enter
          .append('rect')
          .classed('bar', true)
          .attr('width', this.prev ? this.prev.x.bandwidth : this.x.bandwidth())
          .attr('height', 0)
          .attr('x', d => this.getXTransition(d.data.year, this.prev))
          // necessary to align new bars vertically during transition
          .attr('y', (d, i) => {
            if (this.prev) {
              const idx = divIndices[d.key];
              // will be undefined if bottom of stack
              const prevGroup = this.prev.stack[idx - 1];
              const sameMin = this.prev.years[0] === this.years[0];
              const sameDomain = sameMin && this.prev.years.length === this.years.length;
              if (prevGroup && sameDomain) {
                return this.prev.y(prevGroup[i][1]);
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
          .attr('height', 0)
          .attr('y', this.chartHeight)
          .style('opacity', 0)
          .remove()
      );
      
    barChart
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

    barChart 
      .on('mouseover', (e, d) => {
        const rect: SVGRectElement = e.target;
        d3.select(rect).classed('selected', true);
          
        this.onTooltipEnter(d.key, d.data.year);

        const chart = this.svg.node()!.getBoundingClientRect();
        const bar = rect.getBoundingClientRect();
        const bandwidth = this.x.bandwidth();
        const padding = bandwidth * this.x.padding();
        transitionTooltip(d.key, {
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
  }
  
  getStack(data: Data[], domain: string[], agg: keyof AggFields) {
    return d3.stack<Data, string>()
      .keys(domain)
      .value((d, key) => d.aggs[key]?.[agg] ?? 0)
      .order(d3.stackOrderNone)(data);
  }

  getXTransition(year: number, layout?: Layout) {
    if (layout) {
      const [ first, last ] = [ layout.years[0], layout.years.slice(-1)[0] ];
      const width = layout.x.step(); 

      if (year < first) {
        return (year - first) * width;
      } else if (year > last) {
        return this.chartWidth + (year - last) * width;
      }
    }
    return this.x(year) ?? 0;
  }
  
 
  updateAxes() {

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
      //.call(this.getXAxis(x2));
      .call(this.getXAxis(this.x));
      
    this.yAxis.transition()
      .duration(this.animationDur)
      .call(this.getYAxis());
      
    this.gridLines.transition()
      .duration(this.animationDur)
      .call(this.getGridLines());
  }
  
  highlightGroup(group?: string) {
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

export default D3Component;