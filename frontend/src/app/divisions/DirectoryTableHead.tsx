import { 
  TableSortLabel,
  Checkbox,
  Tooltip,
} from '@material-ui/core';
import { SortableKeys } from 'app/selectors';
import { ChangeEvent } from 'react';
import { Column, NumberColumn, Row } from './DivisionRow';

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
  onRequestSort: (key: SortableKeys) => void,
  onSelectAllClick: (e: ChangeEvent, checked: boolean) => void,
}

const DirectoryTableHead = (props: EnhancedTableHeadProps) => {

  const {
    scrollOffset,
    orderBy,
    direction,
    checked,
    onRequestSort,
    onSelectAllClick,
  } = props;

  const handleSort = (property: SortableKeys) => () => {
    onRequestSort(property);
  };

  return (
    <Row checkable nohover scrollOffset={scrollOffset}>
      <Column column='checkbox'>
        <Checkbox
          checked={checked === 'checked'}
          indeterminate={checked === 'indeterminate'}
          onChange={onSelectAllClick}
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
              active={orderBy === c.id}
              direction={direction}
              onClick={handleSort(c.id)}
            >
              {c.label}
            </TableSortLabel>
          </Tooltip>
        </c.Component>
      ))}
    </Row>
  );
};

export default DirectoryTableHead;
