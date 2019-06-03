const http = require('http');
const crypto = require('crypto');
const shell = require('shelljs');

let config = {
    secret: process.env.GITHUB_HOOK_RECEIVER_SECRET,
    scriptPath: process.env.GITHUB_HOOK_RECEIVER_SCRIPT,
    branch: process.env.GITHUB_HOOK_RECEIVER_BRANCH
};

function root(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("listener is running");
    res.end();
}

function payload(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const hmac = crypto.createHmac('sha1', config.secret);
        hmac.update(body);
        const secretGeneratedCode = 'sha1=' + hmac.digest('hex');
        if ( secretGeneratedCode !== req.headers['x-hub-signature']) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.write("Signatures didn't match!");
            res.end();
        } else {
            body = JSON.parse(body);
            if (body['ref'] === `refs/heads/${config.branch}`) {
                shell.exec(config.scriptPath)
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write("ok");
            res.end();
        }
    });
}

function notFound(req, res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write("this path not found!");
    res.end();
}

const server = http.createServer(function (req, res) {
    switch (req.url) {
        case '/':
            root(req, res);
            break;
        case '/payload':
            payload(req, res);
            break;
        default:
            notFound(req, res);
    }
});

server.on('listening', (req) => {
    console.log(`server listening on http://localhost:8999`)
})

server.listen(8999);