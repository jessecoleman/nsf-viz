import FlipMove from 'react-flip-move';
import { Box, Paper, styled } from '@material-ui/core';
import { TooltipProps } from 'recharts/types/component/Tooltip';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';

const Container = styled(Paper)(({ theme }) => `
  margin: 3em;
  overflow-y: hidden;
`);

const ChartTooltip = (props: TooltipProps<number, string>) => {

  let year = 0;
  const totals: CellData[] = [{ key: 'count', v: 0 }, { key: 'amount', v: 0 }];

  const rows: Record<string, CellData[]> = {};
  props.payload?.forEach(p => {
    if (!p.name || !p.value) return;
    year = p.payload.year;
    const [ key, group ] = p.name.split('-');
    if (!rows[key]) {
      rows[key] = [{
        key: group,
        v: p.value,
        fill: (p as any).fill 
      }];
      totals[0].v += p.value;
    } else {
      rows[key].push({
        key: group,
        v: p.value,
        fill: (p as any).fill,
      });
      totals[1].v += p.value;
    }
  });

  return (
    <Container elevation={5}>
      <DivisionRow
        dataKey='header'
        title={year.toString()}
        cells={totals}
        header
      />
      <Box>
        <FlipMove
          delay={100}
          enterAnimation='fade'
          leaveAnimation='fade'
        >
          {Object.entries(rows).reverse().map(([ name, cells ]) => (
            <DivisionRow
              key={name}
              dataKey={name}
              title={name}
              cells={cells}
            />
          ))}
        </FlipMove>
      </Box>
    </Container>
  );
};

export default ChartTooltip;