import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  VictoryVoronoiContainer,
  VictoryChart, 
  VictoryAxis,
  VictoryStack, 
  VictoryBar, 
  VictoryTooltip, 
} from 'victory';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import * as d3 from 'd3';
import Grid from '@material-ui/core/Grid';
import { green, lightGreen, teal } from '@material-ui/core/colors';

import { getData } from 'app/actions';

const cells = [
  {
  getTitle: (p) => 'Grants in SELECTED divisions per year ' + (p ? '(%)' : '(#)'),
  tip: (v, p, name, norm) => (
    <table className='striped'>
    <tbody>
      <tr>
      <td>SELECTED divisions</td>
      <td>{(p ? d3.format('.2%')(norm) : d3.format(',')(norm) + ' grants')}</td>
      </tr>
      <tr>
      <td>{name}</td>
      <td>{(p ? d3.format('.2%')(v) : d3.format(',')(v) + ' grants')}</td>
      </tr>
    </tbody>
    </table>
  ),
  tick: (p) => p ? d3.format('.2%') : d3.format('.2s'),
  amount: false,
  filtered: true,
  value: (value, key, norm=1) => {
    if (value[key]) {
    return value[key].match_grants / norm;
    } else {
    return 0;
    }
  }
  },
    {
    getTitle: (p) => 'ALL grants per year ' + (p ? '(%)' : '(#)'),
    tip: (v, p) => {
      return `<span style='padding: 8px'>
      ${p ? d3.format('.2%')(v) : d3.format(',')(v) + ' grants'}
      </span>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('.2s'),
    amount: false,
    filtered: false,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_grants / norm;
      } else {
      return 0;
      }
    }
    },
    {
    getTitle: (p) => 'Grant funding in SELECTED divisions per year ' + (p ? '(%)' : '($)'),
    tip: (v, p, name, norm) => {
      return `<table class='striped'>
      <tbody>
        <tr>
        <td>SELECTED divisions</td>
        <td>${(p ? d3.format('.2%')(norm) : d3.format('$,')(norm))}</td>
        </tr>
        <tr>
        <td>${name}</td>
        <td>${(p ? d3.format('.2%')(v) : d3.format('$,')(v))}</td>
        </tr>
      </tbody>
      </table>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('$.2s'),
    amount: true,
    filtered: true,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_amount / norm;
      } else {
      return 0;
      }
    }
    },
    {
    getTitle: (p) => 'ALL grant funding per year ' + (p ? '(%)' : '($)'),
    tip: (v, p) => {
      return `<span style='padding: 8px'>
      ${p ? d3.format('.2%')(v) : d3.format('$,')(v)}
      </span>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('$.2s'),
    amount: true,
    filtered: false,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_amount / norm;
      } else {
      return 0;
      }
    }
    },
]


const Chart: React.FC<{
  title: any,
  percent: boolean,
  //value: string,
  amount: boolean,
  filtered: boolean,
  hue: any,
  perYear: any,
  perDivision: any,
  divisions: any,
}> = (props) => {

  console.log(props.title);

    //  let width = document.querySelector("#viz").clientWidth - m.left - m.right;
    //  let height = document.querySelector("#viz").clientHeight - m.left - m.right;

    //  let margin = {top: 30, right: 30, bottom: 20, left: 40};

//charts.attr("transform", (c) => "translate("
//      + (c.pos[0]*width/2 + margin.left) + ","
//      + (c.pos[1]*height/2 + margin.top) + ")")
//
//  let chartWidth = width/2 - margin.left - margin.right;
//  let chartHeight = height/2 - margin.top - margin.bottom;
//
//  titles.text((c) => c.title(visPercent))
//    .attr("x", chartWidth / 2)
//    .attr("y", -5)
//    .attr("text-anchor", "middle");
//
//  xAxes.attr("transform", "translate(0, " + chartHeight + ")")
//    .call((c) => d3.axisBottom(c.x).tickFormat(d3.format("d")));
//
//  yAxes.call((c) => d3.axisLeft(c.y).ticks(5));
//  // initialize visualization
//  cells.forEach((cell, i) => {
//
//    if (cell.filtered) divs = filteredDivs;
//    else divs = ["all"];
//
//    cell.prevTotals = cell.totals;
//    cell.totals = [];
//    cell.stacked = d3.stack()
//      .keys(divs)
//      .value((value, key) => cell.value(value.data, key, value.norm))
//      (Object.keys(data).filter(y => !isNaN(y)).map((y) => {
//        let total = divs.map((d) => {
//          if (!data[y][d]) return 0;
//          else if (cell.amount) return data[y][d].match_amount;
//          else return data[y][d].match_grants;
//        }).reduce((a, b) => a + b, 0);
//        let norm;
//        if (percent) {
//          norm = divs.map((d) => {
//            if (!data[y][d]) return 0;
//            else if (cell.amount) return data[y][d].total_amount;
//            else return data[y][d].total_grants;
//          }).reduce((a, b) => a + b, 0);
//        } else {
//          norm = 1;
//        }
//        cell.totals.push(total);
//        return {year: y, total: total, norm: norm, data: data[y]};
//      }));
//
//    if (cell.stacked.length == 0) return 0;
//    cell.maxData = Math.max.apply(null,
//      cell.stacked[cell.stacked.length - 1].map((d) => {
//        return d[1];
//      })
//    );
//
//    if (i % 2 == 1) {
//      if (cells[i-1].maxData > cell.maxData) {
//        cell.maxData = cells[i-1].maxData;
//      } else {
//        cells[i-1].maxData = cell.maxData;
//      }
//    }
//  });
//
//  cells.forEach((cell, i) => {
//
//    cell.x.domain(Object.keys(data).filter(y => !isNaN(y)).sort());
//    cell.y.domain([0, cell.maxData]);
//
//    cell.chart.select(".axis-x")
//      .transition()
//      .duration(500)
//      .call(d3.axisBottom(cell.x).tickFormat(d3.format("d")));
//
//    cell.chart.select(".axis-y")
//      .transition()
//      .duration(500)
//      .call(d3.axisLeft(cell.y).ticks(5).tickFormat(cell.tick(percent)));
//
//    let barGroup = cell.chart.selectAll(".bar-group")
//      .data(cell.stacked, (d) => d.key);
//
//    barGroup.exit()
//      .transition()
//      .duration(500)
//      .remove()
//      .selectAll(".bar")
//      .attr("y", (d, i) => cell.y(d[0]))
//      //.attr("y", (d, i) => { console.log(i); return cell.y((cell.prevTotals[i] / cell.totals[i]) * d[0]); })
//      //.attr("y", (d, i) => { console.log(i); return cell.y((cell.totals[i] - d[0]) / (cell.prevTotals[i] - d[0]) * d[0]); })
//      //.attr("y", (d) => {
//      //  if (y2.length) return cell.y(y2[i]);
//      //  else return cell.y(d[0]);
//      //})
//      .attr("height", (d) => 0);
//
//    barGroup = barGroup.enter().append("g")
//      .merge(barGroup)
//      .attr("class", "bar-group")
//
//    let oldY = {}
//    let y2 = []
//
//    let bars = barGroup.selectAll(".bar")
//      .data(div => div.map(d => {
//       let data = {
//          0: d[0],
//          1: d[1],
//          total: d.data.total,
//          norm: d.data.norm,
//          year: +d.data.year,
//          key: div.key,
//          index: d.data.data[div.key] ? d.data.data[div.key].index : -1
//        };
//        if (prev && data.key === prev.name) {
//          oldY[data.year] = data[1];
//          y2.push(data[1]);
//        }
//        return data;
//      }), d => d.year);
//
//    bars.transition().ease(d3.easeCubic).duration(500)
//      .attr("x", (d) => cell.x(d.year))
//      .attr("width", cell.x.bandwidth())
//      .attr("y", (d) => cell.y(d[1]))
//      .attr("height", (d) => cell.y(d[0]) - cell.y(d[1]))
//
//    let barsEnter = bars.enter().append("rect")
//      .attr("class", "bar")
//      .attr("x", (d) => cell.x(d.year))
//      //.attr("y", (d, i) => { console.log(i); return cell.y((cell.totals[i] - d[0]) / (cell.prevTotals[i] - d[0]) * d[0]); })
//      //.attr("y", (d, i) => cell.y(d[0]))
//      .attr("y", (d, i) => {
//        //console.log(y2);
//        if (y2.length) return cell.y(y2[i]);
//        else return cell.y(d[0]);
//      })
//      .attr("width", cell.x.bandwidth())
//      .attr("height", (d) => 0)
//
//    barsEnter
//      .transition().ease(d3.easeCubic).duration(500)
//      .attr("y", (d) => cell.y(d[1]))
//      .attr("height", (d) => cell.y(d[0]) - cell.y(d[1]))
//
//    bars = barsEnter.merge(bars)
//      .attr("fill", (d) => getColor(d.index, cell.amount))
//      .on("mouseover", (d) => {
//        tooltip.transition()
//          .duration(200)
//          .style("opacity", 1);
//        tooltip.html(() => cell.tip(d[1] - d[0], percent, d.key, d.total/d.norm))
//      })
//      .on("mousemove", (d) => {
//       let bbox = tooltip.node().getBoundingClientRect();
//        tooltip.style("left", (d3.event.pageX - bbox.width / 2) + "px")
//          .style("top", (d3.event.pageY - bbox.height - 8) + "px");
//      })
//      .on("mouseout", (d) => {
//        tooltip.transition()
//          .duration(500)
//          .style("opacity", 0);
//      })
//  });

//value: (value, key, norm=1) => {
//  if (value[key]) {
//  return value[key].match_grants / norm;
//  } else {
//  return 0;
//  }
//}

//Object.keys(data).filter(y => !isNaN(y)).map((y) => {
//   let total = divs.map((d) => {
//     if (!data[y][d]) return 0;
//     else if (cell.amount) return data[y][d].match_amount;
//     else return data[y][d].match_grants;
//   }).reduce((a, b) => a + b, 0);
//   let norm;
//   if (percent) {
//     norm = divs.map((d) => {
//       if (!data[y][d]) return 0;
//       else if (cell.amount) return data[y][d].total_amount;
//       else return data[y][d].total_grants;
//     }).reduce((a, b) => a + b, 0);
//   } else {
//     norm = 1;
//   }
//   cell.totals.push(total);
//   return {year: y, total: total, norm: norm, data: data[y]};
// }));

  const xRange = props.perYear.years.buckets.map(b => parseInt(b.key_as_string));
  const xMin = Math.min(...xRange);
  const xMax = Math.max(...xRange);

  let yRange;

  if (props.amount) {
    yRange = props.perYear.years.buckets.map(b => b.grant_amounts.value);
  } else {
    yRange = props.perYear.years.buckets.map(b => b.doc_count);
  }
  const yMax = Math.max(...yRange);

  let tickFormat;
  if (props.percent) {
    tickFormat = t => d3.format('.2%');
  } else {
    tickFormat = t => props.amount ? d3.format('$.2s')(t) : d3.format('.2s')(t);
  }

  const data = props.perDivision.years.buckets.map(b => {
    let totalCount = 0;
    let totalAmount = 0;
    const bars = b.divisions.buckets.reduce((obj, div) => {
      obj[div.key] = props.amount ? div.grant_amounts.value : div.doc_count;
      totalCount += div.doc_count;
      totalAmount += div.grant_amounts.value;
      return obj;
    }, {});

    return {
      year: parseInt(b.key_as_string),
      count: totalCount,
      amount: totalAmount,
      ...bars
    }
  });

  return (
    <ResponsiveContainer width='99%' aspect={1.5}>
      <BarChart
        data={data}
      >
        {props.divisions.map((d, i) => (
          <Bar 
            key={d.key}
            stackId='a' 
            dataKey={d.key}
            fill={props.hue[(i % 9 + 1) * 100]}
          />
        ))}
        <Tooltip />
        <XAxis 
          dataKey='year' 
          angle={-45} 
          textAnchor='end'
          fontSize={12}
          tick={{ dy: -3 }}
        />
        <YAxis 
          dataKey={props.amount ? 'amount' : 'count'} 
          tickFormatter={tickFormat}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <VictoryChart
      title={props.title}
      domain={{
//x: [xMin, xMax],
        y: [0, yMax], //c.maxData
      }}
      domainPadding={24}
    >
      <VictoryAxis 
        style={{tickLabels: {angle: 45}}}
        label='year'
      />
      <VictoryAxis 
        dependentAxis 
        tickFormat={tickFormat}
      />
      <VictoryStack>
        {props.perDivision.divisions.buckets.map((div, i) => (
          <VictoryBar
            key={div.key}
            animate={{
              duration: 1000,
            }}
            style={{data: {'fill': props.hue[(i % 9 + 1) * 100]}}}
            data={div.years.buckets.map(year => ({
              x: year.key_as_string,
              y: (props.amount ? year.grant_amounts.value : year.doc_count),
              label: `${year.key_as_string} ${div.key} (${props.amount ? d3.format('$,')(year.grant_amounts.value) : year.doc_count})`,
            }))}
            labelComponent={
              <VictoryTooltip />
            }
          />
         ))}
      </VictoryStack>
    </VictoryChart>
  );
}

const Charts: React.FC<{
  percent: boolean,
}> = (props) => {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getData());
  }, [dispatch]);

  const perYear = useSelector(state => state.data.perYear);
  const perDivision = useSelector(state => state.data.perDivision);
  const total = useSelector(state => state.data.sumTotal);

  if (!perYear) return null;

  return (
    <Grid
      container
    >
      {cells.map((c, i) => (
        <Grid item xs={12} md={6} key={i}>
          <Chart
            title={c.getTitle(props.percent)}
            percent={props.percent}
            amount={c.amount}
            filtered={c.filtered}
            hue={c.amount ? green : teal}
            perYear={perYear}
            perDivision={perDivision}
            divisions={total.divisions.buckets}
          />
        </Grid>
      ))} 
    </Grid>
  );
}

export default Charts;
