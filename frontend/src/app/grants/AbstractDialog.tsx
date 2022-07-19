import { MouseEvent } from 'react';

import LaunchIcon from '@mui/icons-material/Launch';
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Link,
  Typography,
  styled,
} from '@mui/material';

import { useLoadAbstract } from 'api';
import * as d3 from 'd3';

import { useBeta, useGrantIdQuery, useTermsQuery } from 'app/query';

const Title = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.text.primary};
`
);

const Subtitle = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.text.secondary};
`
);

const Abstract = styled(Typography)(
  ({ theme }) => `
  line-height: 1.75;
  & em {
    display: inline-block;
    font-style: normal;
    background: ${theme.palette.grey[300]};
    padding: ${theme.spacing(0.25, 1)};
    border-radius: ${theme.spacing(2)};
  }
  & i {
    display: inline-block;
    box-sizing: border-box;
    font-style: normal;
    padding: ${theme.spacing(0.25, 1)};
    border: 1px solid ${theme.palette.grey[500]};
    border-radius: ${theme.spacing(2)};
    &:hover {
      cursor: pointer;
      background-color: ${theme.palette.grey[300]};
    }
  }
`
);

const AbstractDialog = () => {
  const [beta] = useBeta();
  const [terms, setTerms] = useTermsQuery();
  const [grantId, setGrantId] = useGrantIdQuery();
  const { data: grant, isLoading } = useLoadAbstract(
    grantId,
    { terms, beta },
    {
      query: {
        keepPreviousData: true,
        enabled: grantId !== undefined,
        select: (d) => d.data,
      },
    }
  );

  const dismissDialog = () => {
    setGrantId(undefined);
  };

  const timeConvert = (date: string) =>
    d3.timeFormat('%b %e, %Y')(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      d3.timeParse('%Y-%m-%d')(date)!
    );

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.nodeName.toLowerCase() === 'i') {
      setTerms(terms.concat([target.innerText]));
    }
  };

  return (
    <Dialog open={!!grantId} onClose={dismissDialog}>
      {grant && (
        <>
          <DialogTitle>
            <Title variant='h5'>
              {grant.title}
              {grant.external_url && (
                <Link
                  href={grant.external_url}
                  target='_blank'
                  rel='noreferrer'
                >
                  <LaunchIcon />
                </Link>
              )}
            </Title>
            <Subtitle variant='h6'>{grant.cat1_raw}</Subtitle>
            <Subtitle variant='h6'>{timeConvert(grant.date)}</Subtitle>
            <Subtitle variant='h6'>{d3.format('$,')(grant.amount)}</Subtitle>
            {grant.recipient_org && (
              <Subtitle variant='body2'>
                Recipient Organization: {grant.recipient_org}
              </Subtitle>
            )}
            {grant.investigators && (
              <Subtitle variant='body2'>
                Principal Investigator(s): {grant.investigators}
              </Subtitle>
            )}
          </DialogTitle>
          <DialogContent>
            <Collapse in={!!grant.abstract}>
              <Abstract
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: grant.abstract ?? '' }}
              />
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={dismissDialog}>Dismiss</Button>
          </DialogActions>
        </>
      )}
      {isLoading && <LinearProgress />}
    </Dialog>
  );
};

export default AbstractDialog;
