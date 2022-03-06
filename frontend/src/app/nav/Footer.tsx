import { styled, Typography } from '@material-ui/core';
import { forwardRef, RefObject } from 'react';

const StyledFooter = styled(Typography)`
  padding: 12px;
  font-size: 1.2em;
`;

const Footer = forwardRef((props, ref) => (
  <StyledFooter ref={ref as RefObject<HTMLElement>}>
    Developed by Jesse Chamberlin, Jason Portenoy, Jevin West at the University of Washington DataLab<br />
    with sponsorship from the Moore Foundation 
  </StyledFooter>
));

export default Footer;