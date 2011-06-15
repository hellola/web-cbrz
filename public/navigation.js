function pad(number, length) {
       
        var str = '' + number;
            while (str.length < length) {
                        str = '0' + str;
                            }
               
                return str;

}
$(document).ready(function(){
    var nextImage = function(){
        var currentIndex = parseInt($('a.next').attr('imageIndex'));
        var temp = $('a.next')[0].href.replace('.jpg','');
        currentIndex += 1;
        temp += pad(currentIndex.toString(),3) + '.jpg';// This whole remove replace can be changed with a marker like {x} where x is replaced
        $('a.next').attr('imageIndex',currentIndex);
        $(".placeholder").html('<img src=' + temp  +'>'); 
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
        var currentIndex = parseInt($(this).attr('imageIndex'));
        var temp = this.href.replace('.jpg','');
        currentIndex += 1;
        temp += pad(currentIndex.toString(),3) + '.jpg';// This whole remove replace can be changed with a marker like {x} where x is replaced
        $(this).attr('imageIndex',currentIndex);
        $(".placeholder").html('<img src=' + temp  +'>'); 
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
