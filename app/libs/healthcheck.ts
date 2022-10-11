const http = require('http');

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"]!) : 3000;

const options = {
    host: '0.0.0.0',
    port: PORT,
    timeout: 2000
};

const healthCheck = http.request(options, (res) => {
    console.log(`HEALTHCHECK STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
});

healthCheck.on('error', function (err) {
    console.error('ERROR');
    process.exit(1);
});

healthCheck.end();
