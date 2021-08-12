import React, { useState, ChangeEvent } from 'react';

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
} from '@material-ui/core';

import ChipInput from 'material-ui-chip-input';
import {
  Search,
  AddCircle,
} from '@material-ui/icons';

import {
  loadData,
  loadRelated,
  loadTypeahead,
} from 'app/actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getRelated, getTerms, getTypeahead } from 'app/selectors';
import { addChips, deleteChip } from 'app/filterReducer';

const useStyles = makeStyles((theme: Theme) => ({
  title: {
    flexGrow: 1,
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  search: {
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
}));

type TermsListProps = {
  header: string
  filter: string[]
  terms: string[]
  onAddChip: (term: string) => () => void
}

const TermsList = (props: TermsListProps) => (
  <List subheader={<ListSubheader>{props.header}</ListSubheader>}>
    {props.terms.filter(t => props.filter.indexOf(t) === -1).map((t, i) => (
      <ListItem key={i} dense button onClick={props.onAddChip(t)}>
        <ListItemText>{t}</ListItemText>
        <ListItemIcon><AddCircle /></ListItemIcon>
      </ListItem>
    ))}
  </List>
);

const TermsFilter = () => {

  const dispatch = useAppDispatch();
  const classes = useStyles();
  const terms = useAppSelector(getTerms);
  const typeahead = useAppSelector(getTypeahead);
  const related = useAppSelector(getRelated);
  const [ focused, setFocused ] = useState(false);

  const handleFocus = (focused: boolean) => () => {
    setFocused(focused);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length) {
      dispatch(loadTypeahead(e.target.value));
    }
  };

  const handleAddChip = (chips: string) => () => {
    dispatch(addChips(chips.split(',')));
    dispatch(loadData());
    dispatch(loadRelated());
  };

  const handleDeleteChip = (chip: string, idx: number) => {
    dispatch(deleteChip({ chip, idx }));
    dispatch(loadData());
    dispatch(loadRelated());
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
          onFocus={handleFocus(true)}
          onUpdateInput={handleInput}
          onAdd={handleAddChip}
          onDelete={handleDeleteChip}
          newChipKeyCodes={[13, 188]}
        />
        <Collapse in={focused}>
          {(related.length + typeahead.length) > 0 &&
            <Paper className={classes.dropdown}>
              <List>
                <TermsList
                  header='autocomplete'
                  filter={terms}
                  terms={typeahead}
                  onAddChip={handleAddChip}
                />
                <Divider />
                <TermsList
                  header='related terms'
                  filter={terms}
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
