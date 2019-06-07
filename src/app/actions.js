import 'whatwg-fetch';
import queryString from 'query-string';

export const getData = () => async (dispatch, getState) => {
  //const route = queryString.stringify(query);

  dispatch({
    type: 'LOADING_DATA'
  });

  const { filter } = getState();

  const response = await fetch('/data/search', {
    method: 'POST',
    body: JSON.stringify(filter),
  });
  switch (response.status) {
    case 200:
      const data = await response.json();
      dispatch({
        type: 'LOADED_DATA',
        perYear: data.per_year.aggregations,
        perDivision: data.per_division.aggregations,
        sumTotal: data.sum_total.aggregations,
      });
    default:
      break;
  }
}

export const getGrants = (idx) => async (dispatch, getState) => {

  const { filter } = getState();

  const response = await fetch('/data/grants', {
    method: 'POST',
    body: JSON.stringify({ idx, ...filter }),
  });
  switch (response.status) {
    case 200:
      const grants = await response.json();
      console.log(idx);
      dispatch({
        type: 'LOADED_GRANTS',
        grants: grants,
      });
      break;
    case 404:
    case 500:
      console.log(idx, 'no more grants')
      dispatch({
        type: 'NO_MORE_GRANTS',
      });
      break;
    default:
      break;
  }
}

export const getDivisions = () => async (dispatch, getState) => {

  const { filter } = getState();

  const response = await fetch('/data/divisions');

  switch (response.status) {
    case 200:
      //const grants = await response.body.getReader();
      const text = await response.text();
      const divisions = text.split('\n').map(row => {
        const [ title, selected ] = row.split(',');
        return {
          title: title,
          selected: selected === 'y',
        }
      });
      console.log(divisions);
      dispatch({
        type: 'LOADED_DIVISIONS',
        divisions: divisions,
      });
    default:
      break;
  }
}

export const selectAllDivisions = (selected) => ({
  type: 'SELECT_ALL_DIVISIONS',
  selected: selected,
});

export const selectDivision = (key) => ({
  type: 'SELECT_DIVISION',
  key: key,
});

export const addChips = chips => async (dispatch, getState) => {

  dispatch({
    type: 'ADD_CHIPS',
    chips: chips,
  });

  dispatch(getData());
}

export const deleteChip = (chip, i) => async (dispatch, getState) => {

  dispatch({
    type: 'DELETE_CHIP',
    chip: chip,
    i: i,
  });

  dispatch(getData());
}
