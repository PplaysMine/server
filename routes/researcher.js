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

function destroySQLConnectionOnError(con, res) {
    res.sendStatus(500);
    con.destroy();
}

router.get('/getData', (req, res) => {
    let b = req.body;

    if(!b) {
        res.sendStatus(400);
        return;
    }

    if(b.user && b.pass && b.userId && b.start && b.end) {
        var con = createSQLConnection();
        con.connect((err) => {
            if(err) destroySQLConnectionOnError(con, res);
            else {
                con.query('SELECT * FROM researchers WHERE username=? AND password=?', [b.user, b.pass], (e, r, f) => {
                    if(e) destroySQLConnectionOnError(con, res);
                    else {
                        if(r.length > 0) {
                            con.query('SELECT userId, timestamp, data FROM questionnaireData WHERE userId=? AND timestamp>? AND timestamp<?', [b.userId, b.start, b.end], (e, r, f) => {
                                if(e) destroySQLConnectionOnError(con, res);
                                else {
                                    console.log(r);
                                    con.query('SELECT userId, timestamp, value FROM questionnaireData WHERE userId=? AND timestamp>? AND timestamp<?', [b.userId, b.start, b.end], (e, r, f) => {
                                        if(e) destroySQLConnectionOnError(con, res);
                                        else {
                                            console.log(r);
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