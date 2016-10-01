"use strict";

$(function() {
  
    $('#toggle-3d input').click(function(e) {
      document.body.classList.toggle('debug-on', this.checked);
      
      var from = this.checked ? 0 : 1;
      var to = this.checked ? 1 : 0;

      // transform: translate3d(100px, 0, -800px) rotateY(30deg);
      $({foo: from}).animate({foo: to}, {
        duration: 3000,
        step: function(now, fx) {
          $('.parallax__group').css('transform', 'translate3d(' + (100 * now) + 'px, 0, -' + (800 * now) + 'px) rotateY(' + (30 * now) +'deg)');
          //$('.parallax__layer').css('box-shadow', '0 0 0 ' + (2 * now) + 'px #000');
          console && console.log(now, fx);
        }
      }, "linear");
    });


  $.get('/projects/pun/').success(function(content) {
    var html = $.parseHTML(content);
    $.each(html, function(i, element) {
      if (element.nodeName == 'H1') {
        $('#hi').text(element.childNodes[0].textContent);
      }
    });
  });


  $('#inspiration .line').each(function(i, e) {
    var text = $(e).text();
    if (text.length == 0) return;

    var finalText = text.charAt(text.length - 1);
    for (var j=text.length - 2; j >= 0; j--) {
      finalText = text.charAt(j) + '<sub>' + finalText + '</sub>';
    }
    $(e).html(finalText);
  });
});
