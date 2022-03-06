import { Link, SpeedDial, SpeedDialAction, SpeedDialIcon, styled, Tooltip } from '@material-ui/core';
import { Download, GitHub, GridOn, InsertDriveFile } from '@mui/icons-material';
import useGrantsDownload from 'app/grants/grantsDownload';
import { useGrantsDialogQuery } from 'app/query';
import { MouseEvent } from 'react';

const StyledAction = styled(SpeedDialAction)`
  & .MuiLink-root {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Actions = () => {

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
      href: grantsUrl
    },
    {
      name: 'View Source',
      icon: <GitHub />,
      href: 'https://github.com/jessecoleman/nsf-viz'
    }
  ];
  
  const handleOpenGrants = (e: MouseEvent) => {
    console.log(e.target, e.currentTarget.classList);
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
            icon={(
              <Link
                onClick={e => e.stopPropogation()}
                href={action.href}
              >
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