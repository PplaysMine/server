const config = require('./config');
const express = require('express');
const https = require('https');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const basicAuth = require('express-basic-auth');

const options = {
    key: fs.readFileSync(config.ssl.keyLoc),
    cert: fs.readFileSync(config.ssl.certLoc),
}

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SELab 22A13 endpoint documentation",
            version: "1.0.0",
            description: "Splitted in two endpoints: User & Data",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
                contact: {
                name: "",
                url: "",
                email: "",
            },
        },
        servers: [
            {
                url: config.server.url
            },
        ],
    },
    apis: ["./routes/user.js", "./routes/data.js"],
};

const specs = swaggerJsdoc(swaggerOptions);

function basicAuthAuthorizer(user, pass) {
    const userMatches = basicAuth.safeCompare(user, config.docs.user);
    const passwordMatches = basicAuth.safeCompare(pass, config.docs.pass);

    return userMatches & passwordMatches;
}

app = express();
app.use(express.json());
app.use('/user', require('./routes/user'));
app.use('/data', require('./routes/data'));
app.use("/api-docs", basicAuth({
    authorizer: basicAuthAuthorizer,
    challenge: true
}), swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

var httpsServer = https.createServer(options, app);
httpsServer.listen(config.server.port, () => {
    console.log(`Listening on port ${config.server.port}`);
});

app.listen(config.server.swaggerPort);