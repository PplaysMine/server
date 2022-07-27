/**
 * @swagger
 *  components:
 *      schemas:
 *          ActivityData:
 *              type: object
 *              required:
 *                  - name
 *                  - start
 *                  - end
 *              properties:
 *                  name:
 *                      type: string
 *                      description: Name of activity
 *                  start:
 *                      type: long
 *                      description: Timestamp of the start time
 *                  end:
 *                      type: long
 *                      description: Timestamp of the end time
 *              example:
 *                  name: ''
 *                  start: 0
 *                  end: 0
 *          Timestamps:
 *              type: object
 *              required:
 *                  - startTimestamp
 *                  - endTimestamp
 *              example:
 *                  startTimestamp: 0
 *                  endTimestamp: 0
 *          SensorData:
 *              type: object
 *              required:
 *                  - timestamp
 *                  - data
 *              properties:
 *                  timestamp:
 *                      type: long
 *                      description: Timestamp of the start time
 *                  data:
 *                      type: object
 *                      description: A single data object
 *              example:
 *                  [{timestamp: 0, values: []}]
 *          AllSensorData:
 *              type: object
 *              example:
 *                  [{timestamp: 0, data: []}]
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
 *          AllActivityData:
 *              type: object
 *              example:
 *                  [{start: 0, end: 0, name: ""}]
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
 *                  "403":
 *                      description: Token could not be verified
 *                  "500":
 *                      description: Internal server error
 */
router.get('/getQuestionnaireData', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(403);
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
                                res.sendStatus(403);
                                con.destroy();
                            }
                        }
                    });
                }
            });
        }
    });
});


/**
 * @swagger
 *  paths:
 *      /data/getActivityData:
 *          get:
 *              summary: Returns all activity data associated with the user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User exists, send all activity data associated with the user
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/AllActivityData'
 *                  "403":
 *                      description: Token could not be verified
 *                  "500":
 *                      description: Internal server error
 */
router.get('/getActivityData', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(403);
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
                                con.query("SELECT start, end, name FROM activityData WHERE userId=?", [userId], (e, r, f) => {
                                    if(e) destroySQLConnectionOnError(con, res);
                                    else {
                                        res.status(200).send(r);
                                        con.destroy();
                                    }
                                });
                            } else {
                                res.sendStatus(403);
                                con.destroy();
                            }
                        }
                    });
                }
            });
        }
    });
});


/**
 * @swagger
 *  paths:
 *      /data/getSensorData/:
 *          get:
 *              summary: Returns all sensor data associated with the user (requires bearer token)
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/Timestamps'
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User exists, send all accelerometer data associated with the user in the specified timeframe (requires bearer token)
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/AllSensorData'
 *                  "403":
 *                      description: Token could not be verified
 *                  "500":
 *                      description: Internal server error
 */
router.get('/getSensorData', verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            if(b.startTimestamp && b.endTimestamp) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError(con, res);
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    con.query("SELECT timestamp, data FROM accelerometerData WHERE userId=? AND timestamp>=? AND timestamp<?", [userId, b.startTimestamp, b.endTimestamp], (e, r, f) => {
                                        if(e) destroySQLConnectionOnError(con, res);
                                        else {
                                            res.status(200).send(r);
                                            con.destroy();
                                        }
                                    });
                                } else {
                                    res.sendStatus(403);
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
                    if(err) destroySQLConnectionOnError(con, res);
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
            if(Array.isArray(b)) {
                let done = 0;
                if(b.length == 0) { res.sendStatus(200); return; }
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError(con, res);
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    for(let obj of b) {
                                        if(obj.timestamp && obj.values) {
                                            con.query("INSERT INTO accelerometerData (userId, timestamp, data) VALUES (?, ?, ?)", [userId, obj.timestamp, JSON.stringify(obj.values)], (e, r, f) => {
                                                if(e) destroySQLConnectionOnError(con, res);
                                                else {
                                                    done++;
                                                    if(done == b.length) {
                                                        res.sendStatus(200);
                                                        con.destroy();
                                                    }
                                                }
                                            });
                                        } else {
                                            res.sendStatus(401);
                                            con.destroy();
                                            return;
                                        }
                                    }
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
 *      /data/setActivityData/:
 *          put:
 *              summary: Add activity data for user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/ActivityData'
 *              responses:
 *                  "200":
 *                      description: User exists, data is added to user
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Token could not be verified
 */
router.put('/setActivityData', verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            if(b.start && b.end && b.name) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError(con, res);
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    con.query("INSERT INTO activityData (userId, start, end, name) VALUES (?, ?, ?, ?)", [userId, b.start, b.end, b.name], (e, r, f) => {
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

/**
 * @swagger
 *  paths:
 *      /data/deleteActivity:
 *          post:
 *              summary: Delete specified activity of user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User exists, activity has been deleted
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Token could not be verified
 *                  "500":
 *                      description: Internal server error
 */
router.post("/deleteActivity", verifyToken, (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            if(b.start && b.end) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) destroySQLConnectionOnError(con, res);
                    else {
                        con.query("SELECT userId FROM user WHERE username=? AND password=?", [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            else {
                                if(result.length > 0) {
                                    userId = result[0].userId;
                                    con.query("DELETE FROM activityData WHERE userId=? AND start=? AND end=?", [userId, b.start, b.end], (e, r, f) => {
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


/**
 * @swagger
 *  paths:
 *      /data/deleteData:
 *          post:
 *              summary: Delete all data associated with the user (requires bearer token)
 *              tags: [Data]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User exists, all data associated with the user was successfully deleted
 *                  "401":
 *                      description: Token could not be verified
 *                  "500":
 *                      description: Internal server error
 */
router.post('/deleteData', verifyToken, (req, res) => {
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
                                con.query("DELETE FROM accelerometerData WHERE userId=?", [userId], (e, r, f) => {
                                    if(e) destroySQLConnectionOnError(con, res);
                                    else {
                                        con.query("DELETE FROM questionnaireData WHERE userId=?", [userId], (e, r, f) => {
                                            if(e) destroySQLConnectionOnError(con, res);
                                            else {
                                                con.query("DELETE FROM activityData WHERE userId=?", [userId], (e, r, f) => {
                                                    if(e) destroySQLConnectionOnError(con, res);
                                                    else {
                                                        res.sendStatus(200);
                                                        con.destroy();
                                                    }
                                                });
                                            }
                                        });
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