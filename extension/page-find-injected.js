function arn_findResourceInPage(name) {
  var target = '"' + name + '"';
  var prevNode = '';
  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    function(node) {
      //console.log(node.textContent);
      var matches = node.textContent.match(target);
      if(matches && prevNode === 'name=') {
        prevNode = node.textContent;
        return NodeFilter.FILTER_ACCEPT;
      } else {
        prevNode = node.textContent;
        return NodeFilter.FILTER_SKIP;
      }
    },
    false);

  var nodes = [];

  while(walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for(var i = 0; node=nodes[i] ; i++) {
    var line = arn_getGitHubLineNumber(node.parentNode, 0);
    if (line != '0') {
      //window.location.href = '#L' + line;
      location.replace(window.location.href.split('#')[0] + '#L' + line);
      $.scrollTo($('#' + node.parentNode.getAttribute('id')));
    }
  }
  
}

function arn_getGitHubLineNumber(node, attempts) {
  if (node.getAttribute('class') === 'line') {
     return node.getAttribute('id').slice(2, node.getAttribute('id').length);
  } else {
     if (attempts > 5) {
        return '0'
     } else {
        return arn_getGitHubLineNumber(node.parentNode, attempts+1);
     }
  }
}