/**
 * Module dependencies.
 */
var express = require("express"), 
    webcbr = require("./webcbr"), 
    dbMan = require("./webcbr_models"), 
    config = require("./config"), 
    path = require("path"), 
    nowjs = require("now"), 
    adminManager = require("./admin"), 
    rimraf = require("rimraf"), 
    fs = require("fs"), 
    bcrypt = require('bcrypt'),  
    salt = bcrypt.gen_salt_sync(10),
    MongoStore = require('connect-mongo'),
    app = module.exports = express.createServer();

app.configure(function() {
    app.set("views", __dirname + "/views"); 
    app.set("view engine", "jade"); 
    app.use(express.bodyParser()); 
    app.use(express.cookieParser());
    app.use(express.session({ store: MongoStore({url:config.mongoserver}), secret: config.mongosecret }));
    app.use(express.methodOverride()); 
    app.use(app.router); 
    app.use(express.static(__dirname + "/public"));
    app.dynamicHelpers({
        session: function (req, res) {
            return req.session;
        }
    });
}); 
app.configure("development", function() {
    app.use(express.errorHandler({
        dumpExceptions: !0,
        showStack: !0
    }));
}); 
app.configure("production", function() {
    app.use(express.errorHandler());
}); 
config.init(app);

app.get("/login", function(req, res) {
    res.render("login", {
        title: "Please login below"
    });
}); 

app.post("/login", function(req, res) {
    req.body.username ? dbMan.webUsersModel.findOne({
        username: req.body.username
    }, function(c, d) {
        if (c) console.log(c); else {
            req.session.authed = bcrypt.compare_sync(req.body.password, d.password), req.session.username = req.body.username, res.redirect("/");
            return;
        }
    }) : res.render("login", {
        title: "Please login below"
    });
}); 

app.get("/", function(req, res) {
    res.redirect("/list/");
}); 

app.get("/openfile/:path", function(req, res) {
    if (req.session.authed) {
        var c = webcbr.openfile(req.params.path, b, app), d = req.params.path.split("_"), e = d[d.length - 1];
        res.render("fileList", {
            title: "web cbr and cbz reader",
            locals: {
                list: c,
                firstFile: "/read/" + e
            }
        });
    } else res.redirect("/login");
}); 

app.get("/getFiles/:comicBookName", function(req, res) {
    req.session.authed ? (
        console.log("getcomicbookfiles: " + req.params.comicBookName), 
        webcbr.getComicBookFiles(req.params.comicBookName, app, function(a) {
            console.log("reading files list: " + req.length + " files: " + a), 
            res.contentType("application/json"), 
            res.send(JSON.stringify(a));
    })) : res.redirect("/login");
}); 

app.get("/viewImage/:comicBookHash/:index", function(req, res) {
    req.session.authed ? webcbr.getComicBookFilePath(app, req.params.comicBookHash, req.params.index, function(a) {
        res.sendfile(a);
    }) : res.redirect("/login");
}); 

app.get(/\/list\/(.*$)/, function(req, res) {
       webcbr.listSimple(req.params[0], app,function(newfiles){
            res.render("list", {
                title: "web cbr and cbz reader",
                locals: {
                    list: [],
                    files:newfiles 
                }
            });
        });         
    
}); 

app.get(/\/read\/(.*$)/, function(req, res) {
    req.session.authed ? webcbr.readFirstFileName(req.params[0], app, function(a, c, d) {
        console.log("reading first returned filename: " + a + " hash: " + d + ", Name:" + c), res.render("read", {
            title: "Reading: " + c,
            locals: {
                firstFile: a,
                currentBook: encodeURIComponent(d)
            }
        });
    }) : res.redirect("/login");
}); 

app.get(/\/getNextFile\/([^\/]*)\/([^\/]*$)/, function(req, res) {
    req.session.authed ? webcbr.navigateTo(req.params[0], req.params[1].replace("\n", ""), 1, app, function(a) {
        res.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : res.redirect("/login");
}); 

app.get(/\/getPrevFile\/([^\/]*)\/([^\/]*)/, function(req, res) {
    req.session.authed ? webcbr.navigateTo(req.params[0], req.params[1].replace("\n", ""), -1, app, function(a) {
        res.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : res.redirect("/login");
}); 

app.get("/navigateTo/:comicBookName/:currentFile/:direction", function(req, res) {
    req.session.authed ? webcbr.navigateTo(req.params.comicBookName, req.params.currentFile.replace("\n", ""), req.params.direction, app, function(a) {
        res.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : res.redirect("/login");
}); 

app.get("/navigateToFile/:comicBookName/:currentFile", function(req, res) {
    req.session.authed ? webcbr.navigateTo(req.params.comicBookName, req.params.currentFile.replace("\n", ""), 0, app, function(a) {
        res.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : res.redirect("/login");
});

app.get("/admin/", function(req, res) {
    req.session.authed ? res.render("admin", {
        title: "Admin"
    }) : res.redirect("/login");
}); 

app.get("/clearDbStore/", function(req, res) {
    req.session.authed ? (adminManager.clearDB(), rimraf.sync(app.settings.tempdir), fs.mkdir(app.settings.tempdir, 448, function() {
        res.render("admin", {
            title: "Admin"
        });
    })) : res.redirect("/login");
});

var everyone = nowjs.initialize(app);

app.listen(3000, "0.0.0.0"); 
webcbr.everyone = everyone; 
webcbr.everyone.now.distribute = function(a) {
    everyone.now.receive("backend", a);
};
