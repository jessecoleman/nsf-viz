import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
  styled
} from '@material-ui/core';
import { Menu } from '@material-ui/icons';

import TermsFilter from 'app/terms/TermsFilter';

import nsf from 'app/images/nsf_logo.png';
import DrawerToggle from './DrawerToggle';

const StyledToolbar = styled(Toolbar)(({ theme }) => `
  display: flex;
  flex-direction: column;
  padding-top: ${theme.spacing(1)};
  padding-bottom: ${theme.spacing(1)};
  ${theme.breakpoints.up('md')} {
    flex-direction: row;
  }
`);

const Logo = styled('img')(({ theme }) => `
  margin-right: ${theme.spacing(2)};
  width: ${theme.spacing(4)};
  height: ${theme.spacing(4)};
`);

const TitleBar = styled(Box)(({ theme }) => `
  width: 100%;
  // height: 4em;
  display: flex;
  flex-direction: row;
  align-items: center;
  & img {
    margin-left: auto;
  }
  & h6 {
    margin-right: auto;
  }
  ${theme.breakpoints.up('md')} {
    width: 15em;
    height: 100%
    & img {
      margin-left: default;
    }
    & h6 {
      margin-right: default;
    }
  }
`);

const Title = styled(Typography)(({ theme }) => `
  display: inline;
  ${theme.breakpoints.up('md')} {
    display: block;
  }
`);

const SearchAppBar = () => {
  
  return (
    <AppBar position='static'>
      <StyledToolbar>
        <TitleBar>
          <DrawerToggle>
            <Menu color='inherit' />
          </DrawerToggle>
          <Logo src={nsf} alt='national science foundation logo' />
          <Title variant='h6' noWrap>
            Grant Explorer
          </Title>
        </TitleBar>
        <Box flexGrow={1} />
        <TermsFilter />
      </StyledToolbar>
    </AppBar>
  );
};

export default SearchAppBar;
