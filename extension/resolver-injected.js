var _ARN_VALUES_MAP = {
  'string'     : { bucket:'values',             file:'strings.xml' },
  'color'      : { bucket:'values',             file:'colors.xml' },
  'style'      : { bucket:'values',             file:'styles.xml' },
  'dimen'      : { bucket:'values',             file:'dimens.xml' }
};

function arn_resolve(s) {
  var url = window.location.href;
  var resPath = s.replace('android:', '');
  var resName = resPath.slice(resPath.lastIndexOf('/')+1, resPath.length);
  var resType = resPath.slice(0, resPath.indexOf('/'));
  var urlBase = url.slice(0, url.lastIndexOf('/res')+5);
  var xmlUrl = urlBase + resPath + ".xml";
  console.log(resType);

  if (resType in _ARN_VALUES_MAP) {
    // in values bucket
    var loc = urlBase + _ARN_VALUES_MAP[resType].bucket + '/' + _ARN_VALUES_MAP[resType].file;
    var inPage = (loc === window.location.href.split('#')[0]); // target is current page
    
    if (inPage) {
	  arn_findResourceInPage(resName); // page-find-injected.js
    } else {
      window.location.href = loc + '##' + resName;
    }

  } else if (resType === 'drawable') {
    // drawable
	// try xml
    arn_checkTarget(xmlUrl,
      function() {
        window.location.href = xmlUrl;
      },
      function() {
		// try 9 patch
        var pathHdpi = resPath.replace('drawable', 'drawable-hdpi');
        var nineUrl = urlBase + pathHdpi + ".9.png";
        var pngUrl = urlBase + pathHdpi + ".png";
        arn_checkTarget(nineUrl,
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

function arn_checkTarget(targetUrl, functionOk, functionFail) {
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
