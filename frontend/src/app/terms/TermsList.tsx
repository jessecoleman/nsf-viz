import { List, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@material-ui/core';
import { AddCircle } from '@material-ui/icons';
import FlipMove from 'react-flip-move';

type TermsListProps = {
  header: string
  filter: string[]
  terms: string[]
  onAddChip: (term: string) => void
}

const TermsList = (props: TermsListProps) => (
  <List subheader={<ListSubheader>{props.header}</ListSubheader>}>
    <FlipMove
      typeName={null}
      // staggerDurationBy={50}
      // appearAnimation='accordionVertical'
      enterAnimation='fade'
      leaveAnimation='fade'
    >
      {props.terms.filter(t => props.filter.indexOf(t) === -1).map(t => (
        <ListItem key={t} dense button onClick={() => props.onAddChip(t)}>
          <ListItemText>{t}</ListItemText>
          <ListItemIcon><AddCircle /></ListItemIcon>
        </ListItem>
      ))}
    </FlipMove>
  </List>
);

export default TermsList;