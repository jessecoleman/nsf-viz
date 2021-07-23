import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Theme, makeStyles } from '@material-ui/core/styles';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { DebounceInput } from 'react-debounce-input';

import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Collapse,
  ClickAwayListener,
} from '@material-ui/core';

import ChipInput from 'material-ui-chip-input';
import {
  Search,
  AddCircle,
} from '@material-ui/icons';

import {
  getSuggestions,
  addChips,
  deleteChip,
} from 'app/actions';

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
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
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
    marginTop: theme.spacing(.5),
    width: '100%',
    zIndex: 3,
  },
  listIcon: {
    minWidth: 0,
  },
}));



const TermsFilter: React.FC<{
}> = (props) => {

  const classes = useStyles();
  const terms = useSelector(state => state.filter.terms);
  const suggestions = useSelector(state => state.data.suggestions);
  const dispatch = useDispatch();
  const [ focused, setFocused ] = useState(false);

  const handleFocus = focused => () => {
    setFocused(focused);
  };

  const handleInput = (e) => {
    e.persist();
    if (e.target.value.length) {
      dispatch(getSuggestions(e.target.value));
    }
  };

  const handleAddChip = (chips) => {
    dispatch(addChips(chips.split(',')));
  };

  const handleDeleteChip = (chip, index) => {
    dispatch(deleteChip(chip, index));
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
          {suggestions &&
            <Paper className={classes.dropdown}>
              <List>
                {suggestions.map((t, i) => (
                  <ListItem key={i} dense button onClick={() => handleAddChip(t)}>
                    <ListItemText>{t}</ListItemText>
                    <ListItemIcon className={classes.listIcon}><AddCircle /></ListItemIcon>
                  </ListItem>
                ))}
              </List>
            </Paper>
          }
        </Collapse>
      </div>
    </ClickAwayListener>
  );
}

export default TermsFilter;
