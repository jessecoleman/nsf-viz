import {
  Box,
  Button,
  Dialog,
  DialogActions,
  TableSortLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { Grant } from 'api';

import { useMeasure } from 'app/hooks';
import { useGrantsDialogQuery } from 'app/query';

import AbstractDialog from './AbstractDialog';
import FilterChip from './FilterChip';
import { GrantColumn, GrantListItem, cols } from './GrantRow';
import GrantsTable from './GrantsTable';
import useGrantsDownload from './grantsDownload';

const TopAlignedDialog = styled(Dialog)`
  & .MuiDialog-container {
    align-items: start !important;
  }
`;

type GrantListHeaderStyles = {
  scrollOffset?: number;
};

export const GrantListHeader = styled(GrantListItem)<GrantListHeaderStyles>(
  ({ theme, scrollOffset }) => `
  height: 96px;
  font-size: ${theme.typography.h6.fontSize};
  padding-right: ${scrollOffset ?? 0}px;
`
);

const GrantsDialog = () => {
  const [dialog, setDialogQuery] = useGrantsDialogQuery();
  const url = useGrantsDownload();

  const [widthRef] = useMeasure<HTMLDivElement>();

  const handleSort = (sort: keyof Grant) => () => {
    const direction =
      dialog.grantSort === sort && dialog.grantDirection === 'asc'
        ? 'desc'
        : 'asc';

    setDialogQuery({
      grantSort: sort,
      grantDirection: direction,
    });
  };

  const handleClose = () => {
    setDialogQuery({ grantDialogOpen: false });
  };

  const handleClearFilter = (key: keyof Grant) => () => {
    switch (key) {
      case 'date':
        setDialogQuery({ grantDialogYear: undefined });
        break;
      case 'cat1_raw':
        setDialogQuery({ grantDialogDivision: undefined });
        break;
    }
  };

  const getFilterLabel = (field: keyof Grant) => {
    switch (field) {
      case 'cat1_raw':
        return dialog.grantDialogDivision?.toUpperCase() ?? '';
      case 'date':
        return dialog.grantDialogYear?.toString() ?? '';
      default:
        return '';
    }
  };

  return (
    <>
      <TopAlignedDialog
        fullWidth={true}
        maxWidth='xl'
        open={!!dialog.grantDialogOpen}
        onClose={handleClose}
      >
        <GrantListHeader scrollOffset={24}>
          {cols.map(({ id, label }) => (
            <GrantColumn key={id} column={id}>
              <Box position='relative' width='100%'>
                <TableSortLabel
                  active={dialog.grantSort === id}
                  direction={dialog.grantDirection}
                  onClick={handleSort(id)}
                >
                  {label}
                </TableSortLabel>
                {getFilterLabel(id) && (
                  <FilterChip
                    label={getFilterLabel(id)}
                    onClear={handleClearFilter(id)}
                  />
                )}
              </Box>
            </GrantColumn>
          ))}
        </GrantListHeader>
        <GrantsTable widthRef={widthRef} />
        <DialogActions>
          <Button component='a' href={url}>
            Download
          </Button>
          <Button onClick={handleClose}>Dismiss</Button>
        </DialogActions>
      </TopAlignedDialog>
      <AbstractDialog />
    </>
  );
};

export default GrantsDialog;
