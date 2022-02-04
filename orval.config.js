module.exports = {
    grants: {
        input: {
            target: './backend/api.json',
        },
        output: {
            target: './frontend/src/api.ts',
            client: 'react-query',
            baseURL: 'http://localhost:8888'
        },
    }
};