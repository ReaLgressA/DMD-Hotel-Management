var express = require('express');
var router = express.Router();
var query = require('../pgSetup');

var hotel_col_names = ['Id', 'Name', 'Description', '     Stars', 'Country', 'City'];

router.post('/pageRowsUpdate', function (req, res, next) {
    req.app.locals.rowsPerPage = req.body['rowsPerPage'];
    res.redirect(req.get('referer').substr(0, req.get('referer').lastIndexOf("/")));
});
router.get('/hotels/create', function(req, res) {
    res.render('manage/hotels_create', { error: undefined });
});
router.post('/hotels/create', function (req, res) {
    var postArray = [req.body['name'], req.body['desc'], req.body['rating'], req.body['country'], req.body['city']];
    query('INSERT INTO "Hotel" (name, description, stars, country_code, city) VALUES($1, $2, $3, $4, $5)', postArray, function(err, rows, result) {
        if(err) {
            console.error(err);
            res.render('manage/hotels_create', { error : err });
        } else {
            res.redirect('/manage/hotels/1');
        }
    });
});
router.get('/hotels/:page', function(req, res, next) {
    var pagination = [req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage];
    query('SELECT *, count(*) OVER() AS full_count FROM "Hotel" ORDER BY hotel_id ASC LIMIT $1 OFFSET $2', pagination, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/hotels', { title: 'Hotel management', data: rows, column_names: hotel_col_names, pageName: 'hotels', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0 });
    });
});
router.get('/hotels', function(req, res, next) {
    res.redirect('/manage/hotels/1');
});
router.get('/hotels/remove/:id', function(req, res) {
    query('DELETE FROM "Hotel" WHERE hotel_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/hotels/1');
    });
});
router.get('/hotels/edit/:id', function(req, res) {
    query('SELECT * FROM "Hotel" WHERE hotel_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/hotels_edit', {error: err, data: rows[0]});
    });
});
router.post('/hotels/edit', function (req, res) {
    var post = [req.body['name'], req.body['desc'], req.body['rating'], req.body['country'], req.body['city'], req.body['hotel_id']];
    query('UPDATE "Hotel" SET name=$1, description=$2, stars=$3, country_code=$4, city=$5 WHERE hotel_id=$6', post, function (err, results, fields) {
        if(err) {
            console.error(err);
            res.render('manage/hotels_edit', { error : err, data: {hotel_id: post[5], name: post[0], description: post[1], stars: post[2], country_code: post[3], city: post[4]} });
        } else {
            res.redirect('/manage/hotels/1');
        }
    });
});
router.get('/hotels/select/:id', function(req, res) {
    query('SELECT * FROM "Hotel" WHERE hotel_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        req.app.locals.curHotel = rows[0];
        res.redirect('/manage/hotels/1');
    });
});



//ROOMS
var room_col_names = ['Number', 'Type', 'Capacity', 'Price', 'Extras'];

var getRoomTypes = function (callback) {
    query('SELECT * FROM "Room_type"', function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};
router.get('/rooms/create', function(req, res) {
    getRoomTypes(function (room_types) {
        res.render('manage/rooms_create', { error: undefined,  room_types: room_types });
    });
});
router.post('/rooms/create', function (req, res) {
    var post = [req.body['hotel_id'], req.body['number'], req.body['room_type_id'], req.body['price'], req.body['smoke'] == undefined ? 0 : 1,
        req.body['wifi'] == undefined ? 0 : 1, req.body['tv'] == undefined ? 0 : 1, req.body['conditioner'] == undefined ? 0 : 1];
    query('INSERT INTO "Room" (hotel_id, number, room_type_id, price, smoke, wifi, tv, conditioner) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getRoomTypes(function (room_types) {
                res.render('manage/rooms_create', { error : err,  room_types: room_types });
            });
        } else {
            res.redirect('/manage/rooms/1');
        }
    });
});
router.get('/rooms/:page', function(req, res, next) {
    var args = [req.app.locals.curHotel['hotel_id'], req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage];
    query('SELECT *, count(*) OVER() AS full_count FROM "Room" WHERE hotel_id=$1 ORDER BY number ASC LIMIT $2 OFFSET $3', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getRoomTypes( function (room_types) {
            res.render('manage/rooms', { title: 'Room management: ' + req.app.locals.curHotel['name'], room_types: room_types, data: rows, column_names: room_col_names, pageName: 'rooms', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
        } );
    });
});
router.get('/rooms', function(req, res, next) {
    res.redirect('/manage/rooms/1');
});
router.get('/rooms/remove/:id', function(req, res) {
    query('DELETE FROM "Room" WHERE room_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/rooms/1');
    });
});
router.get('/rooms/edit/:id', function(req, res) {
    query('SELECT * FROM "Room" WHERE room_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getRoomTypes( function (room_types) {
            console.log(rows[0]);
            res.render('manage/rooms_edit', {error: err, data: rows[0], room_types: room_types});
        } );
    });
});
router.post('/rooms/edit', function (req, res) {
    var post = [req.body['number'], req.body['room_type_id'], req.body['price'], req.body['smoke'] == undefined ? 0 : 1,
        req.body['wifi'] == undefined ? 0 : 1, req.body['tv'] == undefined ? 0 : 1, req.body['conditioner'] == undefined ? 0 : 1, req.body['room_id']];
    query('UPDATE "Room" SET number=$1, room_type_id=$2, price=$3, smoke=$4, wifi=$5, tv=$6, conditioner=$7 WHERE room_id=$8', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getRoomTypes( function (room_types) {
                res.render('manage/rooms_edit', { error : err, room_types: room_types, data: {room_id: post[7], number: post[0], room_type_id: post[1], price: post[2], smoke: post[3], wifi: post[4], tv: post[5], conditioner: post[6]} });
            } );
        } else {
            res.redirect('/manage/rooms/1');
        }
    });
});


//STAFF
var staff_col_names = ['Position', 'Name', 'Surname', 'Gender', 'SSN code', 'Salary'];

var getStaffRoles = function (callback) {
    query('SELECT * FROM "Staff_role"', function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};

router.get('/staff/create', function(req, res) {
    getStaffRoles(function (staff_roles) {
        res.render('manage/staff_create', { error: undefined,  staff_roles: staff_roles });
    });
});
router.post('/staff/create', function (req, res) {
    var post = [req.body['hotel_id'], req.body['role_id'], req.body['first_name'], req.body['last_name'], req.body['gender'], req.body['ssn_code'], req.body['salary']];
    query('INSERT INTO "Staff" (hotel_id, role_id, first_name, last_name, gender, ssn_code, salary) VALUES($1, $2, $3, $4, $5, $6, $7)', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffRoles(function (staff_roles) {
                res.render('manage/staff_create', { error : err,  staff_roles: staff_roles });
            });
        } else {
            res.redirect('/manage/staff/1');
        }
    });
});
router.get('/staff/:page', function(req, res, next) {
    var args = [req.app.locals.curHotel['hotel_id'], req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage];
    query('SELECT *, count(*) OVER() AS full_count FROM "Staff" WHERE hotel_id=$1 ORDER BY last_name, first_name ASC LIMIT $2 OFFSET $3', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getStaffRoles( function (staff_roles) {
            res.render('manage/staff', { title: 'Staff  management: ' + req.app.locals.curHotel['name'], staff_roles: staff_roles, data: rows, column_names: staff_col_names, pageName: 'staff', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
        } );
    });
});
router.get('/staff', function(req, res, next) {
    res.redirect('/manage/staff/1');
});
router.get('/staff/remove/:id', function(req, res) {
    query('DELETE FROM "Staff" WHERE staff_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/staff/1');
    });
});
router.get('/staff/edit/:id', function(req, res) {
    query('SELECT * FROM "Staff" WHERE staff_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getStaffRoles( function (staff_roles) {
            console.log(rows[0]);
            res.render('manage/staff_edit', {error: err, data: rows[0], staff_roles: staff_roles});
        } );
    });
});
router.post('/staff/edit', function (req, res) {
    var post = [req.body['role_id'], req.body['first_name'], req.body['last_name'], req.body['gender'], req.body['ssn_code'], req.body['salary'], req.body['staff_id']];
    query('UPDATE "Staff" SET role_id=$1, first_name=$2, last_name=$3, gender=$4, ssn_code=$5, salary=$6 WHERE staff_id=$7', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffRoles( function (staff_roles) {
                res.render('manage/staff_edit', { error : err, staff_roles: staff_roles, data: {staff_id: post[6], role_id: post[0],
                    first_name: post[1], last_name: post[2], gender: post[3], ssn_code: post[4], salary: post[5]} });
            } );
        } else {
            res.redirect('/manage/staff/1');
        }
    });
});



//SHIFTS
var shifts_col_names = ['Date', 'Staff member'];

var getStaffMembers = function (req, callback) {
    query('SELECT * FROM "Staff" WHERE hotel_id=$1', [req.app.locals.curHotel['hotel_id']], function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};

router.get('/shifts/create', function(req, res) {
    getStaffMembers(req, function (staff_members) {
        res.render('manage/shifts_create', { error: undefined,  staff_members: staff_members });
    });
});
router.post('/shifts/create', function (req, res) {
    var post = [req.body['date'], req.body['staff_id']];
    query('INSERT INTO "Shift" (date, staff_id) VALUES($1, $2)', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffMembers(req, function (staff_members) {
                res.render('manage/shifts_create', { error : err,  staff_members: staff_members });
            });
        } else {
            console.log("OK");
            res.redirect('/manage/shifts/1');
        }
    });
});
router.get('/shifts/:page', function(req, res, next) {
    var args = [req.app.locals.curHotel['hotel_id'], req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage, "YYYY-MM-DD"];
    query('SELECT "Shift".staff_id, TO_CHAR(date, $4) AS date, count(*) OVER() AS full_count FROM "Shift",' +
        ' "Staff" WHERE "Staff".staff_id = "Shift".staff_id AND "Staff".hotel_id=$1 ORDER BY date DESC,' +
        ' first_name ASC LIMIT $2 OFFSET $3', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getStaffMembers(req, function (staff_members) {
            console.log(rows);
            res.render('manage/shifts', { title: 'Shift management: ' + req.app.locals.curHotel['name'], staff_members: staff_members, data: rows, column_names: shifts_col_names, pageName: 'shifts', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
        } );
    });
});
router.get('/shifts', function(req, res, next) {
    res.redirect('/manage/shifts/1');
});
router.get('/shifts/remove/:id', function(req, res) {
    query('DELETE FROM "Shift" WHERE staff_id=$1 AND date=$2', [req.params.id, req.query.date],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/shifts/1');
    });
});
router.get('/shifts/edit/:id', function(req, res) {
    query('SELECT * FROM "Shift" WHERE staff_id=$1 AND date=$2', [req.params.id, req.query.date],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getStaffMembers(req, function (staff_members) {
            console.log(rows[0]);
            res.render('manage/shifts_edit', {error: err, data: rows[0], staff_members: staff_members});
        } );
    });
});
router.post('/shifts/edit', function (req, res) {
    var post = [req.body['date'], req.body['staff_id'], req.body['old_date'], req.body['old_staff_id'] ];
    query('UPDATE "Staff" SET date=$1, staff_id=$2 WHERE date=$3 AND staff_id=$4', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffMembers(req, function (staff_members) {
                res.render('manage/shifts_edit', { error : err, staff_members: staff_members, data: {staff_id: post[0], date: post[1]}});
            } );
        } else {
            res.redirect('/manage/shifts/1');
        }
    });
});






//DISCOUNTS


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
module.exports = router;