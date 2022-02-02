import { useGrantsDialogQuery, useQuery } from 'app/query';
import { DefaultService as Service } from '../../oldapi/index';

const useGrantsDownload = () => {
  const [ query ] = useQuery();
  const [ dialog ] = useGrantsDialogQuery();

  return async () => {
    const data = await Service.downloadGrants({
      ...query,
      order: dialog.grantDirection,
      order_by: dialog.grantSort === 'title' ? 'title.raw' : dialog.grantSort ?? 'title.raw',
      start: dialog.grantDialogYear ?? query.start,
      end: dialog.grantDialogYear ?? query.end,
      divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
      idx: 0,
    });
    const blob = new Blob([data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'grants.csv';
    link.click();
  };
};

export default useGrantsDownload;