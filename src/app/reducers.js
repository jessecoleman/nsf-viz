const dataState = {
  perYear: null,
  perDivision: null,
  grants: [],
  suggestions: [],
  sumTotal: null,
  noMoreGrants: false,
  viewingAbstract: 10,
};

const filterState = {
  dependant: 'divisions',
  boolQuery: 'any',
  terms: ['data science', 'machine learning'],
  divisions: {},
  fields: ['title'] //, 'abstract'],
};

export function filterReducer(state = filterState, action) {

  switch (action.type) {
    case 'SET_TERMS':
      return {
        ...state,
        terms: action.terms,
      };
    case 'ADD_CHIPS':
      return {
        ...state,
        terms: state.terms.concat(action.chips),
      };    
    case 'DELETE_CHIP':
      return {
        ...state,
        terms: [
          ...state.terms.slice(0, action.i),
          ...state.terms.slice(action.i + 1),
        ],
      };
    case 'SET_BOOL_QUERY':
      return {
        ...state,
        boolQuery: action.boolQuery,
      };
    case 'LOADED_DIVISIONS':
      return {
        ...state,
        divisions: action.divisions.reduce((obj, div) => {
          obj[div.title] = {
            title: div.title,
            selected: div.selected,
            count: '',
            amount: '',
          };
          return obj;
        }, {}),
      };
    case 'LOADED_DATA':
      const divisions = action.sumTotal.divisions.buckets.reduce((obj, div) => {
        obj[div.key] = div;
        return obj;
      }, {});
      return {
        ...state,
        divisions: Object.values(state.divisions).reduce((obj, div) => {
          const bucket = divisions[div.title];
          obj[div.title] = {
            ...div,
            count: bucket ? bucket.doc_count : 0,
            amount: bucket ? bucket.grant_amounts_total.value : 0,
          };
          return obj;
        }, {}),
      };
    case 'SELECT_DIVISION':
      return {
        ...state,
        divisions: {
          ...state.divisions,
          [action.key]: {
            ...state.divisions[action.key],
            selected: !state.divisions[action.key].selected,
          }
        }
      };
    case 'SELECT_ALL_DIVISIONS':
      return {
        ...state,
        divisions: Object.values(state.divisions).reduce((obj, div) => {
          obj[div.title] = {
            ...div,
            selected: action.selected,
          };
          return obj;
        }, {}),
      };
    default:
      return state;
  }
}

export function dataReducer(state = dataState, action) {

  switch (action.type) {
    case 'LOADING_DATA':
      return {
        ...state,
        loading: true,
      }
    case 'LOADED_DATA':
      return {
        ...state,
        loading: false,
        perYear: action.perYear,
        perDivision: action.perDivision,
        sumTotal: action.sumTotal,
      };
    case 'LOADED_GRANTS':
      return {
        ...state,
        grants: [
          ...state.grants,
          ...action.grants
        ],
      };
    case 'NO_MORE_GRANTS':
      return {
        ...state,
        noMoreGrants: true,
      };
    case 'SORTED_GRANTS':
      return {
        ...state,
        sortBy: action.sortBy,
        sort: action.sort,
      };
    case 'SET_VIEWING': 
      return {
        ...state,
        viewingAbstract: action.idx
      };
    case 'LOADED_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.suggestions,
      };
    default:
      return state;
  }
}
