var _RESOURCE_ID_REGEX = "@((android:)?(anim|animator|drawable|style|color|dimen|layout|interpolator|string|menu|array|integer|attr|id|bool)/([A-Za-z0-9_:\.\/])*)";
var _STYLE_PARENT_REGEX = '"([^@].*)"';

function linkify() {
  
  // remove dom listener
  document.getElementById('slider').removeEventListener("DOMSubtreeModified", fireLinkify, false);

  // find the resource identifiers
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

  // find any style parents
  var prevNode = '';
  var re2 = new RegExp();
  re2.compile(_STYLE_PARENT_REGEX);

  var walker2 = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    function(node) {
      var matches = node.textContent.match(re2);
      if(matches && prevNode === 'parent=') {
        //console.log(node.textContent);
        prevNode = node.textContent;
        return NodeFilter.FILTER_ACCEPT;
      } else {
        prevNode = node.textContent;
        return NodeFilter.FILTER_SKIP;
      }
    },
    false);

  var nodesStyleParent = [];

  while(walker2.nextNode()) {
    nodesStyleParent.push(walker2.currentNode);
  }
  
  // linkify the resource items
  for(var i = 0; node=nodes[i] ; i++) {
    node.parentNode.innerHTML = node.parentNode.innerHTML.replace(re, "<a href='javascript:arn_resolve(\"$1\")'>@$1</a>");
  }

  // linkify the style parents
  for(var i = 0; node2=nodesStyleParent[i] ; i++) {
    node2.parentNode.innerHTML = node2.parentNode.innerHTML.replace(re2, "<a href='javascript:arn_resolve(\"style/$1\")'>\"$1\"</a>");
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

  chrome.storage.sync.get('values_override', function(items) {
    var js;
    if (items.values_override) {
      var val = items.values_override;
      //alert(val);
      js = 'var _ARN_VALUES_OVERRIDES = ' + JSON.stringify(val) + ';';
    } else {
      js = 'var _ARN_VALUES_OVERRIDES = ' + JSON.stringify(_DEFAULT_VALUES) + ';';
    }

    var s3 = document.createElement('script');
    s3.innerText = js;
    (document.head||document.documentElement).appendChild(s3);
    //s3.parentNode.removeChild(s3);

    (document.head||document.documentElement).appendChild(s);
    (document.head||document.documentElement).appendChild(s2);
    s.parentNode.removeChild(s);
    s2.parentNode.removeChild(s2);

  });
  
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
