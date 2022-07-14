import { 
  AppBar,
  Toolbar,
  Tooltip,
  Typography,
  Box,
  Button,
  styled,
  Link,
} from '@material-ui/core';

import TermsFilter from 'app/terms/TermsFilter';

import grantExplorer from 'app/images/grant-explorer.svg';
import DrawerToggle from './DrawerToggle';
import { forwardRef } from 'react';
import { useWizardRef } from 'app/wizard/wizard';
import { Info } from '@mui/icons-material';
import { useAbout } from 'app/query';

const StyledToolbar = styled(Toolbar)(({ theme }) => `
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: end;
  padding: 0;
  gap: ${theme.spacing(1)};
  &:last-child {
    flex-grow: 1;
  }
  ${theme.breakpoints.up('md')} {
    padding: ${theme.spacing(1)};
    flex-direction: row;
    &:last-child {
      flex-grow: initial;
    }
  }
`);

const Logo = styled('img')(({ theme }) => `
  margin-right: ${theme.spacing(2)};
  width: ${theme.spacing(4)};
  height: ${theme.spacing(4)};
`);

const AboutButton = styled(Button)(({ theme }) => `
  color: white;
  border: 1px solid white;
  height: ${theme.spacing(6)};
  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
`);

const TitleBar = styled(Box)(({ theme }) => `
  width: 100%;
  height: 3em;
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
  & .MuiLink-root {
    color: white;
    text-decoration: none;
  }
`);

const SearchAppBar = forwardRef<HTMLDivElement>((props, ref) => {
  const { ref: titleBarRef } = useWizardRef<HTMLDivElement>('hello');
  const [ , setAboutOpen ] = useAbout();
  const handleClickAbout = () => {
    setAboutOpen(true);
  };
  console.log(window.location.href.split('/?')[0]);
  return (
    <AppBar position='static' ref={ref}>
      <StyledToolbar>
        <TitleBar ref={titleBarRef}>
          <DrawerToggle />
          <Logo src={grantExplorer} alt='GrantExplorer logo' />
          <Title variant='h6' noWrap>
            <Link href='?'>
              GrantExplorer
            </Link>
          </Title>
        </TitleBar>
        <Box flexGrow={3} />
        <Tooltip title='about'>
          <AboutButton
            variant='outlined'
            onClick={handleClickAbout}
            startIcon={<Info htmlColor='white' />}
          >
            About
          </AboutButton>
        </Tooltip>
        <TermsFilter />
      </StyledToolbar>
    </AppBar>
  );
});

export default SearchAppBar;
