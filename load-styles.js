(function(){
  'use strict';
  function loadStyles(){
    var styles = ['./styles.css?v=6','./navigation.css?v=6'];
    styles.forEach(function(h){
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = h;
      document.head.appendChild(l);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadStyles);
  } else {
    loadStyles();
  }
})();
