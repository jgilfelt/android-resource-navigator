function ext_resolve(s) {
  console.log(s);
  var url = window.location.href;
  var resource = s.replace('android:', '') + '.xml';
  var urlBase = url.slice(0, url.lastIndexOf('/res')+5);
  
  $.ajax({
    url: urlBase + resource,
    statusCode: {
      404: function() {
        alert("page not found");
      },
      200: function() {
        window.location.href = urlBase + resource;
      }
    }
//  }).done(function() {
//    alert("done");
  });

}
