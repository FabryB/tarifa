var Q = require('q'),
    exec = require('child_process').exec,
    path = require('path'),
    format = require('util').format,
    pathHelper = require('../../../../../helper/path'),
    log = require('../../../../../helper/log');

module.exports = function (msg) {
    var conf = msg.localSettings.configurations.ios[msg.configuration],
        label = conf.sign;

    if(!label || !conf.product_file_name || !conf.product_name){
        return Q.resolve(msg);
    }

    var signing = msg.localSettings.signing.ios[label],
        //identity = signing.identity,
        //provisioning_path = signing.provisioning_path,
        output = path.join(pathHelper.app(), 'platforms/ios', conf.product_file_name),
        plist = path.join(pathHelper.app(), 'platforms/ios', 'exportOptions.plist'),
        defer = Q.defer(),
        app_input = path.join(pathHelper.app(), 'platforms/ios', conf.name + '.xcarchive'),
        cmd = format(
            'xcodebuild -exportArchive -archivePath "%s" -exportOptionsPlist "%s" -exportPath "%s"',
            app_input,
            plist,
            output
        ),
        options = {
            timeout: 0,
            maxBuffer: 1024 * 400
        };

    exec(cmd, options, function (err, stdout) {
        if(err) {
            defer.reject(format('%s %s', cmd, err));
            return;
        }

        log.send('info', stdout.toString());
        log.send('success', '[ios] run xcrun and produced the ipa: %s', output.toString());
        defer.resolve(msg);
    });

    return defer.promise;
};
