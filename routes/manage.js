var express = require('express');
var router = express.Router();
var query = require('../pgSetup');

var passwordHash = require('password-hash');

var hotel_col_names = ['Id', 'Name', 'Description', '     Stars', 'Country', 'City'];

router.get('/', function (req, res, next) {
    if(req.app.locals.user == undefined) {
        res.render('manage', {error: undefined});
    } else {
        res.redirect('/manage/hotels/1');
    }
});

function CheckLoggedIn(req, res) {
    if(req.app.locals.user == undefined || req.app.locals.user['role_name'] != 'Admin') {
        res.redirect('/manage');
        return false;
    }
    return true;
}

router.post('/login', function (req, res, next) {
    var pass = req.body['password'];
    var post = [req.body['email']];
    query('SELECT user_id, email, "User".role_id AS role_id, pass_hash, role_name FROM "User", "User_role" WHERE email=$1 AND "User".role_id="User_role".role_id', post, function (err, rows, result) {
        if(err) {
            console.error(err);
            res.render('manage', { error: err });
            return;
        }
        if(rows.length > 0 && passwordHash.verify(pass, rows[0]['pass_hash']) && rows[0]['role_name']=='Admin' ) {
            req.app.locals.user = rows[0];
            res.redirect('/manage/hotels/1');
        } else {
            res.render('manage', { error: "Authorization failed: wrong email or password" });
        }
    });
});
router.get('/logout', function (req, res, next) {
    req.app.locals.user = undefined;
    res.redirect('/manage');
});

router.post('/pageRowsUpdate', function (req, res, next) {
    req.app.locals.rowsPerPage = req.body['rowsPerPage'];
    res.redirect(req.get('referer').substr(0, req.get('referer').lastIndexOf("/")));
});
router.get('/hotels/create', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    res.render('manage/hotels_create', { error: undefined });
});
router.post('/hotels/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Hotel" WHERE hotel_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/hotels/1');
    });
});
router.get('/hotels/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('SELECT * FROM "Hotel" WHERE hotel_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/hotels_edit', {error: err, data: rows[0]});
    });
});
router.post('/hotels/edit', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    getRoomTypes(function (room_types) {
        res.render('manage/rooms_create', { error: undefined,  room_types: room_types });
    });
});
router.post('/rooms/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Room" WHERE room_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/rooms/1');
    });
});
router.get('/rooms/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    getStaffRoles(function (staff_roles) {
        res.render('manage/staff_create', { error: undefined,  staff_roles: staff_roles });
    });
});
router.post('/staff/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Staff" WHERE staff_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/staff/1');
    });
});
router.get('/staff/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    getStaffMembers(req, function (staff_members) {
        res.render('manage/shifts_create', { error: undefined,  staff_members: staff_members });
    });
});
router.post('/shifts/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var post = [req.body['date'], req.body['staff_id']];
    query('INSERT INTO "Shift" (date, staff_id) VALUES($1, $2)', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffMembers(req, function (staff_members) {
                res.render('manage/shifts_create', { error : err,  staff_members: staff_members });
            });
        } else {
            res.redirect('/manage/shifts/1');
        }
    });
});
router.get('/shifts/:page', function(req, res, next) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
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
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Shift" WHERE staff_id=$1 AND date=$2', [req.params.id, req.query.date],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/shifts/1');
    });
});
router.get('/shifts/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('SELECT staff_id, TO_CHAR(date, $3) AS "date" FROM "Shift" WHERE staff_id=$1 AND "date"=$2', [req.params.id, req.query.date, "YYYY-MM-DD"],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getStaffMembers(req, function (staff_members) {
            res.render('manage/shifts_edit', {error: err, data: rows[0], staff_members: staff_members});
        } );
    });
});
router.post('/shifts/edit', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var post = [req.body['date'], req.body['staff_id'], req.body['old_date'], req.body['old_staff_id'] ];
    query('UPDATE "Shift" SET "date"=$1, staff_id=$2 WHERE "date"=$3 AND staff_id=$4', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getStaffMembers(req, function (staff_members) {
                res.render('manage/shifts_edit', { error : err, staff_members: staff_members, data: {staff_id: post[1], date: post[0]}});
            } );
        } else {
            res.redirect('/manage/shifts/1');
        }
    });
});



//USERS
var users_col_names = ['Id', 'Role', 'E-mail', 'Password hash'];

var getUserRoles = function ( callback) {
    query('SELECT * FROM "User_role"', function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};
router.get('/users/create', function(req, res) {
    getUserRoles(function (user_roles) {
        res.render('manage/users_create', { error: undefined,  user_roles: user_roles });
    });
});
router.post('/users/create', function (req, res) {
    var pass = req.body['password'];
    pass = passwordHash.generate(pass);
    var post = [req.body['role_id'], req.body['email'], pass];
    query('INSERT INTO "User" (role_id, email, pass_hash) VALUES($1, $2, $3)', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getUserRoles(function (user_roles) {
                res.render('manage/users_create', { error : err,  user_roles: user_roles });
            });
        } else {
            res.redirect('/manage/users/1');
        }
    });
});
router.get('/users/:page', function(req, res, next) {
    var args = [req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage];
    query('SELECT *, count(*) OVER() AS full_count FROM "User" ORDER BY user_id ASC LIMIT $1 OFFSET $2', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getUserRoles(function (user_roles) {
            console.log(rows);
            res.render('manage/users', { title: 'User management: ', user_roles: user_roles, data: rows, column_names: users_col_names, pageName: 'users', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
        } );
    });
});
router.get('/users', function(req, res, next) {
    res.redirect('/manage/users/1');
});
router.get('/users/remove/:id', function(req, res) {
    query('DELETE FROM "User" WHERE user_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/users/1');
    });
});
router.get('/users/edit/:id', function(req, res) {
    query('SELECT * FROM "User" WHERE user_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getUserRoles( function (user_roles) {
            console.log("SHOW EDIT: " + rows[0]['email'] + "   " + rows[0]['role_id']);
            res.render('manage/users_edit', {error: err, data: rows[0], user_roles: user_roles, password: ''});
        } );
    });
});
router.post('/users/edit', function (req, res) {
    var pass = req.body['password'];
    var sql = 'UPDATE "User" SET role_id=$1, email=$2 WHERE user_id=$3';
    if(req.body['password'].length > 0 ) {
        sql = 'UPDATE "User" SET role_id=$1, email=$2, pass_hash=$4 WHERE user_id=$3';
    }
    var post = req.body['password'].length == 0 ? [req.body['role_id'], req.body['email'], req.body['user_id']] : [req.body['role_id'], req.body['email'], req.body['user_id'], passwordHash.generate(pass)];
    console.log("POST: " + post);
    query(sql, post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getUserRoles( function (user_roles) {
                res.render('manage/users_edit', { error : err, password: pass, user_roles: user_roles, data: {user_id: post[2], role_id: post[0],
                    email: post[1] } } );
            } );
        } else {
            res.redirect('/manage/users/1');
        }
    });
});



//Clients
var clients_col_names = ['Email', 'Name', 'Surname', 'Member since', 'Gender', 'SSN', 'Phone'];

router.get('/clients/create', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    res.render('manage/clients_create', { error: undefined });
});
router.post('/clients/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var pass = req.body['password'];
    pass = passwordHash.generate(pass);
    getUserRoles(function (roles) {
        var role_id = 1;
        for(var i = 0; i < roles.length; ++i) {
            if(roles[i]['role_name'] == 'Client') {
                role_id = roles[i]['role_id'];
                break;
            }
        }
        var post_user = [role_id, req.body['email'], pass];
        query('INSERT INTO "User" (role_id, email, pass_hash) VALUES($1, $2, $3) RETURNING user_id', post_user, function(err, user_rows, result) {
            if(err) {
                console.error(err);
                res.render('manage/clients_create', { error : err});
            } else {
                var post = [user_rows[0]['user_id'], req.body['first_name'], req.body['last_name'], req.body['gender'], req.body['ssn_code'], req.body['phone']];
                query('INSERT INTO "Client" (user_id, first_name, last_name, member_since, gender, ssn_code, phone_no) VALUES($1, $2, $3, NOW(), $4, $5, $6)', post, function(err, rows, result) {
                    if(err) {
                        console.error(err);
                        res.render('manage/clients_create', { error : err });
                    } else {
                        res.redirect('/manage/clients/1');
                    }
                });

            }
        });
    });
});
router.get('/clients/:page', function(req, res, next) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var args = [req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage, 'YYYY-MM-DD'];
    query('SELECT client_id, "Client".user_id, email, first_name, last_name, TO_CHAR(member_since, $3)' +
        ' AS member_since, gender, ssn_code, phone_no, count(*) OVER() AS full_count FROM "Client","User" ' +
        ' WHERE "Client".user_id="User".user_id ORDER BY last_name, first_name ASC LIMIT $1 OFFSET $2', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/clients', { title: 'Client management', data: rows, column_names: clients_col_names, pageName: 'clients', pageId: req.params.page, rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
    });
});
router.get('/clients', function(req, res, next) {
    res.redirect('/manage/clients/1');
});
router.get('/clients/remove/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Client" WHERE client_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/clients/1');
    });
});
router.get('/clients/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('SELECT client_id, "Client".user_id, email, first_name, last_name, TO_CHAR(member_since, $1)' +
            ' AS member_since, gender, ssn_code, phone_no FROM "Client","User" WHERE "Client".user_id="User".user_id ' +
            ' AND client_id=$2', ['YYYY-MM-DD', req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        console.log(rows[0]);
        res.render('manage/clients_edit', {error: err, data: rows[0], password: ''});
    });
});
router.post('/clients/edit', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var pass = req.body['password'];
    var sql = 'UPDATE "User" SET email=$1 WHERE user_id=$2';
    if(req.body['password'].length > 0 ) {
        sql = 'UPDATE "User" SET email=$1, pass_hash=$3 WHERE user_id=$2';
    }
    var post_user = req.body['password'].length == 0 ? [req.body['email'], req.body['user_id']] : [req.body['email'], req.body['user_id'], passwordHash.generate(pass)];
    var post = [req.body['first_name'], req.body['last_name'], req.body['gender'], req.body['ssn_code'], req.body['phone'], req.body['client_id']];

    query(sql, post_user, function(err, rows_user, result) {
        if(err) {
            console.error(err);
            res.render('manage/clients_edit', { error : err, password: pass, data: {user_id: post_user[1], email: post_user[0], first_name: post[0], last_name: post[1], gender:post[2],
                        ssn_code: post[3], phone_no: post[4], client_id: post[5]} } );
        } else {
            query('UPDATE "Client" SET first_name=$1, last_name=$2, gender=$3, ssn_code=$4, phone_no=$5 WHERE client_id=$6', post, function(err, rows, result) {
                if(err) {
                    console.error(err);
                    res.render('manage/clients_edit', { error : err, password: pass, data: {user_id: post_user[1], email: post_user[0], first_name: post[0], last_name: post[1], gender:post[2],
                        ssn_code: post[3], phone_no: post[4], client_id: post[5]} } );
                } else {
                    res.redirect('/manage/clients/1');
                }
            });
        }
    });
});

//RESERVATIONS
var reservations_col_names = ['Id', 'Client', 'Room number', 'Room type', 'Check-in', 'Check-out',
    'Status', 'Billing date', 'Total price'];

var getHotelRooms = function (hotel_id, callback) {
    query('SELECT room_id, type_name, capacity, number, price FROM "Room","Room_type" WHERE "Room".room_type_id="Room_type".room_type_id AND hotel_id=$1', [hotel_id], function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};

var getClients = function (callback) {
    query('SELECT * FROM "Client"', function(err, rows, result) {
        if(err) {
            console.log(err);
            callback([]);
        }
        callback(rows);
    });
};

router.get('/reservations/create', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    getHotelRooms(req.app.locals.curHotel['hotel_id'], function (rooms) {
        getClients(function (clients) {
            res.render('manage/reservations_create', { error: undefined, rooms: rooms, clients: clients });
        })
    });
});
router.post('/reservations/create', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var sql = 'INSERT INTO "Reservation" (client_id, room_id, status, date_in, date_out)' +
        ' VALUES($1, $2, $3, $4, $5)';
    var post = [req.body['client_id'], JSON.parse(req.body['room'])['room_id'], req.body['status'], req.body['date_in'], req.body['date_out']];
    if(req.body['date_bill'] != "" && req.body['total_price'] != "") {
        post.push(req.body['date_bill']);
        post.push(req.body['total_price']);
        sql = 'INSERT INTO "Reservation" (client_id, room_id, status, date_in, date_out, billing_date, total_price)' +
            ' VALUES($1, $2, $3, $4, $5, $6, $7)';
    } else if(req.body['date_bill'] != "") {
        post.push(req.body['date_bill']);
        sql = 'INSERT INTO "Reservation" (client_id, room_id, status, date_in, date_out, billing_date)' +
            ' VALUES($1, $2, $3, $4, $5, $6)';
    } else if(req.body['total_price'] != "") {
        post.push(req.body['total_price']);
        sql = 'INSERT INTO "Reservation" (client_id, room_id, status, date_in, date_out, total_price)' +
            ' VALUES($1, $2, $3, $4, $5, $6)';
    }
    query(sql, post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getHotelRooms(req.app.locals.curHotel['hotel_id'], function (rooms) {
                getClients(function (clients) {
                    res.render('manage/reservations_create', { error: undefined, rooms: rooms, clients: clients });
                })
            });
        } else {
            res.redirect('/manage/reservations/1');
        }
    });
});
router.get('/reservations/:page', function(req, res, next) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var args = [req.app.locals.curHotel['hotel_id'], req.app.locals.rowsPerPage, (req.params.page - 1) * req.app.locals.rowsPerPage, "YYYY-MM-DD"];
    query('SELECT reservation_id, "Client".client_id, first_name, last_name, "Room".room_id, number AS room_number, type_name AS room_type_name,' +
        'TO_CHAR(date_in, $4) AS date_in, TO_CHAR(date_out, $4) AS date_out, status, TO_CHAR(billing_date, $4) AS ' +
        'billing_date, total_price, count(*) OVER() AS full_count FROM "Reservation", "Client", "Room", "Room_type" ' +
        'WHERE hotel_id=$1 AND "Reservation".room_id="Room".room_id AND "Room".room_type_id="Room_type".room_type_id ' +
        'AND "Client".client_id="Reservation".client_id ORDER BY date_in DESC, date_out ASC LIMIT $2 OFFSET $3', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.render('manage/reservations', { title: 'Reservation management: ' + req.app.locals.curHotel['name'],
                data: rows, column_names: reservations_col_names, pageName: 'reservations', pageId: req.params.page,
                rowsTotal: (rows != undefined && rows.length > 0) ? rows[0]['full_count'] : 0});
    });
});
router.get('/reservations', function(req, res, next) {
    res.redirect('/manage/reservations/1');
});
router.get('/reservations/remove/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    query('DELETE FROM "Reservation" WHERE reservation_id=$1', [req.params.id],function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        res.redirect('/manage/reservations/1');
    });
});
router.get('/reservations/edit/:id', function(req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var args = ["YYYY-MM-DD", req.params.id];
    query('SELECT reservation_id, client_id, "Room".room_id, number AS room_number, type_name AS room_type_name,' +
        'TO_CHAR(date_in, $1) AS date_in, TO_CHAR(date_out, $1) AS date_out, status, TO_CHAR(billing_date, $1) AS ' +
        'billing_date, total_price FROM "Reservation", "Room", "Room_type" WHERE reservation_id=$2 AND ' +
        '"Reservation".room_id="Room".room_id AND "Room".room_type_id="Room_type".room_type_id', args, function(err, rows, result) {
        if(err) {
            console.error(err);
        }
        getHotelRooms(req.app.locals.curHotel['hotel_id'], function (rooms) {
            getClients(function (clients) {
                res.render('manage/reservations_edit', { error: undefined, data: rows[0], rooms: rooms, clients: clients });
            })
        });
    });
});
router.post('/reservations/edit', function (req, res) {
    if(!CheckLoggedIn(req, res)) {
        return;
    }
    var post = [req.body['client_id'], JSON.parse(req.body['room'])['room_id'], req.body['status'], req.body['date_in'],
        req.body['date_out'], req.body['date_bill'], req.body['total_price'], req.body['reservation_id']];
    query('UPDATE "Reservation" SET client_id = $1, room_id=$2, status=$3, date_in=$4, date_out=$5, billing_date=$6, total_price=$7 WHERE reservation_id=$8', post, function(err, rows, result) {
        if(err) {
            console.error(err);
            getHotelRooms(req.app.locals.curHotel['hotel_id'], function (rooms) {
                getClients(function (clients) {
                    res.render('manage/reservations_create', { error: undefined, rooms: rooms, clients: clients,
                        data: {reservation_id: post[7], client_id: post[0], room_id: post[1], status: post[2], date_id: post[3], date_out: post[4], billing_date: post[5], total_price: post[6]}});
                })
            });
        } else {
            res.redirect('/manage/reservations/1');
        }
    });
});

module.exports = router;