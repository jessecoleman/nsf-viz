import { useLoadDirectory } from 'api';
import { StringParam, useQueryParam } from 'use-query-params';

export const useDirectory = () => {
  const [ org ] = useQueryParam('org', StringParam);
  const {
    data: {
      divisionMap,
      divisionTree,
    } = {
      divisionMap: {},
      divisionTree: {}
    },
    ...rest
  } = useLoadDirectory(org ?? 'nsf', {
    query: {
      // onSuccess: ({ data }) => {
      //   setExpanded(data.map(d => d.abbr));
      // },
      keepPreviousData: true,
      select: ({ data }) => ({
        divisionMap: Object.fromEntries(data.flatMap(({ departments = [], ...d }) => (
          [[d.abbr, d]].concat(departments.map(d => [d.abbr, d]))
        ))),
        divisionTree: Object.fromEntries(data.map(dir => [
          dir.abbr,
          dir.departments?.map(d => d.abbr) ?? []
        ]))
      }),
    }
  });
  
  return {
    divisionMap,
    divisionTree,
    ...rest,
  };
};
