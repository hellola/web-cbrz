/**
 * Module dependencies.
 */
var express = require("express"), 
    webcbr = require("./webcbr"), 
    config = require("./config"), 
    path = require("path"), 
    nowjs = require("now"), 
    adminManager = require("./admin"), 
    rimraf = require("rimraf"), 
    fs = require("fs"), 
    app = module.exports = express.createServer();

app.configure(function() {
    app.set("views", __dirname + "/views"), app.set("view engine", "jade"), app.use(express.bodyParser()), app.use(express.methodOverride()), app.use(app.router), app.use(express.static(__dirname + "/public"));
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
app.get("/login", function(a, b) {
    b.render("login", {
        title: "Please login below"
    });
}); 
app.post("/login", function(a, b) {
    a.body.username ? dbMan.webUsersModel.findOne({
        username: a.body.username
    }, function(c, d) {
        if (c) console.log(c); else {
            a.session.authed = bcrypt.compare_sync(a.body.password, d.password), a.session.username = a.body.username, b.redirect("/");
            return;
        }
    }) : b.render("login", {
        title: "Please login below"
    });
}); 
app.get("/", function(a, b) {
    b.redirect("/list/");
}); 
app.get("/openfile/:path", function(a, b) {
    if (a.session.authed) {
        var c = webcbr.openfile(a.params.path, b, app), d = a.params.path.split("_"), e = d[d.length - 1];
        b.render("fileList", {
            title: "web cbr and cbz reader",
            locals: {
                list: c,
                firstFile: "/read/" + e
            }
        });
    } else b.redirect("/login");
}); 
app.get("/getFiles/:comicBookName", function(a, b) {
    a.session.authed ? (console.log("getcomicbookfiles: " + a.params.comicBookName), webcbr.getComicBookFiles(a.params.comicBookName, app, function(a) {
        console.log("reading files list: " + a.length + " files: " + a), b.contentType("application/json"), b.send(JSON.stringify(a));
    })) : b.redirect("/login");
}); 
app.get("/viewImage/:comicBookHash/:index", function(a, b) {
    a.session.authed ? webcbr.getComicBookFilePath(app, a.params.comicBookHash, a.params.index, function(a) {
        b.sendfile(a);
    }) : b.redirect("/login");
}); 
app.get(/\/list\/(.*$)/, function(a, b) {
    b.render("list", {
        title: "web cbr and cbz reader",
        locals: {
            list: webcbr.list(a.params[0], app),
            webserverURL: app.settings.webserverURL
        }
    });
}); 
app.get(/\/read\/(.*$)/, function(a, b) {
    a.session.authed ? webcbr.readFirstFileName(a.params[0], app, function(a, c, d) {
        console.log("reading first returned filename: " + a + " hash: " + d + ", Name:" + c), b.render("read", {
            title: "Reading: " + c,
            locals: {
                firstFile: a,
                currentBook: encodeURIComponent(d),
                webserverURL: app.settings.webserverURL
            }
        });
    }) : b.redirect("/login");
}); 
app.get(/\/getNextFile\/([^\/]*)\/([^\/]*$)/, function(a, b) {
    a.session.authed ? webcbr.navigateTo(a.params[0], a.params[1].replace("\n", ""), 1, app, function(a) {
        b.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : b.redirect("/login");
}); 
app.get(/\/getPrevFile\/([^\/]*)\/([^\/]*)/, function(a, b) {
    a.session.authed ? webcbr.navigateTo(a.params[0], a.params[1].replace("\n", ""), -1, app, function(a) {
        b.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : b.redirect("/login");
}); 
app.get("/navigateTo/:comicBookName/:currentFile/:direction", function(a, b) {
    a.session.authed ? webcbr.navigateTo(a.params.comicBookName, a.params.currentFile.replace("\n", ""), a.params.direction, app, function(a) {
        b.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : b.redirect("/login");
}); 
app.get("/navigateToFile/:comicBookName/:currentFile", function(a, b) {
    a.session.authed ? webcbr.navigateTo(a.params.comicBookName, a.params.currentFile.replace("\n", ""), 0, app, function(a) {
        b.partial("ajaxResponse", {
            locals: {
                fileName: a
            }
        });
    }) : b.redirect("/login");
});
app.get("/admin/", function(a, b) {
    a.session.authed ? b.render("admin", {
        title: "Admin"
    }) : b.redirect("/login");
}); 
app.get("/clearDbStore/", function(a, b) {
    a.session.authed ? (adminManager.clearDB(), rimraf.sync(app.settings.tempdir), fs.mkdir(app.settings.tempdir, 448, function() {
        b.render("admin", {
            title: "Admin"
        });
    })) : b.redirect("/login");
});

var everyone = nowjs.initialize(app);

app.listen(3000, "0.0.0.0"); 
webcbr.everyone = everyone; 
webcbr.everyone.now.distribute = function(a) {
    everyone.now.receive("backend", a);
};
