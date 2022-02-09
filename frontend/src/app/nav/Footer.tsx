import { styled, Typography } from '@material-ui/core';
import { RefObject } from 'react';

const StyledFooter = styled(Typography)`
  padding: 12px;
  font-size: 1.2em;
`;

const Footer = (props: { ref: RefObject<HTMLElement> }) => (
  <StyledFooter ref={props.ref}>
    Developed by Jesse Chamberlin, Jason Portenoy, Jevin West at the University of Washington DataLab, with sponsorship from the Moore Foundation 
  </StyledFooter>
);

export default Footer;