module.exports = {
    grants: {
        input: {
            target: './backend/api.json',
        },
        output: {
            target: './frontend/src/api.ts',
            client: 'react-query',
        },
    }
};