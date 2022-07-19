import { MouseEvent } from 'react';
import { Flipped } from 'react-flip-toolkit';

import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { Tooltip } from '@mui/material';

import styled from '@emotion/styled';
import { colorScales } from 'theme';

import { CheckboxState } from './DirectoryTableHead';
import DivisionRow from './DivisionRow';

const DirectoryRoot = styled(TreeItem)(
  ({ theme }) => `
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
`
);

type DirectoryProps = TreeItemProps & {
  name: React.ReactNode;
  desc?: string;
  checked: CheckboxState;
  count?: number;
  amount?: number;
  onCheck?: (e: MouseEvent, key: string, checked: CheckboxState) => void;
};

const DirectoryEntry = (props: DirectoryProps) => {
  const { nodeId, name, desc, children, checked, onCheck, ...other } = props;

  return (
    <Flipped flipId={nodeId}>
      <div>
        <Tooltip title={desc ?? ''} disableInteractive>
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
                cells={['count', 'amount'].map((field) => ({
                  name: field,
                  value: props[field],
                  fill: colorScales[field](nodeId),
                }))}
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
