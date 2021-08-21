import { MouseEvent, useState, ChangeEvent, useEffect } from 'react';

import { Theme, makeStyles } from '@material-ui/core/styles';
import { alpha } from '@material-ui/core/styles/colorManipulator';

import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Collapse,
  ClickAwayListener,
  Divider,
  ListSubheader,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@material-ui/core';

import ChipInput, { ChipRendererArgs } from 'material-ui-chip-input';
import {
  Search,
  AddCircle,
  ClearAll,
  HighlightOff,
} from '@material-ui/icons';

import {
  loadData,
  loadRelated,
  loadTermCounts,
  loadTypeahead,
} from 'app/actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getRelated, getTerms, getTypeahead } from 'app/selectors';
import { addChips, deleteChip, setTerms, Term } from 'app/filterReducer';
import { useNavigate, useQuery } from 'app/hooks';
import { format } from 'd3';
import TermChip, { TermChipProps } from './TermChip';

const useStyles = makeStyles(theme => ({
  search: {
    minWidth: '25em',
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRoot: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(8),
  },
  chipInput: {
    padding: theme.spacing(1, 1, 1, 1),
    transition: theme.transitions.create('width'),
    width: '100%',
    color: 'white',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    marginTop: theme.spacing(.5),
    width: '25em',
    maxHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    zIndex: 3,
  },
  listIcon: {
    minWidth: 0,
  },
  clearButton: {
    position: 'absolute',
    right: 0,
  }
}));

type TermsListProps = {
  header: string
  filter: string[]
  terms: string[]
  onAddChip: (term: string) => void
}

const TermsList = (props: TermsListProps) => (
  <List subheader={<ListSubheader>{props.header}</ListSubheader>}>
    {props.terms.filter(t => props.filter.indexOf(t) === -1).map((t, i) => (
      <ListItem key={i} dense button onClick={() => props.onAddChip(t)}>
        <ListItemText>{t}</ListItemText>
        <ListItemIcon><AddCircle /></ListItemIcon>
      </ListItem>
    ))}
  </List>
);

const TermsFilter = () => {

  const dispatch = useAppDispatch();
  const classes = useStyles();
  const query = useQuery();
  const terms = useAppSelector(getTerms);
  const typeahead = useAppSelector(getTypeahead);
  const related = useAppSelector(getRelated);
  const [ focused, setFocused ] = useState(false);
  const [ selected, setSelected ] = useState<Set<string>>(new Set());
  console.log(selected);

  const { push } = useNavigate(({ query, firstLoad }) => {
    // only run on first load
    if (query.terms && firstLoad) {
      dispatch(setTerms(query.terms.map(t => ({ term: t, count: 0 }))));
      query.terms.map(t => {
        dispatch(loadTermCounts(t));
      });
    }
  }, '?terms');

  useEffect(() => {
    dispatch(loadData({ ...query, terms: [...selected] }));
  }, [selected]);

  const handleFocus = (focused: boolean) => () => {
    setFocused(focused);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length) {
      dispatch(loadTypeahead(e.target.value));
    }
  };

  const handleClickChip = (e: MouseEvent, key: string) => {
    e.preventDefault();
    // setFocused(false);
    setSelected(s => new Set(
      s.has(key) ? [...s].filter(k => k !== key) : s.add(key)
    ));
  };

  const handleAddChip = (chips: string) => {
    push({
      component: 'terms',
      action: 'add',
      payload: chips.split(','),
    });
    dispatch(addChips(chips.split(',')));
    dispatch(loadTermCounts(chips));
    dispatch(loadData(query));
    dispatch(loadRelated());
  };

  const handleDeleteChip = (chip: Term, idx: number) => {
    push({
      component: 'terms',
      action: 'remove',
      payload: [chip.term],
    });
    dispatch(deleteChip({ chip, idx }));
    dispatch(loadData(query));
    dispatch(loadRelated());
  };
 
  const handleClearTerms = () => {
    if (selected.size > 0) {
      setSelected(new Set());
      dispatch(loadData(query));
    } else {
      push({
        component: 'terms',
        action: 'set',
        payload: [],
      });
      dispatch(setTerms([]));
      dispatch(loadData({ ...query, terms: [] }));
    }
  };

  return (
    <ClickAwayListener onClickAway={handleFocus(false)}>
      <div className={classes.search}>
        <div className={classes.searchIcon}>
          <Search />
        </div>
        <ChipInput
          disableUnderline
          classes={{
            root: classes.chipRoot,
            input: classes.chipInput,
          }}
          value={terms}
          chipRenderer={(props: TermChipProps, key) => (
            <TermChip
              key={key}
              {...props}
              selected={selected.has(props.chip.term)}
              onClick={handleClickChip}
            />
          )}
          onFocus={handleFocus(true)}
          onUpdateInput={handleInput}
          onAdd={handleAddChip}
          onDelete={handleDeleteChip}
          newChipKeyCodes={[13, 188]}
        />
        <Tooltip title={selected.size === 0 ? 'clear all terms' : 'clear selection'}>
          <IconButton
            className={classes.clearButton}
            color='inherit'
            onClick={handleClearTerms}
          >
            {selected.size === 0
              ? <ClearAll />
              : <HighlightOff />
            }
          </IconButton>
        </Tooltip>
        <Collapse in={focused}>
          {(related.length + typeahead.length) > 0 &&
            <Paper className={classes.dropdown}>
              <List>
                <TermsList
                  header='autocomplete'
                  filter={terms.map(t => t.term)}
                  terms={typeahead}
                  onAddChip={handleAddChip}
                />
                <Divider />
                <TermsList
                  header='related terms'
                  filter={terms.map(t => t.term)}
                  terms={related}
                  onAddChip={handleAddChip}
                />
              </List>
            </Paper>
          }
        </Collapse>
      </div>
    </ClickAwayListener>
  );
};

export default TermsFilter;
