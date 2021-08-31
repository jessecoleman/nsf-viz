/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { GrantAmounts } from './GrantAmounts';

export type Bucket = {
    key: string;
    doc_count: number;
    grant_amounts: GrantAmounts;
}
