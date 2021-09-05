import { green } from '@material-ui/core/colors';
import * as d3 from 'd3';
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

class D3Component {
  padding = { top: 10, bottom: 30, left: 50, right: 10 };
  containerEl: HTMLDivElement;
  data: Data[];
  prevStack?: any; //d3.Stack<unknown, Record<string, number>, string>;
  prevDivs: string[] = [];
  prevYears: number[] = [];
  prevY?: d3.ScaleLinear<number, number>;
  svg: Selection<SVGSVGElement>;
  chart: Selection<SVGGElement>;
  chartWidth: number;
  chartHeight: number;
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  color: d3.ScaleOrdinal<string, string>;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
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
      .append('svg').attr('width', width)
      .attr('height', height);
      
    this.chart = this.svg
      .append('g')
      .classed('chart', true)
      .attr('transform', `translate(${this.padding.left}, ${this.padding.top})`);

    this.x = d3.scaleBand<number>()
      .rangeRound([0, this.chartWidth])
      //.domain(this.data)
      .padding(0.2);

    this.y = d3.scaleLinear()
      .rangeRound([this.chartHeight, 0])
      //.domain([0, 1])
      .nice();
    
    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0 ${this.chartHeight})`)
      .call(d3.axisBottom(this.x).tickFormat(d3.format('d')));

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y')
      .call(d3.axisLeft(this.y).ticks(5));
  }
  
  resizeEnd() {
    if (this.rtime && new Date().getTime() - this.rtime.getTime() < this.delta) {
      setTimeout(this.resizeEnd, this.delta);
    } else {
      this.timeout = false;
      this.update(this.data, this.prevDivs);
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

    this.xAxis.transition()
      .duration(this.animationDur)
      .call(d3.axisBottom(this.x)
        .tickFormat(d3.format('d')));

    this.yAxis.transition()
      .duration(this.animationDur)
      .call(d3.axisLeft(this.y)
        .ticks(5)
        .tickFormat(d3.format('.2s')));
    
    const stacks = this.chart.selectAll<SVGGElement, Series>('.bars')
      .data(stackedData, d => d.key)
      .join(
        enter => enter.append('g')
          .classed('bars', true)
          .join('.bars')
          .attr('fill', d => this.color(d.key)),
        update => update,
        exit => {
          exit.selectAll<SVGGElement, Series>('.bar')
            .transition()
            .duration(this.animationDur)
            .attr('height', 0)
            .attr('x', d => {
              console.log(years, this.prevYears);
              if (years[0] > this.prevYears[0]) {
                return -200;
              } else if (years[years.length - 1] < this.prevYears[this.prevYears.length - 1]) {
                return this.chartWidth + 200;
              } else {
                return this.x(d.data.year) ?? 0;
              }
            })
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
          .attr('x', d => this.x(d.data.year) ?? 0)
          .attr('y', (d, i) => {
            if (this.prevStack && this.prevY) {
              const idx = divIndices[d.key];
              const prevGroup = this.prevStack[idx - 1]?.[i];
              return this.prevY(prevGroup?.[1] ?? 0);
            } else {
              return this.chartHeight;
            }
          }),
        update => {
          update.selectAll('.bar')
            .exit<Series>()
            .attr('x', d => {
              console.log(years, this.prevYears);
              if (years[0] > this.prevYears[0]) {
                return -200;
              } else if (years[years.length - 1] < this.prevYears[this.prevYears.length - 1]) {
                return this.chartWidth + 200;
              } else {
                return this.x(d.data.year) ?? 0;
              }
            });
          return update;
        },
        exit => exit.call(exit => exit
          .transition()
          .duration(this.animationDur)
          // .attr('x', -200)
          .attr('height', 0)
          .remove())
      )
      .on('mouseover', function() {
        d3.select(this)
          .style('outline-style', 'solid')
          .style('outline-color', 'black')
          .style('outline-width', '2px')
          .style('outline-offset', '-2px');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .style('outline-style', 'unset')
          .style('outline-color', 'unset')
          .style('outline-width', 'unset')
          .style('outline-offset', 'unset');
      })
      .transition().duration(this.animationDur)
      .attr('width', this.x.bandwidth())
      .attr('x', d => this.x(d.data.year) ?? 0)
      .attr('height', d => this.y(d[0]) - this.y(d[1]))
      .attr('y', d => this.y(d[1]))
      .on('end', () => {
        this.prevY = this.y.copy();
        this.prevStack = stackedData;
        this.prevDivs = divs;
        this.prevYears = years;
      });
  }

  resize = (width, height) => { /*...*/ }
  
}

export default D3Component;