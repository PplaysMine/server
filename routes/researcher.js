/**
 * @swagger
 *  components:
 *      schemas:
 *          Body:
 *              type: object
 *              required:
 *                  - user
 *                  - pass
 *                  - userId
 *                  - start
 *                  - end
 *              properties:
 *                  user:
 *                      type: string
 *                      description: Valid researcher username
 *                  pass:
 *                      type: string
 *                      description: Valid researcher password
 *                  userId:
 *                      type: int
 *                      description: UserId of the user we want the data from
 *                  start:
 *                      type: long
 *                      description: Send data after this timestamp
 *                  end:
 *                      type: long
 *                      description: Send data before this timestamp
 *              example:
 *                  user: ''
 *                  pass: ''
 *                  userId: 0
 *                  start: 0
 *                  end: 0
 *          Response:
 *              type: object
 *              properties:
 *                  questionnaireData:
 *                      type: array
 *                      description: Questionnaire data that fits the query
 *                  accelerometerData:
 *                      type: array
 *                      description: Accelerometer data that fits the query
 *              example:
 *                  questionnaireData: []
 *                  accelerometerData: []
 */

/**
 * @swagger
 *  tags:
 *      name: Researcher
 *      description: Researcher access endpoint
 */
const config = require('../config');
const express = require('express');
const router = express.Router();
const sql = require('mysql');

function createSQLConnection() {
    return sql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.pass,
        database: config.db.dbName,
    });
}

function destroySQLConnectionOnError(con, res, err) {
    console.log(err);
    res.sendStatus(500);
    con.destroy();
}

/**
 * @swagger
 *  paths:
 *      /researcher/getData/:
 *          get:
 *              summary: Returns data for researchers
 *              tags: [Researcher]
 *              requestBody:
 *                  required: true
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/components/schemas/Body'
 *              responses:
 *                  "200":
 *                      description: Sending all data in the specified timeframe
 *                      content:
 *                          application/json:
 *                              schema:
 *                                  $ref: '#/components/schemas/Response'
 *                  "400":
 *                      description: Missing / malformed request body
 *                  "401":
 *                      description: Wrong researcher credentials
 *                  "500":
 *                      description: Internal server error
 */
router.get('/getData', (req, res) => {
    let b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    if(b.user && b.pass && b.userId && b.start && b.end) {
        var con = createSQLConnection();
        con.connect((err) => {
            if(err) destroySQLConnectionOnError(con, res, err);
            else {
                con.query('SELECT * FROM researcher WHERE username=? AND password=?', [b.user, b.pass], (e, r, f) => {
                    if(e) destroySQLConnectionOnError(con, res, e);
                    else {
                        if(r.length > 0) {
                            con.query('SELECT userId, timestamp, data FROM questionnaireData WHERE userId=? AND timestamp>? AND timestamp<?', [b.userId, b.start, b.end], (e, r, f) => {
                                if(e) destroySQLConnectionOnError(con, res, e);
                                else {
                                    let obj = {
                                        questionnaireData: r,
                                        accelerometerData: null,
                                    };
                                    con.query('SELECT userId, timestamp, value FROM accelerometerData WHERE userId=? AND timestamp>? AND timestamp<?', [b.userId, b.start, b.end], (e, r, f) => {
                                        if(e) destroySQLConnectionOnError(con, res, e);
                                        else {
                                            obj.accelerometerData = r;
                                            res.status(200).send(obj);
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
    } else {
        res.sendStatus(400);
    }
});

module.exports = router;