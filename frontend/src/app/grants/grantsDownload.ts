import Axios from 'axios';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import { stringifyUrl } from 'query-string';

const useGrantsDownload = () => {
  const [ query ] = useQuery();
  const [ dialog ] = useGrantsDialogQuery();

  const url = stringifyUrl({
    url: `${Axios.defaults.baseURL}/grants/download`,
    query: {
      ...query,
      order: dialog.grantDirection,
      sort: dialog.grantSort,
      start: dialog.grantDialogYear ?? query.start,
      end: dialog.grantDialogYear ?? query.end,
      divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
    }
  });
  
  return url;
};

export default useGrantsDownload;