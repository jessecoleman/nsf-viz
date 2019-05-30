import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { fade } from '@material-ui/core/styles/colorManipulator';

import Grid from '@material-ui/core/Grid';
import ChipInput from 'material-ui-chip-input';
import SearchIcon from '@material-ui/icons/Search';

import { addChips, deleteChip } from 'app/actions';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
      '&:before': {
        backgroundColor: fade(theme.palette.common.white, 0),
        height: 0,
      },
      '&:hover:before': {
        height: 0,
      },
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
  }),
);


const TermsFilter: React.FC<{
}> = (props) => {

  const classes = useStyles();
  const terms = useSelector(state => state.filter.terms);
  const dispatch = useDispatch();

  const handleAddChip = (chips) => {
    dispatch(addChips(chips.split(',')));
  };

  const handleDeleteChip = (chip, index) => {
    dispatch(deleteChip(chip, index));
  };

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <ChipInput
        classes={{
          root: classes.chipRoot,
          chipContainer: classes.chipContainer,
          input: classes.chipInput,
        }}
        value={terms}
        onAdd={handleAddChip}
        onDelete={handleDeleteChip}
        newChipKeyCodes={[13, 188]}
      />
    </div>
  );
}

export default TermsFilter;
