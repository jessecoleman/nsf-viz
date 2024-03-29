import * as d3 from 'd3';

export type Selection<
  Element extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<Element, Datum, PElement, PDatum>;

export type Padding = {
  top: number,
  bottom: number,
  left: number,
  right: number,
}

export type TickFormat = {
  x: (t: number) => string
  y: (t: number) => string
}

export const debounce = () => {
  let timer: NodeJS.Timeout;
  return (fn: () => void, delay: number) => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
};