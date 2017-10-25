var Q = require('q'),
    path = require('path'),
    fs = require('q-io/fs'),
    format = require('util').format,
    pathHelper = require('../../../../../helper/path'),
    log = require('../../../../../helper/log');

module.exports = function (msg) {
    var conf = msg.localSettings.configurations.android[msg.configuration],
        platformsRoot = path.join(pathHelper.app(), 'platforms'),
        out_dir = path.join(platformsRoot, 'android', 'build', 'apk'),
        signed = msg.localSettings.release && conf.sign,
        apk_type = signed ? 'release' : (msg.localSettings.release ? 'release-unsigned' : 'debug'),
        // several apks are possible with crosswalk
        apk_names = [
            {
                from: format('android-%s.apk', apk_type),
                dest: pathHelper.productFile('android', conf.product_file_name)
            },
            {
                from: format('android-armv7-%s.apk', apk_type),
                dest: pathHelper.productFile('android', conf.product_file_name, 'armv7')
            },
            {
                from: format('android-x86-%s.apk', apk_type),
                dest: pathHelper.productFile('android', conf.product_file_name, 'x86')
            }
        ],
        patch = path.join(__dirname, '../../../versions', msg.platformVersion, 'settings.js');

    return fs.exists(patch).then(function (exist) {
        if(exist) out_dir = require(patch).apk_output_folder();
        return out_dir;
    })
    .then(fs.list)
    .then(function (files) {
        var apks = files.filter(function (file) {
            return file.match(/\.apk/);
        });
        var promises = [];
        apk_names.forEach(function(obj) {
            if(apks.indexOf(obj.from) !== -1) {
                promises.push(
                    fs.copy(path.resolve(out_dir, obj.from), obj.dest).then(function() {
                        log.send(
                            'success',
                            '[android] copy apk from %s to %s',
                            out_dir,
                            obj.dest
                        );
                    })
                );
            }
        });
        if (promises.length === 0)
            log.send('warning', '[android] no apk found in folder %s', out_dir);
        return Q.all(promises);
    });
};
