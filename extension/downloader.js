/*
 * Copyright 2013 readyState Software Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var BITMAP_DRAWABLE_BUCKETS = [ 'drawable-ldpi', 'drawable-mdpi', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi' ];
var XML_DRAWABLE_BUCKETS = [ 'drawable' ];
var NOTIFICATION_ID = "THX1138";
var notification;
var notificationId;

var downloadHandler = function(info, tab) {

  try {

    var opt = {
      type: "basic",
      title: "Downloading Drawable",
      message: "This might take a few seconds...",
      iconUrl: "images/logo-38.png"
    }

    chrome.notifications.create(NOTIFICATION_ID, opt, function(id) {});

  } catch (err) {}

  window.URL = window.URL || window.webkitURL || window.mozURL;
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                       window.MozBlobBuilder;

  var urls = [];
  var files = [];

  var isBinary = (info.pageUrl.indexOf('.png') > 0);

  if (isBinary) {
    getDrawableFileData(info.pageUrl, files, BITMAP_DRAWABLE_BUCKETS, 0, doZip);
  } else {
    urls.push(info.pageUrl);
    getAllDrawableFileData(urls, files, 0, doZip);
  }

  // trying to set a filename with HTML5 a.download but don't like side effects

  //navigateToUrl("data:application/zip;base64,"+content);

  //var a = document.createElement('a');
  //a.href = zipUrl;
  //a.download = filename + '.zip'; // set the file name
  //a.style.display = 'none';
  //document.body.appendChild(a);
  //a.click();
  //delete a;// we don't need this anymore

}

function doZip(files) {
  if (files.length > 0) {
    var zip = new JSZip();
    var res = zip.folder('res');
    for (var i=0; i < files.length; i++) {
      var folder = res.folder(files[i].folder);
      var fileData;
	  if (!files[i].isBinary) {
        fileData = removePlatformResourcePrefix(files[i].data);
      } else {
        fileData = files[i].data;
      }
      folder.file(files[i].filename, fileData, {base64: files[i].isBinary});
    }
    var content = zip.generate();
    var zipUrl = window.URL.createObjectURL(base64ToBlob_(content,'application/zip'));
    navigateToUrl(zipUrl);
    try {
      chrome.notifications.clear(NOTIFICATION_ID, function(wasCleared) {});
    } catch (err) {}
  }
}

function getAllDrawableFileData(urls, files, index, callback) {

  if (urls.length == 0) {
    callback;
    return;
  }

  var isBinary = (urls[index].indexOf('.png') > 0);
  var buckets = (isBinary) ? BITMAP_DRAWABLE_BUCKETS : XML_DRAWABLE_BUCKETS;
  getDrawableFileData(urls[index], files, buckets, 0, function(files) {
    if (index < urls.length-1) {
      getAllDrawableFileData(urls, files, index+1, callback);
    } else {
      callback(files);
    }
  });
}

// TODO fix horrible recursive callbacks

function getDrawableFileData(url, files, buckets, index, callback) {
    var a = url.split('/');
    var densityUrl = url.replace(a[a.length-2], buckets[index]);
    console.log(densityUrl);
    getRawGitHubData(densityUrl, function(folder, filename, data, isBinary) {
      if (data) {
         var file = {};
         file.folder = folder;
         file.filename = filename;
         file.data = data;
         file.isBinary = isBinary;
         files.push(file);

         if (!isBinary) {
            // get xml references
            var urls = [];
      		var ids = findDrawableRefs(file.data);

              resolve(url, ids, urls, 0, function(urls) {
                getAllDrawableFileData(urls, files, 0, function(refedFiles) {
                  files = files.concat(refedFiles);
                  if (index < buckets.length-1) { getDrawableFileData(url, files, buckets, index+1, callback); } else { callback(files); }
                });
              });

         } else {
           if (index < buckets.length-1) { getDrawableFileData(url, files, buckets, index+1, callback); } else { callback(files); }
         }
      } else {
        if (index < buckets.length-1) { getDrawableFileData(url, files, buckets, index+1, callback); } else { callback(files); }
      }
    });
}

function getRawGitHubData(url, callback) {
  var rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('blob/', '');
  var a = rawUrl.split('/');
  var folder = a[a.length-2];
  var filename = a[a.length-1];
  var isBinary = (rawUrl.indexOf('.png') > 0);
  var xhr = new XMLHttpRequest();
  console.log(rawUrl);
  console.log(isBinary);
  xhr.open("GET", rawUrl, true);
  if (isBinary) {
    xhr.responseType = 'arraybuffer';
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      console.log(xhr.status);
      if (xhr.status==200) {
        if (isBinary) {
          callback(folder, filename, this.response, isBinary);
        } else {
          callback(folder, filename, this.responseText, isBinary);
        }
      } else {
         callback(folder, filename, null, isBinary);
      }
    }
  }
  xhr.send();
}

// TODO fix horrible recursive callbacks

function resolve(url, ids, results, index, callback) {

  if (ids.length == 0) {
    callback(results);
    return;
  }

  var resPath = 'drawable/' + ids[index].split('/')[1];
  var urlBase = url.slice(0, url.lastIndexOf('/res')+5);
  var xmlUrl = urlBase + resPath + ".xml";

  var pathHdpi = resPath.replace('drawable', 'drawable-hdpi');
  var nineUrl = urlBase + pathHdpi + ".9.png";
  var pngUrl = urlBase + pathHdpi + ".png";

  // try 9 patch
  checkTarget(nineUrl,
    function() {
      results.push(nineUrl);
      if (index < ids.length-1) { resolve(url, ids, results, index+1, callback); } else { callback(results); }
    },
    function() {
      // regular png
      checkTarget(pngUrl,
        function() {
          results.push(pngUrl);
          if (index < ids.length-1) { resolve(url, ids, results, index+1, callback); } else { callback(results); }
        },
        function() {
          // xml
	      results.push(xmlUrl);
          if (index < ids.length-1) { resolve(url, ids, results, index+1, callback); } else { callback(results); }
        }
      );
    }
  );

}

var _DRAWABLE_ID_REGEX = "@((android:)?(drawable)/([A-Za-z0-9_:\.\/])*)";

function findDrawableRefs(body) {
  var patt=new RegExp(_DRAWABLE_ID_REGEX,'g');
  var results = body.match(patt);
  if (results) {
  	var uniqueArray = results.filter(function(elem, pos) {
      return results.indexOf(elem) == pos;
  	});
    return uniqueArray;
  } else {
    return [];
  }
}

function removePlatformResourcePrefix(text) {
  return text.replace(/@android:/g, '@').replace(/@\+android:/g, '@+');
}

function checkTarget(targetUrl, functionOk, functionFail) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", targetUrl, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status==200) {
        functionOk();
      } else {
        functionFail();
      }
    }
  }
  xhr.send();
}

/**
 * Converts a base64 string to a Blob
 */
function base64ToBlob_(base64, mimetype) {
  var BASE64_MARKER = ';base64,';
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var uInt8Array = new Uint8Array(rawLength);
  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  if (hasBlobConstructor()) {
    return new Blob([uInt8Array], {type: mimetype})
  }

  var bb = new BlobBuilder();
  bb.append(uInt8Array.buffer);
  return bb.getBlob(mimetype);
}

hasBlobConstructor = function() {
  try {
    return !!new Blob();
  } catch(e) {
    return false;
  }
};


//var drawableRefs = [];

//chrome.extension.onMessage.addListener(
//  function(request, sender, sendResponse) {
//    console.log(sender.tab ?
//                "from a content script:" + sender.tab.url :
//                "from the extension");
//    drawableRefs = request.refs;
//    console.log(drawableRefs);
//});

chrome.contextMenus.create({
  "title": "Download Drawable",
  "contexts": ["page"],
  "documentUrlPatterns": [ "*://github.com/*res/drawable*/*" ],
  "onclick" : downloadHandler
});
