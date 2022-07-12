/**
 * @swagger
 *  components:
 *      schemas:
 *          SensorData:
 *              type: object
 *              required:
 *                  - start
 *                  - end
 *                  - data
 *              properties:
 *                  start:
 *                      type: long
 *                      description: Timestamp of the start time
 *                  end:
 *                      type: long
 *                      description: Timestamp of the end time
 *                  data:
 *                      type: array
 *                      description: array of sensor data
 *              example:
 *                  start: 0
 *                  end: 0
 *                  data: [{}]
 *          Data:
 *              type: object
 *              required:
 *                  - data
 *                  - timestamp
 *              properties:
 *                  timestamp:
 *                      type: long
 *                      description: timestamp of the data
 *                  data:
 *                      type: object
 *                      description: A single data object
 *              example:
 *                  timestamp: 0
 *                  data: {}
 *          AllData:
 *              type: object
 *              required:
 *                  - data
 *              properties:
 *                  data:
 *                      type: array
 *                      description: All data associated with the user
 *              example:
 *                  data: [{}]
 *          AllQuestionnaireData:
 *              type: object
 *              example:
 *                  [{timestamp: 0, data: {}}]
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
 *      /data/getQuestionnaireData/:
 *          get:
 *              summary: Returns all questionnaire data associated with the user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User exists, send all questionnaire data associated with user
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/AllQuestionnaireData'
 *                  "401":
 *                      description: Token could not be verified
 */
router.get('/getQuestionnaireData', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            var con = createSQLConnection();
            con.connect((err) => {
                if(err) destroySQLConnectionOnError(con, res);
                else {
                    con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                        if(error) destroySQLConnectionOnError(con, res);
                        else {
                            if(result.length > 0) {
                                userId = result[0].userId;
                                con.query("SELECT timestamp, data FROM questionnaireData WHERE userId=?", [userId], (e, r, f) => {
                                    if(e) destroySQLConnectionOnError(con, res);
                                    else {
                                        res.status(200).json(r);
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
        }
    });
});


router.get('/getActivityData')


/**
 * @swagger
 *  paths:
 *      /data/getSensorData/:
 *          get:
 *              summary: Returns all sensor data associated with the user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "403":
 *                      description: Token could not be verified
 */
router.get('/getSensorData', verifyToken, (req, res) => {
    
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
 *      /data/setSensorData/:
 *          put:
 *              summary: Add sensor data for user (requires bearer token) 
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/SensorData'
 *              responses:
 *                  "200":
 *                      description: User exists, data is added to user
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Token could not be verified
 */
router.put('/setSensorData', verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            if(b.startTimestamp && b.endTimestamp && b.data) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError(con, res);
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    con.query("INSERT INTO userData (userId, start, end, data) VALUES (?, ?, ?, ?)", [userId, b.start, b.end, JSON.stringify(b.data)], (e, r, f) => {
                                        if(e) destroySQLConnectionOnError(con, res);
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

router.put('setActivityData', verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                if(error) destroySQLConnectionOnError(con, res);
                else {
                    if(result.length > 0) {
                        userId = result[0].userId;
                        con.query("INSERT INTO activityData (userId, start, end, data) VALUES (?, ?, ?, ?)", [userId, b.start, b.end, b.data]);
                    }
                }
            });
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