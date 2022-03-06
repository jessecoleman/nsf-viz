import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, styled } from '@material-ui/core';
import { AddCircle } from '@mui/icons-material';
import Highlight from 'app/Highlight';
import { Flipped } from 'react-flip-toolkit';
import anime from 'animejs';
import { Term } from 'api';

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
  & .MuiListItemText-primary {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    & .forms {
      padding-left: ${theme.spacing(1)};
      color: ${theme.palette.text.disabled};
    }
  }
`);

// const animateIn = (e: HTMLElement) => (
//   animate(e, {
//     opacity: 100,
//     // transform: 'translate(0%, 100%)'
//   })
// );
// 
// const animateOut = (e: HTMLElement) => (
//   animate(e, {
//     opacity: 0,
//     // transform: 'translate(0%, -100%)'
//     // transform: 'scale(0%)'
//   })
// );

const animateIn = (el, i) =>
  anime({
    targets: el,
    opacity: 1,
    delay: i * 15,
    easing: 'easeOutSine',
    duration: 100,
  });

const animateOut = (el, i, onComplete) => {
  anime({
    targets: el,
    opacity: 0,
    // delay: i * 10,
    easing: 'easeOutSine',
    duration: 100,
    complete: onComplete
  });
};

type TermsListProps = {
  input: string
  header: string
  filter: string[]
  terms: Term[] | undefined
  onAddChip: (term: string) => void
}

const TermsList = (props: TermsListProps) => (
  <List subheader={<ListSubheader>{props.header}</ListSubheader>}>
    {props.terms
      ?.map(t => (
        <Flipped
          key={t.term}
          flipId={`${t.term}-suggest`}
          onAppear={animateIn}
          onExit={animateOut}
        >
          <div>
            <StyledListItem
              key={t.term}
              dense
              onClick={() => props.onAddChip(t.term)}
            >
              <ListItemText>
                <Highlight
                  value={t.term}
                  query={props.input}
                />
                <span className='forms'>
                  {t.forms.join(', ')}
                </span>
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