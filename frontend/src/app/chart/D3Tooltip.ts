import * as d3 from 'd3';

import { debounce } from './D3utils';

type ChartDimensions = {
  chart: DOMRect;
  bar: DOMRect;
  bandwidth: number;
  padding: number;
};

const tooltipDebounce = debounce();

export const transitionTooltip = (
  key: string,
  { chart, bar, bandwidth, padding }: ChartDimensions
) => {
  const tooltip = d3.select<HTMLDivElement, unknown>('#tooltip');

  tooltip.select<HTMLDivElement>(`#${key}-tooltip`).node()?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  });

  const node = tooltip.node();
  if (!node) return;
  const tipBbox = node.getBoundingClientRect();

  // compute left edge coordinate
  const chartRightEdge = chart.x + chart.width;
  const tipRightEdge = bar.x + bar.width + tipBbox.width;
  // determine tooltip justification
  const tipSide = tipRightEdge < chartRightEdge ? 'left' : 'right';
  const tipLeft =
    bar.x -
    chart.x +
    (tipSide === 'left'
      ? bandwidth + 2 * padding
      : -tipBbox.width - 2 * padding);

  // compute top edge coordinate
  const rectCenter = bar.y + bar.height / 2;
  const tipTop = Math.max(
    0,
    Math.min(rectCenter - tipBbox.height / 2, chart.height - tipBbox.height)
  );

  // transition tooltip in
  tooltipDebounce(() => {
    tooltip
      .classed('visible', true)
      .transition()
      .duration(500)
      .style('opacity', 1)
      .style('left', `${tipLeft}px`)
      .style('top', `${tipTop}px`);
  }, 50);
};

// transition tooltip out
export const removeTooltip = () => {
  tooltipDebounce(() => {
    d3.select('#tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .on('end', () => {
        d3.select('#tooltip').classed('visible', false);
      });
  }, 50);
};
