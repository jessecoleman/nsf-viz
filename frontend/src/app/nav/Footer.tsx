import { styled, Box, Typography } from '@material-ui/core';
import { forwardRef } from 'react';
import mooreLogo from '../images/moore-foundation-logo.svg';
import dataLabLogo from '../images/datalab-logo.svg';

const StyledFooter = styled(Box)`
  display: flex;
  align-items: center;
  img {
    padding: 0.5em;
    max-height: 4em;
  }
  p { 
    padding: 12px;
    font-size: 1.2em;
  }
`;

const Footer = forwardRef((props, ref) => (
  <StyledFooter ref={ref}>
    <img src={mooreLogo} />
    <img src={dataLabLogo} />
    <Typography>
    Developed by Jesse Chamberlin, Jason Portenoy, Jevin West at the University of Washington DataLab<br />
    with sponsorship from the Moore Foundation 
    </Typography>
  </StyledFooter>
));

export default Footer;