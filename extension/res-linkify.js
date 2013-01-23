
function linkify() {
  var url = window.location.href;

  // inject our js
  var s = document.createElement('script');
  s.src = chrome.extension.getURL("injected.js");
  (document.head||document.documentElement).appendChild(s);
  s.parentNode.removeChild(s);

  console.log('here2');

  var re = new RegExp();
  //re.compile("@([A-Za-z0-9_:\.\/]*)");
  re.compile("@((android:)?(anim|animator|drawable|style|color|dimen|layout|string|menu)/([A-Za-z0-9_:\.\/])*)");

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
      node.parentNode.innerHTML = node.parentNode.innerHTML.replace(re, "<a href='javascript:ext_resolve(\"$1\")'>@$1</a>");
    }
 }
    
(function() {
   console.log('here');
   linkify();
   //document.addEventListener("DOMContentLoaded", onLoad);
})();
