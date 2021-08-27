import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, styled } from '@material-ui/core';
import { AddCircle } from '@material-ui/icons';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import FlipMove from 'react-flip-move';

const StyledIcon = styled(ListItemIcon)(({ theme }) => `
  min-width: 0;
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
    <FlipMove
      typeName={null}
      enterAnimation='fade'
      leaveAnimation='fade'
    >
      {props.terms.filter(t => props.filter.indexOf(t) === -1).map(t => (
        <ListItem
          key={t}
          dense
          button
          onClick={() => props.onAddChip(t)}
        >
          <ListItemText>
            {parse(t, match(t, props.input)).map((part, idx) => (
              <span key={idx} style={{ fontWeight: part.highlight ? 700 : 400}}>
                {part.text}
              </span>
            ))}
          </ListItemText>
          <StyledIcon>
            <AddCircle />
          </StyledIcon>
        </ListItem>
      ))}
    </FlipMove>
  </List>
);

export default TermsList;