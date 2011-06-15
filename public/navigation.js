function pad(number, length) {
       
        var str = '' + number;
            while (str.length < length) {
                        str = '0' + str;
                            }
               
                return str;

}
$(document).ready(function(){
    var nextImage = function(){
        var bookName = $('a.next').attr('bookName');
        var fileName = $('a.next').attr('filename');
        var url = '/getNextFile/'+encodeURI(bookName)+'/'+encodeURI(fileName);
        $.ajax({
            url: url,
            success: function(data){
               console.log(data);            
               if(data[data.length - 1] == 'g'){
                   $('a.next').attr('filename',data.substring(0,data.length-3));
               }else{
                   $('a.next').attr('filename',data);
               }
               var temp = '/viewImage/'+encodeURI(bookName)+'/'+encodeURI(data);
               temp = temp.substring(0,temp.length-3);
               $(".placeholder").html('<img src=' + temp  +'>'); 
            }
        });

    };
    var prevImage = function(){
        var currentIndex = parseInt($('a.next').attr('imageIndex'));
        if(currentIndex == 0){
            return;
        };
        var temp = $('a.next')[0].href.replace('.jpg','');
        currentIndex -= 1;
        temp += pad(currentIndex.toString(),3) + '.jpg';// This whole remove replace can be changed with a marker like {x} where x is replaced
        $('a.next').attr('imageIndex',currentIndex);
        $(".placeholder").html('<img src=' + temp  +'>'); 
    };

    $('a.next').click(function(){
        event.preventDefault(); 
        var bookName = $(this).attr('bookName');
        var fileName = $(this).attr('filename');
        var url = '/getNextFile/'+encodeURI(bookName)+'/'+encodeURI(fileName);
        $.ajax({
            url: url,
            success: function(data){
               console.log(data);            
               if(data[data.length - 1] == 'g'){
                   $('a.next').attr('filename',data.substring(0,data.length-3));
               }else{
                   $('a.next').attr('filename',data);
               }
               var temp = '/viewImage/'+encodeURI(bookName)+'/'+encodeURI(data);
               temp = temp.substring(0,temp.length-3);
               $(".placeholder").html('<img src=' + temp  +'>'); 
            }
        });
    });        
    $(document).keydown(function(e){
        if (e.keyCode == 37) { 
            prevImage();
            return false;
        }
        if (e.keyCode == 39) { 
            nextImage();
            return false;
        }

    });
});
