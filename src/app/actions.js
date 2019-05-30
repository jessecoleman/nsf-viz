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

export const getGrants = () => async (dispatch, getState) => {

  const { filter } = getState();

  const response = await fetch('/data/grants', {
    method: 'POST',
    body: JSON.stringify(filter),
  });
  switch (response.status) {
    case 200:
      //const grants = await response.body.getReader();
      const grants = await response.json();
      //await grants.read();
      console.log(grants);
      dispatch({
        type: 'LOADED_GRANTS',
        grants: grants,
      });
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
