/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { GrantAmounts } from './GrantAmounts';

export type Aggregate = {
    key?: string;
    key_as_string?: string;
    doc_count: number;
    grant_amounts?: GrantAmounts;
}
