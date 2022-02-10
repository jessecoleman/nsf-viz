import { Link, SpeedDial, SpeedDialAction, SpeedDialIcon, styled } from '@material-ui/core';
import { GitHub, GridOn, InsertDriveFile } from '@mui/icons-material';
import useGrantsDownload from 'app/grants/grantsDownload';

const StyledAction = styled(SpeedDialAction)`
  & .MuiLink-root {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Actions = () => {

  const grantsUrl = useGrantsDownload();

  const actions = [
    // {
    //   name: 'Download Tabular Data',
    //   icon: <GridOn />,
    //   href: ''
    // },
    {
      name: 'Download Grant Data',
      icon: <InsertDriveFile />,
      href: grantsUrl
    },
    {
      name: 'View Source',
      icon: <GitHub />,
      href: 'https://github.com/jessecoleman/nsf-viz'
    }
  ];
 
  return (
    <SpeedDial
      ariaLabel='external links'
      sx={{ position: 'absolute', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <StyledAction
          key={action.name}
          icon={<Link href={action.href}>{action.icon}</Link>}
          tooltipTitle={action.name}
        />
      ))}
    </SpeedDial>
  );
};

export default Actions;