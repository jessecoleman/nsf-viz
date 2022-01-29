import { Link, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/core';
import { GitHub, GridOn, InsertDriveFile } from '@mui/icons-material';
import useGrantsDownload from 'app/grants/grantsDownload';

const Actions = () => {

  const handleDownloadGrants = useGrantsDownload();

  const actions = [
    {
      name: 'Download Tabular Data',
      icon: <GridOn />,
      href: ''
    },
    {
      name: 'Download Grant Data',
      icon: <InsertDriveFile />,
      onClick: handleDownloadGrants,
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
        <SpeedDialAction
          key={action.name}
          icon={<Link href={action.href}>{action.icon}</Link>}
          tooltipTitle={action.name}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  );
};

export default Actions;