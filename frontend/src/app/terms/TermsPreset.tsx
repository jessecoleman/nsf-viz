import { Science, Shuffle } from '@mui/icons-material';
import {
  Box,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListSubheader,
} from '@mui/material';
import { styled } from '@mui/system';

import { useTermsQuery } from 'app/query';

import { useGetTopics } from '../../api';
import TermChip from './TermChip';

const StyledList = styled(List)(
  ({ theme }) => `
  padding-bottom: 0;
  & .MuiListSubheader-root {
    display: flex;
    align-items: center;
  }
  & .MuiLinearProgress-root {
    margin-bottom: -4px;
  }
  & .MuiListItem-root {
    cursor: pointer;
    border-top: 1px solid ${theme.palette.grey[200]};
    display: flex;
    flex-wrap: wrap;
    & .MuiChip-root {
      margin-right: ${theme.spacing(1)};
      pointer-events: none;
    }
    &:hover {
      background-color: ${theme.palette.grey[200]};
      & .MuiChip-root {
        background-color: ${theme.palette.grey[400]};
      }
    }
  }
`
);

const TermsPreset = () => {
  const { data: topics, isFetching, refetch } = useGetTopics();
  const [, setTerms] = useTermsQuery();

  const handleSelectTopic = (topicIdx: number) => {
    if (topics?.data) {
      console.log(topics, topicIdx);
      setTerms(topics.data[topicIdx].terms.map((term) => term.term));
    }
  };

  const handleShuffleTopics = () => refetch();

  return (
    <StyledList>
      <ListSubheader>
        <Science />
        Start searching a topic
        <Box flexGrow={1} />
        <Button onClick={handleShuffleTopics} endIcon={<Shuffle />}>
          See new topics
        </Button>
      </ListSubheader>
      {isFetching && <LinearProgress />}
      {topics?.data.map((topic, i) => (
        <ListItem key={i} onClick={() => handleSelectTopic(i)}>
          {topic.terms.map((term) => (
            <TermChip key={term.term} term={term.term} count={term.count} />
          ))}
        </ListItem>
      ))}
    </StyledList>
  );
};

export default TermsPreset;
