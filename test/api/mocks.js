'use strict';

const nock = require('nock');

const response = __dirname + '/responses/';

// Assets
nock('http://localhost:8080', { allowUnmocked: true })
    .persist()
    .get('/v1/server/assets')
    .replyWithFile(200, response + 'assets.json', {'Content-Type': 'application/json'}
    )

nock('http://localhost:8080', { allowUnmocked: true })
    .persist()
    .get('/v1/users/thinger/devices')
    .query(true)
    .replyWithFile(200, response + 'devices.json', {'Content-Type': 'application/json'}
    )

// Buckets
nock('http://localhost:8080', { allowUnmocked: true })
    .persist()
    .post('/v1/users/thinger/buckets/test/exports')
    .replyWithFile(200, response + 'bucket_export.json', {'Content-Type': 'application/json'}
    )

nock('http://localhost:8080', { allowUnmocked: true })
    .persist()
    .get('/v1/users/thinger/buckets/test/exports/20240725T114817Z.thinger.test.0Y0usZIe.csv')
    .replyWithFile(200, response + 'bucket_export.csv', {'Content-Type': 'text/csv'}
    )
