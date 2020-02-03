var style=document.createElement("style");
  document.head.appendChild(style);
  style.type = "text/css";
  style.innerHTML = "";
  var oDUmmy = new sap.ui.core.Control();
  sap.ui.core.Control.prototype.changeColor = function(oColor){
   style.innerHTML = style.innerHTML + '.' + oColor + '{background-color:' + oColor + ' !important;}';
   this.addStyleClass(oColor);
  };
  sap.ui.core.Control.prototype.addCustomStyle = function(oClassName,oStyle){
   style.innerHTML = style.innerHTML + '.' + oClassName + '{' + oStyle + ' !important;}';
   this.addStyleClass(oClassName);
  };