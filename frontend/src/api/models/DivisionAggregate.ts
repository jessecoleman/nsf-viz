/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { DivisionBuckets } from './DivisionBuckets';
import type { GrantAmounts } from './GrantAmounts';

export type DivisionAggregate = {
    key?: string;
    key_as_string?: string;
    doc_count: number;
    grant_amounts?: GrantAmounts;
    divisions: DivisionBuckets;
}
