/**
 * @swagger
 *  components:
 *      schemas:
 *          Data:
 *              type: object
 *              required:
 *                  - data
 *              properties:
 *                  timestamp:
 *                      type: long
 *                      dexcription: timestamp of the data
 *                  data:
 *                      type: object
 *                      description: A single data object
 *              example:
 *                  timestamp: 0
 *                  data: {}
 *          AllData:
 *              type: object
 *              required:
 *                  - dataArray
 *              properties:
 *                  dataArray:
 *                      type: array
 *                      description: All data associated with the user
 *              example:
 *                  dataArray: [{}]
 *      securitySchemes:
 *          bearerAuth:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

 /**
 * @swagger
 *  tags:
 *      name: Data
 *      description: API for data related operations
 */
const config = require('../config');
const express = require('express');
const router = express.Router();
const sql = require('mysql');
const jwt = require('jsonwebtoken');

function createSQLConnection() {
    return sql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.pass,
        database: config.db.dbName,
    });
}

const tokenSecret = config.server.tokenSecret

function destroySQLConnectionOnError(con, res) {
    res.sendStatus(500);
    con.destroy();
}

function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

/**
 * @swagger
 *  paths:
 *      /data/all/:
 *          get:
 *              summary: Returns all data associated with the user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              requestBody:
 *                  required: false
 *              responses:
 *                  "200":
 *                      description: User exists, send all data associated with user
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/AllData'
 *                  "403":
 *                      description: Token could not be verified
 */
router.get('/all', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(403);
        else {
            var con = createSQLConnection();
            con.connect((err) => {
                if(err) destroySQLConnectionOnError();
                else {
                    // con.query('SELECT * FROM data', (error, result, fields) => {
                        res.sendStatus(200);
                        con.destroy();
                    // });
                }
            });
        }
    });
});

/**
 * @swagger
 *  paths:
 *      /data/setQuestionnaireData/:
 *          put:
 *              summary: Add questionnaire data for user (requires bearer token) 
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/Data'
 *              responses:
 *                  "200":
 *                      description: User exists, data is added to user
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Token could not be verified
 */
router.put('/setQuestionnaireData', verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            if(b.timestamp && b.data) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError();
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    con.query("INSERT INTO questionnaireData (userId, timestamp, data) VALUES (?, ?, ?)", [userId, b.timestamp, JSON.stringify(b.data)], (e, r, f) => {
                                        if(e) {console.log(e); destroySQLConnectionOnError(con, res);}
                                        else {
                                            res.sendStatus(200);
                                            con.destroy();
                                        }
                                    });
                                } else {
                                    res.sendStatus(401);
                                    con.destroy();
                                }
                            }
                        });
                    }
                });
            } else {
                res.sendStatus(400);
            }
        }
    });
});

/**
 * @swagger
 *  paths:
 *      /data/*:
 *          post:
 *              summary: All other routes return 418
 *              tags: [Data]
 *              responses:
 *                  "418":
 *                      description: 
 */
 router.post('*', (req, res) => {
    res.sendStatus(418);
});

module.exports = router;