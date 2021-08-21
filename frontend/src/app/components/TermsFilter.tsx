import { useState, ChangeEvent } from 'react';

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
} from '@material-ui/core';

import ChipInput, { ChipRendererArgs } from 'material-ui-chip-input';
import {
  Search,
  AddCircle,
  ClearAll,
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

const useStyles = makeStyles((theme: Theme) => ({
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
  chip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  chipContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipCount: {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.grey[400],
    marginLeft: -theme.spacing(0.9),
    marginRight: theme.spacing(1),
    padding: theme.spacing(0.5),
    borderRadius: 20,
  },
  chipRoot: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(8),
  },
  chipContainer: {
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

  const { push } = useNavigate(({ query, firstLoad }) => {
    // only run on first load
    if (query.terms && firstLoad) {
      dispatch(setTerms(query.terms.map(t => ({ term: t, count: 0 }))));
      query.terms.map(t => {
        dispatch(loadTermCounts(t));
      });
    }
  }, '?terms');

  const handleFocus = (focused: boolean) => () => {
    setFocused(focused);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length) {
      console.log(e.target);
      dispatch(loadTypeahead(e.target.value));
    }
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
  
  const chipRenderer = (props: ChipRendererArgs, key: number) => {
    /* eslint-disable react/prop-types */
    return (
      <Chip
        key={key}
        label={
          <span className={classes.chipContent}>
            <span className={classes.chipCount}>{props.chip.count}</span>
            {props.chip.term}
          </span>
        }
        onDelete={props.handleDelete}
        className={classes.chip}
      />
    );
    /* eslint-enable react/prop-types */
  };
  
  const handleClearTerms = () => {
    push({
      component: 'terms',
      action: 'set',
      payload: [],
    });
    dispatch(setTerms([]));
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
            chipContainer: classes.chipContainer,
            input: classes.chipInput,
          }}
          value={terms}
          chipRenderer={chipRenderer}
          onFocus={handleFocus(true)}
          onUpdateInput={handleInput}
          onAdd={handleAddChip}
          onDelete={handleDeleteChip}
          newChipKeyCodes={[13, 188]}
        />
        <Tooltip title='clear all terms'>
          <IconButton
            className={classes.clearButton}
            color='inherit'
            onClick={handleClearTerms}
          >
            <ClearAll />
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
