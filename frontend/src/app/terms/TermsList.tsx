import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, styled } from '@material-ui/core';
import { AddCircle } from '@mui/icons-material';
import Highlight from 'app/Highlight';
import { Flipped } from 'react-flip-toolkit';

const StyledListItem = styled(ListItem)(({ theme }) => `
  background-color: white;
  border-top: 1px solid ${theme.palette.grey[200]};
  &:hover {
    cursor: pointer;
    background-color: ${theme.palette.grey[200]};
  }
  & .MuiListItemIcon-root {
    min-width: 0;
  }
`);

type TermsListProps = {
  input: string
  header: string
  filter: string[]
  terms: string[]
  onAddChip: (term: string) => void
}

const TermsList = (props: TermsListProps) => (
  <List subheader={<ListSubheader>{props.header}</ListSubheader>}>
    {props.terms.filter(t => props.filter.indexOf(t) === -1).map(t => (
      <Flipped key={t} flipId={`${t}-suggest`}>
        <div>
          <StyledListItem
            key={t}
            dense
            onClick={() => props.onAddChip(t)}
          >
            <ListItemText>
              <Highlight
                value={t}
                query={props.input}
              />
            </ListItemText>
            <ListItemIcon>
              <AddCircle />
            </ListItemIcon>
          </StyledListItem>
        </div>
      </Flipped>
    ))}
  </List>
);

export default TermsList;