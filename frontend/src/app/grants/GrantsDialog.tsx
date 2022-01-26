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

import { loadGrants } from 'app/actions';
import { Grant } from '../../api/models/Grant';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getNumGrants, loadingGrants } from 'app/selectors';
import { clearGrants } from 'app/dataReducer';
import { useEffect } from 'react';
import { useMeasure } from 'app/hooks';
import { useQuery } from 'app/query';
import AbstractDialog from './AbstractDialog';
import { cols, GrantColumn, GrantListItem } from './GrantRow';
import GrantsTable from './GrantsTable';
import FilterChip from './FilterChip';

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

  const [ query, setQuery ] = useQuery();

  useEffect(() => {
    dispatch(clearGrants());
  }, [JSON.stringify(query)]);

  const dispatch = useAppDispatch();
  const [ widthRef, ] = useMeasure<HTMLDivElement>();
  const loading = useAppSelector(loadingGrants);
  const numGrants = useAppSelector(getNumGrants);
  const [ firstOpen, setFirstOpen ] = useState(0);
  
  useEffect(() => {
    if (query.grantDialogOpen) {
      setFirstOpen(c => c + 1);
    } else {
      setFirstOpen(0);
    }
  }, [query.grantDialogOpen, numGrants]);

  const handleSort = (property: keyof Grant) => () => {
    const direction = query.grantOrder === property
      && query.grantDirection === 'asc' ? 'desc' : 'asc';

    setQuery({
      grantOrder: property,
      grantDirection: direction,
    });
    dispatch(clearGrants());
    dispatch(loadGrants({
      ...query,
      order: direction,
      order_by: property === 'title' ? 'title.raw' : property,
      start: query.grantDialogYear ?? query.start,
      end: query.grantDialogYear ?? query.end,
      divisions: query.grantDialogDivision ? [query.grantDialogDivision] : query.divisions,
      idx: 0,
    }));
  };

  const handleDownload = () => {
    window.alert('coming soon');
  };

  const handleClose = () => {
    setQuery({ grantDialogOpen: false });
  };

  const handleClearFilter = (key: keyof Grant) => () => {
    switch (key) {
      case 'date':
        setQuery({ grantDialogYear: undefined });
        break;
      case'cat1_raw':
        setQuery({ grantDialogDivision: undefined });
        break;
    }
  };

  const getFilterLabel = (field: keyof Grant) => {
    switch (field) {
      case 'cat1_raw':
        return query.grantDialogDivision?.toUpperCase() ?? '';
      case 'date':
        return query.grantDialogYear?.toString() ?? '';
      default:
        return '';
    }
  };

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth='xl'
        open={!!query.grantDialogOpen}
        onClose={handleClose}
      >
        <GrantListHeader scrollOffset={24}>
          {cols.map(({ id, label }) => (
            <GrantColumn key={id} column={id}>
              <Box position='relative' width='100%'>
                <TableSortLabel
                  active={query.grantOrder === id}
                  direction={query.grantDirection}
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
        <Collapse in={firstOpen !== 1 || numGrants > 0}>
          <GrantsTable widthRef={widthRef} />
        </Collapse>
        {loading && <ProgressBar />}
        <DialogActions>
          <Button onClick={handleDownload}>
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
