import { 
  TableSortLabel,
  Checkbox,
  Tooltip,
  IconButton,
  Box,
  styled,
} from '@material-ui/core';
import { UnfoldLess, UnfoldMore } from '@mui/icons-material';
import { SortableKeys } from 'app/sort';
import { getNextCheckboxState } from './checkFSM';
import { Column, NumberColumn, Row } from './DivisionRow';

const ExpandButton = styled(IconButton)`
  width: 24px;
  height: 24px;
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 4px;
`;

const Container = styled(Box)(({ theme }) => `
  border-bottom: 1px solid ${theme.palette.grey[200]};
  display: flex;
  flex-direction: row;
`);

type Columns = {
  Component: typeof Column | typeof NumberColumn,
  id: SortableKeys,
  numeric: boolean,
  label: string,
  desc: string,
};

const columns: Columns[] = [
  { Component: Column, id: 'name', numeric: false, label: 'Name', desc: 'division name' },
  { Component: NumberColumn, id: 'count', numeric: true, label: 'Gnts', desc: 'number of grants' }, 
  { Component: NumberColumn, id: 'amount', numeric: false, label: 'Amt', desc: 'total award amount' },
];

export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate'

type EnhancedTableHeadProps = {
  scrollOffset?: number
  orderBy: string,
  direction: 'desc' | 'asc',
  checked: CheckboxState,
  allExpanded: boolean,
  onRequestSort: (key: SortableKeys) => void,
  onSelectAll: (checked: CheckboxState) => void,
  onExpandAll: () => void,
}

const DirectoryTableHead = (props: EnhancedTableHeadProps) => (
  <Container>
    <ExpandButton onClick={props.onExpandAll}>
      {props.allExpanded
        ? <UnfoldLess />
        : <UnfoldMore />
      }
    </ExpandButton>
    <Row checkable nohover scrollOffset={props.scrollOffset}>
      <Column column='checkbox'>
        <Checkbox
          checked={props.checked === 'checked'}
          indeterminate={props.checked === 'indeterminate'}
          onChange={() => props.onSelectAll(getNextCheckboxState(props.checked))}
        />
      </Column>
      {columns.map(c => (
        <c.Component
          column={c.id}
          key={c.id}
          light
        >
          <Tooltip
            title={`sort by ${c.desc}`}
            placement='bottom-end'
            enterDelay={300}
          >
            <TableSortLabel
              active={props.orderBy === c.id}
              direction={props.direction}
              onClick={() => props.onRequestSort(c.id)}
            >
              {c.label}
            </TableSortLabel>
          </Tooltip>
        </c.Component>
      ))}
    </Row>
  </Container>
);

export default DirectoryTableHead;
