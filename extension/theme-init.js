try{
  var t = JSON.parse(localStorage.getItem('startpage.theme.v3') || '"dawn"');
  if (['dawn','sakura','night','terminal'].indexOf(t) < 0) t = 'dawn';
  document.documentElement.dataset.theme = t;
}catch(e){ document.documentElement.dataset.theme = 'dawn'; }
