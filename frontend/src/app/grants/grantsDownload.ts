import { useQuery } from 'app/query';
import { DefaultService as Service } from '../../api/index';

const useGrantsDownload = () => {
  const [ query ] = useQuery();

  return async () => {
    const data = await Service.downloadGrants({
      ...query,
      order: query.grantDirection,
      order_by: query.grantSort === 'title' ? 'title.raw' : query.grantSort ?? 'title.raw',
      start: query.grantDialogYear ?? query.start,
      end: query.grantDialogYear ?? query.end,
      divisions: query.grantDialogDivision ? [query.grantDialogDivision] : query.divisions,
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