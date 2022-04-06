import { styled, Box, Typography } from '@material-ui/core';
import { forwardRef } from 'react';
import mooreLogo from '../images/moore-foundation-logo.svg';
import dataLabLogo from '../images/datalab-logo.svg';

const StyledFooter = styled(Box)(({ theme }) => `
  display: flex;
  align-items: center;
  font-size: 1.2em;
  img {
    padding: 0.5em;
    max-height: 4em;
  }
  p { 
    padding: 12px;
    margin-right: 72px;
  }
  ${theme.breakpoints.down('lg')} {
    font-size: 0.8em;
    flex-direction: column;
  }
`);

const Footer = forwardRef((props, ref) => (
  <StyledFooter ref={ref}>
    <div>
      <img src={mooreLogo} />
      <img src={dataLabLogo} />
    </div>
    <Typography>
      {'Developed by Jesse "Cole" Chamberlin, Jason Portenoy, Jevin West at the University of Washington DataLab'}
      <br />
      {'with sponsorship from the Moore Foundation'}
    </Typography>
  </StyledFooter>
));

export default Footer;