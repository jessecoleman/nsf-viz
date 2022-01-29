import { MouseEvent } from 'react';
import styled from '@emotion/styled';
import { Tooltip } from '@material-ui/core';
import { TreeItem, treeItemClasses, TreeItemProps } from '@material-ui/lab';
import { colorScales } from 'theme';
import DivisionRow from './DivisionRow';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { CheckboxState } from './DirectoryTableHead';
import { Flipped } from 'react-flip-toolkit';

const DirectoryRoot = styled(TreeItem)(({ theme }) => `
  color: ${theme.palette.text.secondary};
  & .${treeItemClasses.content} {
    padding: 0;
    color: ${theme.palette.text.secondary};
    border-bottom: 1px solid ${theme.palette.grey[200]};
    font-weight: ${theme.typography.fontWeightMedium};
    &.Mui-expanded {
      font-weight: ${theme.typography.fontWeightRegular};
    }
    &:hover {
      background-color: ${theme.palette.action.hover};
    }
    &.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused {
      background-color: ${theme.palette.action.selected};
    }
    & .${treeItemClasses.label} {
      padding: 0;
      font-weight: 'inherit';
      color: 'inherit';
    }
  }
  & .${treeItemClasses.group} {
    margin-left: 0;
    & .${treeItemClasses.content} {
      padding-left: ${theme.spacing(2)};
    }
  }
  & .${treeItemClasses.iconContainer} {
    margin: 0;
    padding: ${theme.spacing(1, 1, 1, 2)};
    height: 100%;
  }
`);


type DirectoryProps = TreeItemProps & {
  name: React.ReactNode;
  desc?: string;
  checked: CheckboxState;
  count?: number;
  amount?: number;
  onCheck?: (e: MouseEvent, key: string, checked: CheckboxState) => void
};


const DirectoryEntry = (props: DirectoryProps) => {
  const {
    nodeId,
    name,
    desc,
    children,
    checked,
    onCheck,
    ...other
  } = props;
  
  return (
    <Flipped flipId={nodeId}>
      <div>
        <Tooltip title={desc ?? ''}>
          <DirectoryRoot
            nodeId={nodeId}
            expandIcon={<KeyboardArrowRight />}
            collapseIcon={<KeyboardArrowDown />}
            label={
              <DivisionRow
                checkable
                key={nodeId}
                dataKey={nodeId}
                name={name}
                onCheck={onCheck}
                // onMouseOver={debouncedHighlight}
                // onMouseOut={debouncedHighlight}
                checked={checked}
                aria-checked={checked}
                cells={['count', 'amount'].map(field => ({
                  name: field,
                  value: props[field],
                  fill: colorScales[field](nodeId)
                }))}
                // tabIndex={-1}
              />
            }
            {...other}
          >
            {children}
          </DirectoryRoot>
        </Tooltip>
      </div>
    </Flipped>
  );
};

export default DirectoryEntry;
