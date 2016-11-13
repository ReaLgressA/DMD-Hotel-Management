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
        res.render('manage/hotels', { title: 'Hotel management', data: rows, column_names: ['Id', 'Name', 'Description', '     Stars', 'Country']});
    });
});
router.get('/hotels/create', function(req, res) {
    query('SELECT * FROM public."Hotel"', function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/hotels_create', { column_names: result.fields });
    });
});
router.post('/hotels/create', function (req, res) {
    var post = {
        name: req.body['name'],
        description: req.body['desc'],
        stars: req.body['rating'],
        country_code: req.body['country']
    };
    var postArray = [req.body['name'], req.body['desc'], req.body['rating'], req.body['country']];
    console.log(post);
    query('INSERT INTO public."Hotel" (name, description, stars, country_code) VALUES($1, $2, $3, $4)', postArray, function(err, rows, result) {
        if(err) {
            console.error(err);
        } else {
            res.redirect('/manage/hotels');
        }
    });
    // sql.query('INSERT INTO GadgetType SET ?', post, function (err, results, fields) {
    //     if(err == null) {
    //         res.redirect('/gadgets/types');
    //     } else {
    //         res.render('status', { status: "Not created error: " + err });
    //     }
    // });
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
