import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@material-ui/core';

import { styled } from '@material-ui/core/styles';

import TermsFilter from 'app/terms/TermsFilter';

import nsf from 'app/images/nsf_logo.png';

const StyledToolbar = styled(Toolbar)(({ theme }) => `
  padding-top: ${theme.spacing(1)};
  padding-bottom: ${theme.spacing(1)};
`);

const Logo = styled('img')(({ theme }) => `
  margin-right: ${theme.spacing(2)};
  width: ${theme.spacing(4)};
  height: ${theme.spacing(4)};
`);


const Title = styled(Typography)(({ theme }) => `
  flex-grow: 1;
  display: none;
  ${theme.breakpoints.up('sm')} {
    display: block;
  }
`);

const SearchAppBar = () => {

  return (
    <Box flexGrow={1}>
      <AppBar position="static">
        <StyledToolbar>
          <Box minWidth='15em' display='flex' flexDirection='row'>
            <Logo src={nsf} alt='national science foundation logo' />
            <Title variant="h6" noWrap>
              Grant Explorer
            </Title>
          </Box>
          <Box flexGrow={1} />
          <TermsFilter />
        </StyledToolbar>
      </AppBar>
    </Box>
  );
};

export default SearchAppBar;
