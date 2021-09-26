/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as d3 from 'd3';
import { AggFields } from './D3Chart';
import { Padding, Selection, TickFormat } from './D3utils';

export type BrushCallback = (selection: [ number, number ]) => void;

export type TimelineData = {
  key: number
  count: number
  amount: number
}



type TimelineProps = {
  svg: Selection<SVGSVGElement>,
  chartWidth: number,
  chartHeight: number
  onBrushEnded: BrushCallback
  padding: Padding
  tickFormat: TickFormat 
}

export default class D3Timeline {

  animationDur = 1000;
  chart: Selection<SVGGElement>;
  chartWidth: number;
  chartHeight: number;
  padding: Padding;
  x = d3.scaleBand<number>().padding(0.2);
  y = d3.scaleLinear<number, number>().nice();
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  tickFormat: TickFormat;
  brush: d3.BrushBehavior<unknown>;
  gb: Selection<SVGGElement>;
  data: TimelineData[] = [];
  years: number[] = [];
  yearRange: [ number, number ];
  max = 0;
  agg: keyof AggFields = 'count';

  constructor(props: TimelineProps) {
    
    this.chartHeight = props.chartHeight;
    this.chartWidth = props.chartWidth;
    this.padding = props.padding;
    this.chart = props.svg
      .append('g')
      .classed('timeline', true)
      .attr('transform', `translate(${props.padding.left}, ${props.padding.top})`);
      
    this.x.rangeRound([0, this.chartWidth]);
     
    this.y.rangeRound([this.chartHeight, 0]);

    // TODO set this dynamically
    this.yearRange = [2000, 2020];
    this.tickFormat = props.tickFormat;
   
    // setup brush
    this.gb = this.chart.append('g').raise();

    this.brush = d3.brushX()
      .on('end', ({ target, sourceEvent, selection }) => {
        if (!sourceEvent || !selection) return;
        // inversed map is interval [s, e)
        this.yearRange = selection.map(this.xInverse);
        props.onBrushEnded(this.yearRange);
        this.gb
          .transition()
          .duration(this.animationDur / 2)
          .call(target.move, this.yearRange.map(this.getBrushBounds));
      });

    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x');

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y');

    this.measure(this.padding, this.chartWidth, this.chartHeight);
  }

  getXAxis = () => d3.axisBottom<number>(this.x)
    .tickFormat(this.tickFormat.x)
    .tickValues(this.x.domain().filter(d => !(d % 5)));

  getYAxis = () => d3.axisLeft<number>(this.y)
    .tickFormat(this.tickFormat.y)
    .tickValues([this.max]);

  measure = (padding: Padding, width: number, height: number) => {
    this.padding = padding;
    this.chartWidth = width;
    this.chartHeight = height;
    this.chart
      .transition()
      .duration(this.animationDur)
      .attr('transform', `translate(${this.padding.left}, ${this.padding.top})`);

    this.x.rangeRound([0, this.chartWidth]);
     
    this.y.rangeRound([this.chartHeight, 0]);
    
    this.brush.extent([
      [0, 0],
      [this.chartWidth, this.chartHeight]
    ]);

    this.gb
      .call(this.brush)
      .transition()
      .duration(this.animationDur)
      .call(this.brush.move, this.yearRange.map(this.x));

    this.redraw();
  }

  updateAxes = () => {
    this.xAxis
      .transition()
      .duration(this.animationDur)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.getXAxis());

    this.yAxis
      .transition()
      .duration(this.animationDur)
      .call(this.getYAxis());
  }

  xInverse = (y: number, idx: number) => {
    // https://stackoverflow.com/a/50846323
    const domain = this.x.domain();
    const paddingOuter = this.x(domain[0])!;
    const eachBand = this.x.step();
    // subtract idx to get exclusive range [s, e + 1)
    const x = Math.round((y - paddingOuter) / eachBand) - idx;
    return domain[Math.max(0, Math.min(x, domain.length - 1))];
  }

  update = (data: TimelineData[], agg?: keyof AggFields) => {
    this.data = data;
    if (agg) this.agg = agg;
    this.years = data.map(d => d.key);
    this.x.domain(this.years);
    this.max = Math.max(...data.map(d => d[this.agg]));
    this.y.domain([0, this.max]);
    // this.color.domain(this.divs);
    this.redraw();
  }

  redraw = () => {

    this.updateAxes();

    this.chart.selectAll<SVGRectElement, TimelineData>('.bar')
      .data(this.data, d => d.key)
      .join(
        enter => enter
          .append('rect')
          .call(enter => enter
            .attr('x', d => this.x(d.key)!)
            .attr('width', this.x.bandwidth())
            .attr('y', this.chartHeight)
            .attr('height', 0)
            // .transition()
            // .duration(this.animationDur)
            // .attr('height', 0)
          ),
        update => update,
        exit => exit.remove()
      )
      .classed('bar', true)
      .transition()
      .duration(this.animationDur)
      .attr('x', d => this.x(d.key)!)
      .attr('width', this.x.bandwidth())
      .attr('fill', this.agg === 'count' ? '#673AB7' : '#4CAF50')
      .attr('y', d => this.y(d[this.agg]))
      .attr('height', d => this.chartHeight - this.y(d[this.agg]));
      
    this.gb
      .raise()
      .transition()
      .duration(this.animationDur)
      .call(this.brush.move, this.yearRange.map(this.getBrushBounds));
  }
  
  getBrushBounds = (x: number | undefined, idx: number) => {
    if (x === undefined) return this.x(0);
    const padding = this.x.step() * this.x.padding();
    // make range inclusive [s, e]
    const endOffset = this.x.step() * idx;
    return this.x(x)! + endOffset - padding / 2 ?? 0;
  }
}
