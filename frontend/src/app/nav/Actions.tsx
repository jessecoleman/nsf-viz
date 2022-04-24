import { Link, SpeedDial, SpeedDialAction, styled, Tooltip } from '@material-ui/core';
import { Download, GitHub, Science, InsertDriveFile } from '@mui/icons-material';
import useGrantsDownload from 'app/grants/grantsDownload';
import { useBeta, useGrantsDialogQuery } from 'app/query';
import { MouseEvent } from 'react';

const StyledAction = styled(SpeedDialAction)`
  & .MuiLink-root {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Actions = () => {

  const [ beta, setBeta ] = useBeta();
  const grantsUrl = useGrantsDownload();
  const [ , setDialogQuery ] = useGrantsDialogQuery();

  const actions = [
    // {
    //   name: 'Download Tabular Data',
    //   icon: <GridOn />,
    //   href: ''
    // },
    {
      name: 'Download Grant Data',
      icon: <Download />,
      href: grantsUrl,
      handleClick: (e: MouseEvent<HTMLElement>) => e.stopPropagation()
    },
    {
      name: 'View Source',
      icon: <GitHub />,
      href: 'https://github.com/jessecoleman/nsf-viz',
      handleClick: (e: MouseEvent<HTMLElement>) => e.stopPropagation()
    },
    {
      name: (beta ? 'Disable' : 'Enable') + ' Beta Features',
      icon: <Science htmlColor={beta ? 'red' : 'green'} />,
      handleClick: (e: MouseEvent<HTMLElement>) => { e.stopPropagation(); setBeta(!beta); }
    }
  ];
  
  const handleOpenGrants = (e: MouseEvent) => {
    // console.log(e.target, e.currentTarget.classList);
    if (e.currentTarget.classList.contains('MuiSpeedDial-root')) {
      setDialogQuery({ grantDialogOpen: true });
    }
  };
 
  return (
    <Tooltip title='View Grants' placement='left-end'>
      <SpeedDial
        ariaLabel='external links'
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<InsertDriveFile />}
        onClick={handleOpenGrants}
      >
        {actions.map((action) => (
          <StyledAction
            key={action.name}
            onClick={action.handleClick}
            icon={(
              <Link href={action.href}>
                {action.icon}
              </Link>
            )}
            tooltipTitle={action.name}
          />
        ))}
      </SpeedDial>
    </Tooltip>
  );
};

export default Actions;