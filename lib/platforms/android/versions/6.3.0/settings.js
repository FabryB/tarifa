var path = require('path'),
    pathHelper = require('../../../../helper/path');

module.exports.apk_output_folder = function () {
    return path.join(pathHelper.app(), 'platforms', 'android', 'build', 'outputs', 'apk');
};

module.exports.beforeCompile = function (conf, options) {
    if(conf.localSettings.configurations[conf.platform]
        && conf.localSettings.configurations[conf.platform]
        && conf.localSettings.configurations[conf.platform][conf.configuration].sign) {
        options.argv = ['--gradleArg=-PcdvReleaseSigningPropertiesFile=release.properties'];
    }
    return options;
};

module.exports.minSdkVersion = 10;

module.exports.signingTemplate = 'storeFile=%s\nkeyAlias=%s\nstorePassword=%s\nkeyPassword=%s';
