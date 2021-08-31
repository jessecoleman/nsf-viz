/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Aggregate } from './Aggregate';
import type { DivisionAggregate } from './DivisionAggregate';

export type SearchResponse = {
    per_division: Array<DivisionAggregate>;
    sum_total: Array<Aggregate>;
}
