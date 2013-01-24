var _RESOURCE_ID_REGEX = "@((android:)?(anim|animator|drawable|style|color|dimen|layout|interpolator|string|menu|array|integer|attr|id|bool)/([A-Za-z0-9_:\.\/])*)";

function linkify() {
  
  // remove dom listener
  document.getElementById('slider').removeEventListener("DOMSubtreeModified", fireLinkify, false);

  // linkify the resource items
  var re = new RegExp();
  re.compile(_RESOURCE_ID_REGEX);

  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    function(node) {
      var matches = node.textContent.match(re);
      if(matches) {
        return NodeFilter.FILTER_ACCEPT;
      } else {
        return NodeFilter.FILTER_SKIP;
      }
    },
    false);

  var nodes = [];

  while(walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for(var i = 0; node=nodes[i] ; i++) {
    node.parentNode.innerHTML = node.parentNode.innerHTML.replace(re, "<a href='javascript:arn_resolve(\"$1\")'>@$1</a>");
  }
  
  // add dom listener
  document.getElementById('slider').addEventListener("DOMSubtreeModified", fireLinkify, false);
}

function injectJS() {
  // inject our js
  var s = document.createElement('script');
  s.src = chrome.extension.getURL("resolver-injected.js");
  var s2 = document.createElement('script');
  s2.src = chrome.extension.getURL("page-find-injected.js");
  (document.head||document.documentElement).appendChild(s);
  (document.head||document.documentElement).appendChild(s2);
  s.parentNode.removeChild(s);
  s2.parentNode.removeChild(s2);
}

function doLinkify() {
  console.debug("doLinkify fired");
  linkify();
}

function fireLinkify() {
  if(timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(doLinkify, 500);
}

var timeout = null;
    
(function() {
  injectJS();
  doLinkify();

  var url = window.location.href;
  if (url.indexOf('##') > 0) {
    // search in page
    var target = url.slice(url.lastIndexOf('##')+2, url.length);
    arn_findResourceInPage(target); //page-find-injected.js
  }

})();
