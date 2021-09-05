import { green } from '@material-ui/core/colors';
import * as d3 from 'd3';
import { callbackify } from 'util';
import { interleave } from './Chart';

type Data = Record<string | 'year', number>

type Series = [ number, number ] & {
  key: string
  year: number
  data: Data
}


type D3Props = {
  data: Data[]
  // width: number
  // height: number
};

type Selection<
  Element extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<Element, Datum, PElement, PDatum>;

type Layout = {
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  stack?: any; //d3.Stack<unknown, Record<string, number>, string>;
  divs: string[];
  years: number[];
 };

class D3Component {
  padding = { top: 10, bottom: 30, left: 50, right: 10 };
  containerEl: HTMLDivElement;
  data: Data[];
  prev?: Layout;
  svg: Selection<SVGSVGElement>;
  chart: Selection<SVGGElement>;
  chartWidth: number;
  chartHeight: number;
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  color: d3.ScaleOrdinal<string, string>;
  getXAxis: () => d3.Axis<number>;
  getYAxis: () => d3.Axis<number>;
  getGridLines: () => d3.Axis<number>;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  gridLines: Selection<SVGGElement>;
  rtime?: Date;
  timeout = false;
  animationDur = 1000;
  delta = 200;
  
  constructor(containerEl: HTMLDivElement, props: D3Props) {
    
    this.containerEl = containerEl;
    this.data = props.data;
    const [ width, height ] = [ containerEl.clientWidth, 800 ]; //containerEl.clientHeight ];

    // d3.select('window').on('resize', () => {
    //   this.rtime = new Date();
    //   console.log('resize', this.rtime);
    //   if (!this.timeout) {
    //     this.timeout = true;
    //     setTimeout(this.resizeEnd, 200);
    //   }
    // });

    this.chartWidth = width - this.padding.left - this.padding.right;
    this.chartHeight = height - this.padding.top - this.padding.bottom;
    this.color = d3.scaleOrdinal(Object.values(green).slice(0, -4).map(interleave));

    this.svg = d3.select(containerEl)
      .append('svg')
      // .attr('xmlns', 'http://www.w3.org/2000/svg')
      // .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('version', '1.1')
      .attr('xml:space', 'preserve')
      // .attr('height', '100%')
      // .attr('width', '100%')
      // .attr('viewBox', '0 0 0 0')
      .attr('width', width)
      .attr('height', height);
      
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
      .call(this.getXAxis);

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y')
      .call(this.getYAxis);
      
  }
  
  resizeEnd() {
    if (this.rtime && new Date().getTime() - this.rtime.getTime() < this.delta) {
      setTimeout(this.resizeEnd, this.delta);
    } else {
      this.timeout = false;
      this.update(this.data, this.prev?.divs ?? []);
    }
  }
  
  update(data: Data[], divDomain: string[]) {

    this.data = data;
    const years = data.map(d  => d.year);
    const divs = divDomain.map(d => `${d}-count`);
    const divIndices = Object.fromEntries(divs.map((d, i) => [d, i]));

    const stack = d3.stack().keys(divs);
    const stackedData = stack(data);
    const max = Math.max(...stackedData.flat().flat());
 
    this.x.domain(years);
    this.y.domain([0, max]);
    this.color.domain(divs);

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
          .attr('width', this.x.bandwidth())
          .attr('height', 0)
          .attr('x', d => {
            const { year } = d.data;
            // if (this.prev) {
            //   const [ first, last ] = [ this.prev.years[0], this.prev.years.slice(-1)[0] ];
            //   const width = (this.prev.x(last)! - this.prev.x(first)!) / (last - first);
            //   // TODO width could be undefined
            //   if (year < last) {
            //     return (year - first) * width;
            //   } else if (year > last) {
            //     return this.chartWidth + (year - last) * width;
            //   } 
            // }
            return this.x(year) ?? 0;
          })
          .attr('y', (d, i) => {
            if (this.prev) {
              const idx = divIndices[d.key];
              const prevGroup = this.prev.stack[idx - 1]?.[i];
              return this.prev.y(prevGroup?.[1] ?? 0);
            } else {
              return this.chartHeight;
            }
          }),
        update => update,
          //.transition()
          //.duration(this.animationDur)
          //.attr('width', this.x.bandwidth())
          //.attr('x', d => this.x(d.data.year) ?? 0),
        // animate out on year range
        exit => exit
          .transition()
          .duration(this.animationDur)
          .attr('x', d => {
            if (this.prev) {
              const width = this.prev.x(this.prev.years[1])! - this.prev.x(this.prev.years[0])!;
              if (d.data.year < years[0]) {
                return -(years[0] - d.data.year) * width;
              } else if (d.data.year > years[years.length - 1]) {
                return this.chartWidth + (d.data.year - years[years.length - 1]) * width;
              } else {
                console.log(this.x(d.data.year));
                return this.x(d.data.year) ?? 0;
              }
            } else { return this.x(d.data.year)!; }
          })
          .attr('height', 0)
          .attr('y', this.chartHeight)
          .remove()
      )
      .on('mouseover', function() {
        d3.select(this)
          .classed('selected', true);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .classed('selected', false);
      })
      .transition().duration(this.animationDur)
      .attr('width', this.x.bandwidth())
      .attr('x', d => this.x(d.data.year) ?? 0)
      .attr('height', d => this.y(d[0]) - this.y(d[1]))
      .attr('y', d => this.y(d[1]))
      .on('end', () => {
        this.prev = {
          x: this.x.copy(),
          y: this.y.copy(),
          stack: stackedData,
          divs: divs,
          years: years,
        };
      });
  }
  
  updateAxes() {
    this.xAxis.transition()
      .duration(this.animationDur)
      .call(this.getXAxis());

    this.yAxis.transition()
      .duration(this.animationDur)
      .call(this.getYAxis());
      
    this.gridLines.transition()
      .duration(this.animationDur)
      .call(this.getGridLines());
  }

  resize = (width, height) => { /*...*/ }
  
}

export default D3Component;