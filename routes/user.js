/**
 * @swagger
 *  components:
 *      schemas:
 *          User:
 *              type: object
 *              required:
 *                  - user
 *                  - pass
 *              properties:
 *                  user:
 *                      type: string
 *                      description: Name of the user
 *                  pass:
 *                      type: string
 *                      description: Password of the user
 *              example:
 *                  user: TestUser
 *                  pass: TestPass
 *          Token:
 *              type: object
 *              required:
 *                  - token
 *              properties:
 *                  token: 
 *                      type: string
 *                      description: Bearer token
 *          NewPass:
 *              type: object
 *              required:
 *                  - newPass
 *              properties:
 *                  newPass:
 *                      type: string
 *                      description: Password that should replace the old one
 *      securitySchemes:
 *          bearerAuth:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

 /**
 * @swagger
 *  tags:
 *      name: User
 *      description: API for user related operations.
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
 *      /user/:
 *          post:
 *              summary: Test connection
 *              tags: [User]
 *              responses:
 *                  "403":
 *                      description: Only for testing purposes, returns 403
 */
router.post('/', (req, res) => {
    res.sendStatus(403);
});

/**
 * @swagger
 *  paths:
 *      /user/login/:
 *          post:
 *              summary: Logs in a registered user & returns bearer token
 *              tags: [User]
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/User'
 *              responses:
 *                  "200":
 *                      description: User exists & is logged in
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/Token'
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: No user exists with this username
 *                  "500":
 *                      description: Internal server error
 */
router.post('/login', (req, res) => {
    var b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    const user = {
        userName: b.user,
        userPass: b.pass
    }

    jwt.sign({user}, tokenSecret, { expiresIn: "24h" }, (err, token) => {
        if(err) throw err;
        if(b.user && b.pass) {
            var con = createSQLConnection();
            con.connect((err) => {
                if(err) { res.sendStatus(500); throw err; }
                else {
                    con.query('SELECT * FROM user WHERE username=? AND password=?', [req.body.user, req.body.pass], (error, result, fields) => {
                        if(error) destroySQLConnectionOnError(con, res);
                        else {
                            if(result.length === 0) res.sendStatus(401);
                            else res.status(200).json({"token": token});
                        }
                        con.destroy();
                    });
                }
            });
        } else {
            res.sendStatus(400);
        }
    });

});

/**
 * @swagger
 *  paths:
 *      /user/register/:
 *          post:
 *              summary: Registers a user with given username & password
 *              tags: [User]
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/User'
 *              responses:
 *                  "201":
 *                      description: User is successfully created
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "403":
 *                      description: This username already exists
 *                  "500":
 *                      description: Internal server error
 */
router.post('/register', (req, res) => {
    var b = req.body;

    if(b.user && b.pass) {
        var con = createSQLConnection();
        con.connect((err) => {
            if(err) { res.sendStatus(500); throw err; }
            else {
                con.query('SELECT * FROM user WHERE username=?', [b.user, b.pass], (error, result, fields) => {
                    if(error) destroySQLConnectionOnError(con, res);
                    else {
                        if(result.length === 0) {
                            if(b.user == 'test' && b.pass == 'test') {
                                res.sendStatus(201);
                                con.destroy();
                            } else {
                                con.query('INSERT INTO user (username, password) VALUES (?, ?)', [b.user, b.pass], (e, r, f) => {
                                    if(e) destroySQLConnectionOnError(con, res);
                                    else {
                                        res.sendStatus(201);
                                        con.destroy();
                                    }
                                });
                            }
                        } else {
                            res.status(403).send("Username taken.");
                            con.destroy();
                        }
                    }
                });
            }
        });
    } else {
        res.sendStatus(400);
    }
});

/**
 * @swagger
 *  paths:
 *      /user/deleteAccount/:
 *          post:
 *              summary: Deletes user with given username (requires bearer token)
 *              tags: [User]
 *              security:
 *                  - bearerAuth: []
 *              responses:
 *                  "200":
 *                      description: User is successfully deleted
 *                  "401":
 *                      description: Token could not be verified
 *                  "404":
 *                      description: User with given username does not exist
 *                  "500":
 *                      description: Internal server error
 */
router.post('/deleteAccount', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            var con = createSQLConnection();
            con.connect((err) => {
                if(err) { res.sendStatus(500); throw err; }
                else {
                    con.query('SELECT * FROM user WHERE username=? AND password=?', [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                        if(error) destroySQLConnectionOnError(con, res);
                        if(result.length > 0) {
                            con.query('DELETE FROM user WHERE username=?', [authData.user.userName], (e, r, f) => {
                                if(e) destroySQLConnectionOnError(con, res);
                                else res.sendStatus(200);
                                con.destroy();
                            });
                        } else {
                            res.status(404).send("User does not exist.");
                            con.destroy();
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
 *      /user/changePassword/:
 *          put:
 *              summary: Changes password of given user to new given password (requires bearer token)
 *              tags: [User]
 *              security:
 *                  - bearerAuth: []
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/NewPass'
 *              responses:
 *                  "200":
 *                      description: Password successfully changed, returns new token with updated password
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/Token'
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Token could not be verified
 *                  "404":
 *                      description: User with given username does not exist
 *                  "500":
 *                      description: Internal server error
 */
router.put('/changePassword', verifyToken, (req, res) => {
    jwt.verify(req.token, tokenSecret, (err, authData) => {
        if(err) res.sendStatus(401);
        else {
            var b = req.body;
            if(b.newPass) {
                var con = createSQLConnection();
                con.connect((err) => {
                    if(err) { res.sendStatus(500); throw err; }
                    else {
                        con.query('SELECT * FROM user WHERE username=? AND password=?', [authData.user.userName, authData.user.userPass], (error, result, fields) => {
                            if(error) destroySQLConnectionOnError(con, res);
                            if(result.length > 0) {
                                con.query('UPDATE user SET password=? WHERE username=?', [b.newPass, authData.user.userName], (e, r, f) => {
                                    if(e) destroySQLConnectionOnError(con, res);
                                    else {
                                        jwt.sign({username: authData.user.username, userPass: b.newPass}, tokenSecret, { expiresIn: "1hr" }, (err, token) => {
                                            if(err) throw err;
                                            res.status(200).json({"token": token});
                                        });
                                        con.destroy();
                                    }
                                });
                            } else {
                                res.sendStatus(404);
                                con.destroy();
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
 *      /user/*:
 *          post:
 *              summary: All other routes return 418
 *              tags: [User]
 *              responses:
 *                  "418":
 *                      description: 
 */
router.post('*', (req, res) => {
    res.sendStatus(418);
});

module.exports = router;