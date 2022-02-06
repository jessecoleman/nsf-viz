import { useState } from 'react';
import { styled } from '@material-ui/core/styles';
import { 
  Dialog,
  Button,
  TableSortLabel,
  DialogActions,
  Collapse,
  LinearProgress,
  Box,
} from '@material-ui/core';

import { Grant } from 'api';
import { useInfiniteLoadGrants } from './useInfiniteLoadGrants';
import { useEffect } from 'react';
import { useMeasure } from 'app/hooks';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import AbstractDialog from './AbstractDialog';
import { cols, GrantColumn, GrantListItem } from './GrantRow';
import GrantsTable from './GrantsTable';
import FilterChip from './FilterChip';
import useGrantsDownload from './grantsDownload';

const ProgressBar = styled(LinearProgress)`
  margin-bottom: -4px;
`;

type GrantListHeaderStyles = {
  scrollOffset?: number;
}

export const GrantListHeader = styled(GrantListItem)<GrantListHeaderStyles>(({ theme, scrollOffset }) => `
  height: 96px;
  font-size: ${theme.typography.h6.fontSize};
  padding-right: ${scrollOffset ?? 0}px;
`);

const GrantsDialog = () => {

  const [ query, ] = useQuery();
  const [ dialog, setDialogQuery ] = useGrantsDialogQuery();
  const url = useGrantsDownload();

  useEffect(() => {
    clearGrants();
  }, [JSON.stringify(query)]);

  const [ widthRef, ] = useMeasure<HTMLDivElement>();
  // const { data: grants } = useLoadGrants();
  const loading = false;
  const { count, clearGrants } = useInfiniteLoadGrants();
  const [ firstOpen, setFirstOpen ] = useState(0);
  
  useEffect(() => {
    if (dialog.grantDialogOpen) {
      setFirstOpen(c => c + 1);
    } else {
      setFirstOpen(0);
    }
  }, [dialog.grantDialogOpen, count]);

  const handleSort = (property: keyof Grant) => () => {
    const direction = dialog.grantSort === property
      && dialog.grantDirection === 'asc' ? 'desc' : 'asc';

    setDialogQuery({
      grantSort: property,
      grantDirection: direction,
    });
    clearGrants();
    // dispatch(loadGrants({
    //   ...query,
    //   order: direction,
    //   order_by: property === 'title' ? 'title.raw' : property,
    //   start: dialog.grantDialogYear ?? query.start,
    //   end: dialog.grantDialogYear ?? query.end,
    //   divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
    //   idx: 0,
    // }));
  };

  const handleClose = () => {
    setDialogQuery({ grantDialogOpen: false });
  };

  const handleClearFilter = (key: keyof Grant) => () => {
    switch (key) {
      case 'date':
        setDialogQuery({ grantDialogYear: undefined });
        break;
      case'cat1_raw':
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
      <Dialog
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
                {getFilterLabel(id) &&
                  <FilterChip
                    label={getFilterLabel(id)}
                    onClear={handleClearFilter(id)}
                  />
                }
              </Box>
            </GrantColumn>
          ))}
        </GrantListHeader>
        <Collapse in={firstOpen !== 1 || count > 0}>
          <GrantsTable widthRef={widthRef} />
        </Collapse>
        {loading && <ProgressBar />}
        <DialogActions>
          <Button component='a' href={url}>
            Download
          </Button>
          <Button onClick={handleClose}>
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
      <AbstractDialog />
    </>
  );
};

export default GrantsDialog;
