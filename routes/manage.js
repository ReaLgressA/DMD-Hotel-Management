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
router.post('/pageRowsUpdate', function (req, res, next) {
    req.app.locals.rowsPerPage = req.body['rowsPerPage'];
    res.redirect('/manage/hotels/1');
});
router.get('/hotels/create', function(req, res) {
    res.render('manage/hotels_create', { error: undefined });
});
router.post('/hotels/create', function (req, res) {
    var postArray = [req.body['name'], req.body['desc'], req.body['rating'], req.body['country']];
    query('INSERT INTO public."Hotel" (name, description, stars, country_code) VALUES($1, $2, $3, $4)', postArray, function(err, rows, result) {
        if(err) {
            console.error(err);
            res.render('manage/hotels_create', { error : err });
        } else {
            res.redirect('/manage/hotels/1');
        }
    });
});
router.get('/hotels/:page', function(req, res, next) {
    console.log("rows: " + req.app.locals.rowsPerPage);
    console.log("req.params.page: " + req.params.page);
    var pagination = [req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage];
    query('SELECT *, count(*) OVER() AS full_count FROM public."Hotel" LIMIT $1 OFFSET $2', pagination, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/hotels', { title: 'Hotel management', data: rows, column_names: ['Id', 'Name', 'Description', '     Stars', 'Country'], pageId: req.params.page, rowsTotal: rows[0]['full_count'] });
    });
});
router.get('/hotels', function(req, res, next) {
    query('SELECT * FROM public."Hotel"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        // console.log(rows);
        res.render('manage/hotels', { title: 'Hotel management', data: rows, column_names: ['Id', 'Name', 'Description', '     Stars', 'Country']});
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
router.get('/reservations', function(req, res, next) {
    query('SELECT * FROM public."Reservation"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Reservation management', data: rows, column_names: result.fields });
    });
});
router.get('/clients', function(req, res, next) {
    query('SELECT * FROM public."Client"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Client management', data: rows, column_names: result.fields });
    });
});
router.get('/users', function(req, res, next) {
    query('SELECT * FROM public."User"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'User management', data: rows, column_names: result.fields });
    });
});
router.get('/countries', function(req, res, next) {
    query('SELECT * FROM public."Country"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage', { title: 'Country management', data: rows, column_names: result.fields });
    });
});
module.exports = router;
