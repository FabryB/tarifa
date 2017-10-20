module.exports.beforeCompile = function (conf, options) {
    options.device = conf.device ? !conf.device.value.match(/Simulator/) : true;
    options.noSign = true;
    return options;
};
