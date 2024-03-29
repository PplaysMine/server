const config = require('./config');
const express = require('express');
const https = require('https');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const basicAuth = require('express-basic-auth');
const sql = require('mysql');
const schedule = require('node-schedule');

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
    apis: ["./routes/user.js", "./routes/data.js", "./routes/researcher.js"],
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
app.use('/researcher', require('./routes/researcher'));
app.use("/api-docs", basicAuth({
    authorizer: basicAuthAuthorizer,
    challenge: true
}), swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

var httpsServer = https.createServer(options, app);
httpsServer.listen(config.server.port, () => {
    console.log(`Listening on port ${config.server.port}`);
});

app.listen(config.server.swaggerPort);

const job = schedule.scheduleJob('0 10 1 * *', () => {
    var con = sql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.pass,
        database: config.db.dbName,
    });
    con.connect((err) => {
        if(err) con.destroy();
        else {
            let minTimestamp = Date.now();
            minTimestamp -= 1000 * 60 * 60 * 24 * 30;
            con.query("DELETE FROM accelerometerData WHERE timestamp<?", [minTimestamp], (e, r, f) => {
                con.destroy();
            });
        }
    });
});