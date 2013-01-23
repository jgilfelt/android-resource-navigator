var _VALUES_MAP = {
  'string'     : { bucket:'values',             file:'strings.xml' },
  'color'      : { bucket:'values',             file:'colors.xml' },
  'style'      : { bucket:'values',             file:'styles.xml' },
  'dimen'      : { bucket:'values',             file:'dimens.xml' }
};

function ext_resolve(s) {
  var url = window.location.href;
  var resPath = s.replace('android:', '');
  var resType = resPath.slice(0, resPath.indexOf('/'));
  var urlBase = url.slice(0, url.lastIndexOf('/res')+5);
  var xmlUrl = urlBase + resPath + ".xml";
  console.log(resType);

  if (resType in _VALUES_MAP) {
    // in values bucket
    window.location.href = urlBase + _VALUES_MAP[resType].bucket + '/' + _VALUES_MAP[resType].file; // TODO resolve line + "&ext_target=" + resPath;
  } else if (resType === 'drawable') {
    // drawable
	// try xml
    ext_checkTarget(xmlUrl,
      function() {
        window.location.href = xmlUrl;
      },
      function() {
		// try 9 patch
        var pathHdpi = resPath.replace('drawable', 'drawable-hdpi');
        var nineUrl = urlBase + pathHdpi + ".9.png";
        var pngUrl = urlBase + pathHdpi + ".png";
        ext_checkTarget(nineUrl,
          function() {
            window.location.href = nineUrl;
          },
          function() {
            // regular png
	        window.location.href = pngUrl;
          }
        );
      }
    );
  } else {
    // other
    window.location.href = xmlUrl;
  }

}

function ext_checkTarget(targetUrl, functionOk, functionFail) {
  $.ajax({
    url: targetUrl,
    statusCode: {
      404: functionFail,
      200: functionOk
    }
//  }).done(function() {
//    alert("done");
  });
}
