import { green } from '@material-ui/core/colors';
import * as d3 from 'd3';
import { interleave } from './Chart';
import D3Timeline, { BrushCallback, TimelineData } from './D3Timeline';

export type Data = Record<string | 'year', number>

type Series = [ number, number ] & {
  key: string
  year: number
  data: Data
}

type TooltipCallback = (key: string, year: number) => void

type D3Props = {
  containerEl: HTMLDivElement;
  tooltipEl?: HTMLDivElement;
  data: Data[]
  onTooltipEnter: TooltipCallback
  onTooltipLeave: TooltipCallback
  onBrushEnded: BrushCallback
  // width: number
  // height: number
};

export type Selection<
  Element extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<Element, Datum, PElement, PDatum>;

export type Layout = {
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  stack?: any; //d3.Stack<unknown, Record<string, number>, string>;
  divs: string[];
  years: number[];
 };
 
export type ChartElements = {
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  gridLines: Selection<SVGGElement>;
  getXAxis: () => d3.Axis<number>;
  getYAxis: () => d3.Axis<number>;
  getGridLines: () => d3.Axis<number>;
}

class D3Component {
  containerEl: HTMLDivElement;
  tooltip?: Selection<HTMLDivElement>;
  padding = { top: 10, bottom: 20, left: 50, right: 10 };
  timelineLayout = { height: 100, padding: this.padding };
  svg: Selection<SVGSVGElement>;
  chart: Selection<SVGGElement>;
  timeline: D3Timeline;
  chartWidth: number;
  chartHeight: number;
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  prev?: Layout;
  data: Data[];
  divs: string[];
  years: number[];
  color: d3.ScaleOrdinal<string, string>;
  getXAxis: () => d3.Axis<number>;
  getYAxis: () => d3.Axis<number>;
  getGridLines: () => d3.Axis<number>;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  gridLines: Selection<SVGGElement>;
  timelineElements?: ChartElements;
  onTooltipEnter: TooltipCallback
  onTooltipLeave: TooltipCallback
  rtime?: Date;
  timeout = false;
  animationDur = 1000;
  delta = 200;
  
  constructor(props: D3Props) {
    
    this.containerEl = props.containerEl;
    // this.tooltip = d3.select(props.tooltipEl);
    this.data = props.data;
    this.onTooltipEnter = props.onTooltipEnter;
    this.onTooltipLeave = props.onTooltipLeave;
    const [ width, height ] = [ this.containerEl.clientWidth, 800 ]; //containerEl.clientHeight ];

    // d3.select('window').on('resize', () => {
    //   this.rtime = new Date();
    //   console.log('resize', this.rtime);
    //   if (!this.timeout) {
    //     this.timeout = true;
    //     setTimeout(this.resizeEnd, 200);
    //   }
    // });

    this.chartWidth = width - this.padding.left - this.padding.right;
    this.chartHeight = height - this.padding.top - 2*this.padding.bottom - this.timelineLayout.height;
    this.color = d3.scaleOrdinal(Object.values(green).slice(0, -4).map(interleave));
    this.years = [];
    this.divs = [];

    this.svg = d3.select(this.containerEl)
      .append('svg')
      // .attr('xmlns', 'http://www.w3.org/2000/svg')
      // .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('version', '1.1')
      .attr('xml:space', 'preserve')
      .attr('width', width)
      .attr('height', height);
    
    this.timeline = new D3Timeline({
      svg: this.svg,
      padding: { ...this.padding, top: this.chartHeight + this.padding.top + this.padding.bottom },
      chartWidth: this.chartWidth,
      chartHeight: this.timelineLayout.height,
      onBrushEnded: props.onBrushEnded,
    });
      
    this.svg.append('defs')
      .append('style')
      .attr('type', 'text/css')
      // eslint-disable-next-line quotes
      .text("@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700,800');");
      
    this.chart = this.svg
      .append('g')
      .classed('chart', true)
      .attr('transform', `translate(${this.padding.left}, ${this.padding.top})`);
      
    this.x = d3.scaleBand<number>()
      .rangeRound([0, this.chartWidth])
      .padding(0.2);

    this.y = d3.scaleLinear()
      .rangeRound([this.chartHeight, 0])
      .nice();
    
    this.getGridLines = () => d3.axisLeft<number>(this.y).tickSize(-this.chartWidth).tickFormat(() => '');
    this.getXAxis = () => d3.axisBottom<number>(this.x).tickFormat(d3.format('d'));
    this.getYAxis = () => d3.axisLeft<number>(this.y).tickFormat(d3.format('.2s')).ticks(5);
    
    this.gridLines = this.chart.append('g')
      .classed('gridline', true)
      .call(this.getGridLines());

    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0 ${this.chartHeight})`)
      .call(this.getXAxis());

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y')
      .call(this.getYAxis());
    
  }
  
  resizeEnd() {
    if (this.rtime && new Date().getTime() - this.rtime.getTime() < this.delta) {
      setTimeout(this.resizeEnd, this.delta);
    } else {
      this.timeout = false;
      this.update(this.data, this.prev?.divs ?? []);
    }
  }
  
  updateYears(data: TimelineData[]) {
    this.timeline.update(data);
  }
  
  update(data: Data[], divDomain: string[]) {

    // this.timeline.update(data.map(({ year }) => ({ year, value: 30 })));
    this.data = data;
    this.years = data.map(d  => d.year);
    this.divs = divDomain.map(d => `${d}-count`);
    const divIndices = Object.fromEntries(this.divs.map((d, i) => [d, i]));

    const stack = d3.stack().keys(this.divs);
    const stackedData = stack(data);
    const max = Math.max(...stackedData.flat().flat());
 
    this.x.domain(this.years);
    this.y.domain([0, max]);
    this.color.domain(this.divs);
    
    // necessary because this gets shadowed in d3 callbacks
    const getSelectionBBox = this.getSelectionBBox;
    const bandwidth = this.x.bandwidth();
    const tooltip = this.tooltip;
    const onTooltipEnter = this.onTooltipEnter;
    const onTooltipLeave = this.onTooltipLeave;

    this.updateAxes();

    const stacks = this.chart.selectAll<SVGGElement, Series>('.bars')
      .data(stackedData, d => d.key)
      .join(
        enter => enter.append('g')
          .classed('bars', true)
          .join('.bars')
          .attr('fill', d => this.color(d.key)),
        update => update,
        exit => {
          // animate out on division filter
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
      
    stacks.selectAll<SVGRectElement, Series>('.bar')
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
              const prevGroup = this.prev.stack[idx - 1]?.[i];
              // TODO entering from time slider doesn't initialize correctly
              // console.log(idx, prevGroup);
              return this.prev.y(prevGroup?.[1] ?? 0);
            } else {
              return this.chartHeight;
            }
          })
          .style('opacity', 0),
        update => update,
        exit => exit
          .transition()
          .duration(this.animationDur)
          .attr('width', this.x.bandwidth())
          .attr('x', d => this.getXTransition(d.data.year, this))
          .attr('height', 0)
          .attr('y', this.chartHeight)
          .style('opacity', 0)
          .remove()
      )
      .on('mouseover', function() {
        const s = d3.select(this)
          .classed('selected', true);
        const d = s.datum() as Series;
        const props = getSelectionBBox(s);
        console.log(props, tooltip);
        // tooltip
        //   .classed('visible', true)
        //   .transition()
        //   .duration(500)
        //   .style('opacity', 1)
        //   .style('left', props.x + bandwidth + 'px')
        //   .style('top', props.y + 'px');
        onTooltipEnter(d.key, d.data.year);
      })
      .on('mouseleave', function() {
        const d = d3.select(this)
          .classed('selected', false)
          .datum() as Series;
        onTooltipLeave(d.key, d.data.year);
        
        // tooltip
        //   .classed('visible', false)
        //   .transition()
        //   .duration(200)
        //   .style('opacity', 0);
      })
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
          stack: stackedData,
          divs: this.divs,
          years: this.years,
        };
      });
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
  
  getSelectionBBox(s: Selection<any>) {
    return {
      x: parseInt(s.attr('x')),
      y: parseInt(s.attr('y')),
      width: parseInt(s.attr('width')),
      height: parseInt(s.attr('height'))
    };
  }
  
  updateAxes() {
    this.xAxis.transition()
      .duration(this.animationDur)
      .call(this.getXAxis());
      
    this.xAxis.selectAll<SVGGElement, number>('.axis-x .tick')
      .join(
        enter => enter,
        update => update,
        exit => {
          console.log(exit, exit.data());
          exit
          .transition()
          .duration(this.animationDur)
          .attr('x', d => this.getXTransition(d, this.prev));
        }
      );
      //.enter()
      //.transition()
      //.duration(this.animationDur)
      // .attr('x', (d, i) => { console.log(d, i); return this.x(d as number)!; });

    this.yAxis.transition()
      .duration(this.animationDur)
      .call(this.getYAxis());
      
    this.gridLines.transition()
      .duration(this.animationDur)
      .call(this.getGridLines());
  }

  setTooltipRef(tooltipEl: HTMLDivElement) {
    console.log(tooltipEl);
    this.chart.append('div')
      .attr('html', tooltipEl.innerHTML);
    // this.tooltip = d3.select(tooltipEl);
  }

  resize = (width, height) => { /*...*/ }
  
}

export default D3Component;