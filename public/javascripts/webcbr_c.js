webcbr = {
    init : function(webserverURL) {
        webcbr.initSockets();
        webcbr.getComicFiles();
        $('a.prev').click(function(){
            webcbr.nav.prev();
        });
        $('a.next').click(function(){
            webcbr.nav.next();
        });
        //left and right keys
        $(document).keydown(function(e){
            if (e.keyCode == 37) { 
                webcbr.nav.prev();
                return false;
            }
            if (e.keyCode == 39) { 
                webcbr.nav.next();
                return false;
            }
        });
    },
    getCurrentComicBook : function() {
        var loc = document.location.pathname;
        var locs = loc.split('/');
        if (locs[1] == 'read')
        {
            return decodeURI(locs[locs.length-1]);
        }
    },

    getComicFiles: function() {
        var url = encodeURI('http://'+document.location.host+'/getFiles/' + webcbr.getCurrentComicBook());
        console.log('getting url: ' +url); 
        $.getJSON(url,function(data) { webcbr.showComicBookFiles(data)});
    },
    CurrentFiles : [],
    moveUp: function(){
        //todo
        var k = document.location.pathname.split('/');
        if (k.length > 2) {
            delete(k[k.length -1]);
            document.location = k.join('/');
        }
    },
    showComicBookFiles: function(files) {
        webcbr.CurrentFiles = files;
        var html = '<ul id="nav">';
        for (var i=0;i<webcbr.CurrentFiles.length;i++)
        {
            var read = '';
            console.log('read: ' + webcbr.CurrentFiles[i].read);
            if (webcbr.CurrentFiles[i].read == 1) {
               read  = ' read'; 
            }
            var imgsrc = '';
            html += '<li><a class="comicnav'+ read + '" index="' +i + '" filename="' + webcbr.CurrentFiles[i].filename.replace(/\n/,'') + '" >'+(i+1)+'</a></li>';
        }
        $('div.fullnav').html(html + $('div.fullnav').html());
        webcbr.updateSelected();
        //set click for navigation
        $('a.comicnav').click(function(event){
           event.preventDefault(); 
           console.log('comicnav clicked');
           var bookName = $('a.next').attr('bookName');
           var fileName = $(this).attr('index');
           //var url = '/navigateToFile/'+encodeURI(bookName)+'/'+encodeURI(fileName);
           $('a.next,a.prev').attr('filename',fileName);
           var temp = '/viewImage/'+encodeURI(bookName)+'/'+encodeURI(fileName);
           console.log('newImage: ' + temp);
           $(".placeholder").html('<img onclick="webcbr.nav.next()" src=' + temp  +'>'); 
           webcbr.updateSelected();
        });
    },
    updateSelected: function() {
        console.log('webcbr.updateSelected');
        var current = decodeURI(webcbr.getCurrentIndex());
        console.log('current index: ' +current )
        $('ul#nav a[index='+current+']').addClass('read');
        //highlight current one based on previous next buttons
        $('ul#nav a').each(function() { 
            if ($(this).attr('index').trim() == current.trim())
            {
                $(this).css({'border-color':'#00B7FF','color':'#00B7FF'});
            }
            else
            {
                if ($(this).hasClass('read')) {
                    $(this).css({'border-color':'#B7FF00','color':'#B7FF00'});
                }
                else {
                    $(this).css({'border-color':'#CCC','color':'#CCC'});
                }
            }
        });
    },
    nav: {
next : function() {
            var bookName = $('a.next').attr('bookName');
            var fileName = $('a.next').attr('filename');
            var index = Number(fileName) + 1;
            $('a.prev,a.next').attr('filename',index);
               var temp = '/viewImage/'+bookName+'/'+index;
               console.log('newImage: ' + temp);
               $(".placeholder").html('<img onclick="webcbr.nav.next()" src=' + temp  +'>'); 
               webcbr.updateSelected();
            },
prev : function() {
            var bookName = $('a.next').attr('bookName');
            var fileName = $('a.next').attr('filename');
            var index = Number(fileName) - 1;
            $('a.prev,a.next').attr('filename',index);
               var temp = '/viewImage/'+bookName+'/'+index;
               console.log('newImage: ' + temp);
               $(".placeholder").html('<img onclick="webcbr.nav.next()" src=' + temp  +'>'); 
               webcbr.updateSelected();
            }
    },
    getCurrentIndex: function () {
        var src = $('div.placeholder img').attr('src');
        var srcs = src.split('/');
        if (srcs[srcs.length-1] != null) {
            return srcs[srcs.length-1];
        }
        return '';
    },
    initSockets: function(webserverURL) {
        var socket = io.connect(webserverURL);
        socket.on('message', function(json){ 
            console.log(json);
            if(json.extraction == 'complete'){
                console.log('extraction complete, showing images');
                var temp = 'http://'+document.location.host+'/viewImage/'+encodeURI(json.comicName)+'/'+encodeURI(json.firstFile);
                console.log(temp);
                $(".placeholder").html('<img onclick="webcbr.nav.next()" src=' + temp  +'>'); 
            };
        });

    }
};
