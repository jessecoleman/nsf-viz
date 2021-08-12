import React from 'react';
import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@material-ui/core';

import { alpha } from '@material-ui/core/styles/colorManipulator';
import { Theme, makeStyles } from '@material-ui/core/styles';

import TermsFilter from 'app/components/TermsFilter';

import nsf from 'app/images/nsf_logo.png';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
  },
  logo: {
    marginRight: theme.spacing(2),
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
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
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
}));

const SearchAppBar = () => {

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Box minWidth='15em' display='flex' flexDirection='row'>
            <img className={classes.logo} src={nsf} alt='national science foundation logo' />
            <Typography className={classes.title} variant="h6" noWrap>
              Grant Explorer
            </Typography>
          </Box>
          <Box flexGrow={1} />
          <TermsFilter />
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default SearchAppBar;
