// Main API.

module.exports = (function() {
  var Core = require("./core.js");
  var Lang = require("./lang.js");
  return {
    hoas: Core.hoas,
    norm: Core.norm,
    type: Core.type,
    read: Lang.read,
    show: Lang.show
  };
})();
