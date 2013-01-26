/*
 * Copyright 2013 readyState Software Ltd, 2012 Google Inc.
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

var OMNIBOX_MAX_RESULTS = 20;

var REF_STYLES_XML_URL_RAW = 'https://raw.github.com/android/platform_frameworks_base/master/core/res/res/values/styles.xml';
var REF_THEMES_XML_URL_RAW = 'https://raw.github.com/android/platform_frameworks_base/master/core/res/res/values/themes.xml';

var REF_STYLES_XML_URL = 'https://github.com/android/platform_frameworks_base/blob/master/core/res/res/values/styles.xml';
var REF_THEMES_XML_URL = 'https://github.com/android/platform_frameworks_base/blob/master/core/res/res/values/themes.xml';

chrome.omnibox.setDefaultSuggestion({
  description: 'Loading AOSP reference data...'
});

var downloadHandler = function(info, tab) {
  alert('downloadHandler');
}

chrome.contextMenus.create({
  "title": "Download Drawable",
  "contexts": ["page"],
  "documentUrlPatterns": [ "*://github.com/*res/drawable*/*" ],
  "onclick" : downloadHandler
});

var DATA;

function get(url, callbackFn) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(xhr.responseText,"text/xml");
      callbackFn(xmlDoc);
    }
  }
  xhr.send();
}

function toJson(xml, targetUrl, subLabel, data, startIndex) {

  var x = startIndex;

  if (xml.hasChildNodes()) {
    for(var h = 0; h < xml.childNodes.length; h++) {
      var item1 = xml.childNodes.item(h);
      //console.log(item1.nodeName);
      if (item1.nodeName === 'resources') {
        if (item1.hasChildNodes()) {
          for(var i = 0; i < item1.childNodes.length; i++) {
            var item = item1.childNodes.item(i);
            //console.log(item.nodeName);
            if (item.nodeName == 'style') {
              if (item.attributes.length > 0) {
                for (var j = 0; j < item.attributes.length; j++) {
                  var attribute = item.attributes.item(j);
                  if (attribute.nodeName === 'name') {
                    var obj = {};
                    obj['id'] = i;
                    obj['label'] = attribute.nodeValue;
                    obj['link'] = targetUrl + '##' + attribute.nodeValue;
                    obj['type'] = 'class';
                    obj['subLabel'] = subLabel;
                    data.push(obj)
                    x++;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return data;

}


/**
 * Initialization function that tries to load the reference JS
 */
(function init() {

  console.log('loading AOSP reference data…');
  var data = [];
  var i = 0;

  get(REF_STYLES_XML_URL_RAW, function(xml) {
    var xmlStyles = xml;
    get(REF_THEMES_XML_URL_RAW, function(xml) {
      var xmlThemes = xml;
      data = toJson(xmlStyles, REF_STYLES_XML_URL, 'styles.xml', data, i);
      data = toJson(xmlThemes, REF_THEMES_XML_URL, 'themes.xml', data, i);
      DATA = data;
      onScriptsLoaded();
    });
  });

})();


/**
 * Second-stage initialization function. This contains all the Omnibox
 * setup features.
 */
function onScriptsLoaded() {
  chrome.omnibox.setDefaultSuggestion({
    description: 'Search AOSP framework for <match>%s</match>'
  });

  chrome.omnibox.onInputChanged.addListener(
    function(query, suggestFn) {
      if (!query)
        return;
  
      suggestFn = suggestFn || function(){};
      query = query.replace(/(^ +)|( +$)/g, '')
                   .replace(/\</g, '&lt;')
                   .replace(/\>/g, '&gt;');

      // Filter all classes/packages.
      var results = [];
      for (var i = 0; i < DATA.length; i++) {
        var s = DATA[i];
        if (query.length != 0 &&
            s.label.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push(s);
        }
      }

      // Rank them.
      rankResults(results, query);

      // Add them as omnibox results, with prettyish formatting
      // (highlighting, etc.).
      var queryLower = query.toLowerCase();
      var queryAlnumDot = (queryLower.match(/[\&\;\-\w\.]+/) || [''])[0];
      var queryRE = new RegExp(
          '(' + queryAlnumDot.replace(/\./g, '\\.') + ')', 'ig');
      var capitalLetterRE = new RegExp(/[A-Z]/);

      var omniboxResults = [];
      for (var i = 0; i < OMNIBOX_MAX_RESULTS && i < results.length; i++) {
        var result = results[i];

        // Remove HTML tags from description since omnibox cannot display them.
        var description = result.label;
        var firstCap = description.search(capitalLetterRE);
        if (firstCap >= 0 && result.type != 'xml') {
          var newDesc;
          newDesc = '<dim>' + description.substring(0, firstCap) + '</dim>';
          newDesc += description.substring(firstCap);
          description = newDesc;
        }

        description = description.replace(queryRE, '<match>$1</match>');

        var subDescription = result.subLabel || '';
        if (subDescription) {
          description += ' <dim>(' + subDescription + ')</dim>';
        }

        omniboxResults.push({
          content: result.link,
          description: description
        });
      }

      suggestFn(omniboxResults);
    }
  );

  chrome.omnibox.onInputEntered.addListener(function(text) {
    if (text.match(/^https?\:/)) {
      navigateToUrl(text);
    } else {
      navigateToUrl('https://github.com/search?q=' +
          encodeURIComponent(text + ' repo:android/platform_frameworks_base'));
    }
  });
}


function navigateToUrl(url) {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.update(tab.id, {url: url});
  });
}


/**
 * Helper function that gets the index of the last occurence of the given
 * regex in the given string, or -1 if not found.
 */
function regexFindLast(s, re) {
  if (s == '')
    return -1;
  var l = -1;
  var tmp;
  while ((tmp = s.search(re)) >= 0) {
    if (l < 0) l = 0;
    l += tmp;
    s = s.substr(tmp + 1);
  }
  return l;
}


/**
 * Helper function that counts the occurrences of a given character in
 * a given string.
 */
function countChars(s, c) {
  var n = 0;
  for (var i=0; i<s.length; i++)
    if (s.charAt(i) == c) ++n;
  return n;
}


/**
 * Ranking function, mostly copied from the Android SDK docs:
 * https://developer.android.com/assets/search_autocomplete.js
 */
function rankResults(matches, query) {
  query = query || '';
  matches = matches || [];

  // We replace dashes with underscores so dashes aren't treated
  // as word boundaries.
  var queryLower = query.toLowerCase().replace(/-/g, '_');
  var queryPart = (queryLower.match(/\w+/) || [''])[0];
  var partPrefixAlnumRE = new RegExp('\\b' + queryPart);
  var partExactAlnumRE = new RegExp('\\b' + queryPart + '\\b');

  var _resultScoreFn = function(result) {
    // scores are calculated based on exact and prefix matches,
    // and then number of path separators (dots) from the last
    // match (i.e. favoring classes and deep package names)
    var score = 1.0;
    var labelLower = result.label.toLowerCase().replace(/-/g, '_');
    var t = regexFindLast(labelLower, partExactAlnumRE);
    if (t >= 0) {
      // exact part match
      var partsAfter = countChars(labelLower.substr(t + 1), '.');
      score *= 200 / (partsAfter + 1);
    } else {
      t = regexFindLast(labelLower, partPrefixAlnumRE);
      if (t >= 0) {
        // part prefix match
        var partsAfter = countChars(labelLower.substr(t + 1), '.');
        score *= 20 / (partsAfter + 1);
      }
    }

    return score;
  };

  for (var i = 0; i < matches.length; i++) {
    matches[i].__resultScore = _resultScoreFn(matches[i]) +
        (matches[i].extraRank || 0) * 200;
  }

  matches.sort(function(a,b) {
    var n = b.__resultScore - a.__resultScore;
    if (n == 0) // lexicographical sort if scores are the same
        n = (a.label < b.label) ? -1 : 1;
    return n;
  });
}
