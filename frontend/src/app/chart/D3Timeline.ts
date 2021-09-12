import * as d3 from 'd3';
import { Selection } from './D3utils';

export type BrushCallback = (selection: [ number, number ]) => void;

export type TimelineData = {
  year: number
  count: number
  amount: number
}

type TimelineProps = {
  svg: Selection<SVGSVGElement>,
  chartWidth: number,
  chartHeight: number
  onBrushEnded: BrushCallback
  padding: { top: number, bottom: number, left: number, right: number }
}

class D3Timeline {

  animationDur = 1000;
  chart: Selection<SVGGElement>;
  chartWidth: number;
  chartHeight: number;
  padding = { top: 10, bottom: 50, left: 50, right: 10 };
  x: d3.ScaleBand<number>;
  y: d3.ScaleLinear<number, number>;
  xAxis: Selection<SVGGElement>;
  yAxis: Selection<SVGGElement>;
  // gridLines: Selection<SVGGElement>;
  getXAxis: () => d3.Axis<number>;
  getYAxis: () => d3.Axis<number>;
  // getGridLines: () => d3.Axis<number>;
  brush: d3.BrushBehavior<unknown>;
  gb: Selection<SVGGElement>;

  constructor(props: TimelineProps) {
    
    this.chartHeight = props.chartHeight;
    this.chartWidth = props.chartWidth;
    this.chart = props.svg
      .append('g')
      .classed('timeline', true)
      .attr('transform', `translate(${props.padding.left}, ${props.padding.top})`);
      
    const [ min, max ] = [ 2000, 2021 ];
    const domain = Array.from({ length: max - min }, (d, i) => i + min);
    this.x = d3.scaleBand<number>()
      .rangeRound([0, this.chartWidth])
      .domain(domain)
      .padding(0.2);
     
    this.y = d3.scaleLinear()
      .rangeRound([this.chartHeight, 0])
      .nice();

    // this.getGridLines = () => d3.axisLeft<number>(this.y).tickSize(-this.chartWidth).tickFormat(() => '');
    this.getXAxis = () => d3.axisBottom<number>(this.x).tickFormat(d3.format('d'));
    this.getYAxis = () => d3.axisLeft<number>(this.y).tickFormat(d3.format('.2s'));
    
    // setup brush
    const defaultSelection = [this.x(2000), this.x(2020)];
    this.brush = d3.brushX()
      .extent([
        [0, 0],
        [this.chartWidth, this.chartHeight]
      ])
      .on('end', ({ target, sourceEvent, selection }) => {
        if (!sourceEvent || !selection) return;
        // inversed map is interval [s, e)
        const yearRange = selection.map(this.xInverse);
        props.onBrushEnded(yearRange);
        // TODO test this
        d3.select(sourceEvent.originalTarget.parentElement)
          .transition()
          .call(target.move, yearRange.map(this.getBrushBounds));
      });

    this.gb = this.chart.append('g')
      .call(this.brush)
      .call(this.brush.move, defaultSelection);

    this.xAxis = this.chart.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.getXAxis());

    this.yAxis = this.chart.append('g')
      .attr('class', 'axis axis-y')
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

  update = (data: TimelineData[]) => {

    this.x.domain(data.map(d => d.year));
    const max = Math.max(...data.map(d => d.count));
    // multiply by 1.1 to add some padding
    this.y.domain([0, max * 1.1]);
    // this.color.domain(this.divs);
 
    this.xAxis.transition()
      .duration(this.animationDur)
      .call(this.getXAxis());

    this.yAxis.transition()
      .duration(this.animationDur)
      .call(this.getYAxis().tickValues([max]));
      
    // this.gridLines.transition()
    //   .duration(this.animationDur)
    //   .call(this.getGridLines());

    this.chart.selectAll<SVGRectElement, { year: number }>('.bar')
      .data(data, d => d.year)
      .join(
        enter => enter
          .append('rect')
          .call(enter => enter
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
      .attr('x', d => this.x(d.year)!)
      .attr('width', this.x.bandwidth())
      .transition()
      .duration(this.animationDur)
      .attr('fill', 'green')
      .attr('y', d => this.y(d.count))
      .attr('height', d => this.chartHeight - this.y(d.count));
      
    this.gb
      .call(this.brush.move, [
        this.x.domain()[0],
        this.x.domain().pop()
      ].map(this.getBrushBounds))
      .raise();
  }
  
  getBrushBounds = (x: number | undefined, idx: number) => {
    if (x === undefined) return this.x(0);
    const padding = this.x.step() * this.x.padding();
    // make range inclusive [s, e]
    const endOffset = this.x.step() * idx;
    return this.x(x)! + endOffset - padding / 2 ?? 0;
  }
  
  brushed = (brush, invScale) => {
    // if (brush.selection && invScale) {
    //   console.log(brush.selection.map(s => invScale(s)));
    // }
  }
}

export default D3Timeline;