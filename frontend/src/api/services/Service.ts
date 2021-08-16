/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GrantsRequest } from '../models/GrantsRequest';
import type { SearchRequest } from '../models/SearchRequest';
import { request as __request } from '../core/request';

export class Service {

    /**
     * Main
     * @param toggle
     * @param terms
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async mainToggleTermsGet(
        toggle: any,
        terms: any,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/<toggle>/<terms>`,
            query: {
                'toggle': toggle,
                'terms': terms,
            },
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Main
     * @param toggle
     * @param terms
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async mainGet(
        toggle: any,
        terms: any,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/`,
            query: {
                'toggle': toggle,
                'terms': terms,
            },
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Divisions
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async loadDivisions(): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/divisions`,
        });
        return result.body;
    }

    /**
     * Search
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async search(
        requestBody: SearchRequest,
    ): Promise<any> {
        const result = await __request({
            method: 'POST',
            path: `/search`,
            body: requestBody,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Typeahead
     * @param prefix
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async loadTypeahead(
        prefix: string,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/keywords/typeahead/${prefix}`,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Related
     * @param keywords
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async loadRelated(
        keywords: string,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/keywords/related/${keywords}`,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Count Term
     * @param term
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async countTerm(
        term: string,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/keywords/count/${term}`,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Grant Data
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async loadGrants(
        requestBody: GrantsRequest,
    ): Promise<any> {
        const result = await __request({
            method: 'POST',
            path: `/grants`,
            body: requestBody,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

    /**
     * Get Abstract
     * @param id
     * @param terms
     * @returns any Successful Response
     * @throws ApiError
     */
    public static async loadAbstract(
        id: any,
        terms: any,
    ): Promise<any> {
        const result = await __request({
            method: 'GET',
            path: `/abstract/${id}/${terms}`,
            errors: {
                422: `Validation Error`,
            },
        });
        return result.body;
    }

}