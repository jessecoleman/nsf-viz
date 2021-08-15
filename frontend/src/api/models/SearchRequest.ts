/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type SearchRequest = {
    boolQuery: string;
    terms: Array<string>;
    dependant: string;
    divisions: Array<string>;
    fields: Array<string>;
}
