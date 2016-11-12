var express = require('express');
var router = express.Router();
var query = require('../pgSetup');


/* GET home page. */
router.get('/', function(req, res, next) {
    query('SELECT * FROM public."Hotel"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Hotel management', data: rows, column_names: result.fields });
    });
});

router.get('/hotels', function(req, res, next) {
    query('SELECT * FROM public."Hotel"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Hotel management', data: rows, column_names: result.fields });
    });
});

router.get('/rooms', function(req, res, next) {
    query('SELECT * FROM public."Room"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Room management', data: rows, column_names: result.fields });
    });
});

router.get('/staff', function(req, res, next) {
    query('SELECT * FROM public."Staff"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Staff management', data: rows, column_names: result.fields });
    });
});
router.get('/shifts', function(req, res, next) {
    query('SELECT * FROM public."Shift"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Shift management', data: rows, column_names: result.fields });
    });
});
router.get('/discounts', function(req, res, next) {
    query('SELECT * FROM public."Discount"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Discount management', data: rows, column_names: result.fields });
    });
});
router.get('/Reservations', function(req, res, next) {
    query('SELECT * FROM public."Reservation"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Reservation management', data: rows, column_names: result.fields });
    });
});
router.get('/Clients', function(req, res, next) {
    query('SELECT * FROM public."Client"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Client management', data: rows, column_names: result.fields });
    });
});
router.get('/Users', function(req, res, next) {
    query('SELECT * FROM public."User"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'User management', data: rows, column_names: result.fields });
    });
});
module.exports = router;
