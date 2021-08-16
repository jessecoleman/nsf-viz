import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@material-ui/core';

import { Theme, makeStyles } from '@material-ui/core/styles';

import TermsFilter from 'app/components/TermsFilter';

import nsf from 'app/images/nsf_logo.png';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
  },
  toolbar: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  logo: {
    marginRight: theme.spacing(2),
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  title: {
    flexGrow: 1,
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
}));

const SearchAppBar = () => {

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar className={classes.toolbar}>
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
