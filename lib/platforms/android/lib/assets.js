var Q = require('q'),
    path = require('path'),
    fs = require('fs'),
    Qfs = require('q-io/fs')
    pathHelper = require('../../../helper/path'),
    format = require('util').format;

var drawables = module.exports.drawables = [
    { src: /(.+)-36.png/, dest: 'res/drawable-ldpi/$1.png' },
    { src: /(.+)-48.png/, dest: 'res/drawable-mdpi/$1.png' },
    { src: /(.+)-72.png/, dest: 'res/drawable-hdpi/$1.png' },
    { src: /(.+)-96.png/, dest: 'res/drawable-xhdpi/$1.png' },
    { src: /(.+)-144.png/, dest: 'res/drawable-xxhdpi/$1.png' },
    { src: /(.+)-192.png/, dest: 'res/drawable-xxxhdpi/$1.png' },
    { src: /(.+)-96.png/, dest: 'res/drawable/$1.png' },
	{ src: /(.+)-36.png/, dest: 'res/mipmap-ldpi/$1.png' },
    { src: /(.+)-48.png/, dest: 'res/mipmap-mdpi/$1.png' },
    { src: /(.+)-72.png/, dest: 'res/mipmap-hdpi/$1.png' },
    { src: /(.+)-96.png/, dest: 'res/mipmap-xhdpi/$1.png' },
    { src: /(.+)-144.png/, dest: 'res/mipmap-xxhdpi/$1.png' },
    { src: /(.+)-192.png/, dest: 'res/mipmap-xxxhdpi/$1.png' }
];

module.exports.icons = drawables.map(function (drawable) {
    return {
        src: drawable.src.source.replace(/\(.*\)/, 'icon'),
        dest: drawable.dest.replace(/\$1/, 'icon')
    };
});

module.exports.copyDrawables = function (config) {
    var root = path.resolve(pathHelper.root(), 'images', 'android'),
        assetsPath = path.resolve(root, config, 'images'),
        assetsDefaultPath = path.resolve(root, 'default', 'images');

    assetsPath = pathHelper.isDirectory(assetsPath) ? assetsPath : assetsDefaultPath;

    if(!pathHelper.isDirectory(assetsPath)) return Q();

    var files = fs.readdirSync(assetsPath);
    return drawables.reduce(function (p, drawable) {
        return p.then(function () {
            return files.filter(function (file) {
                var dest = file.replace(drawable.src, drawable.dest),
                    absSrc = path.resolve(assetsPath, file),
                    absDest = path.resolve(pathHelper.platforms(), 'android', dest);
                if(file !== dest) return Qfs.copy(absSrc, absDest);
                else return Q();
            });
        });
    }, Q());
};

module.exports.splashscreens = [
    { src: ['screen-640x480.9.png', 'screen-640x480.png'], dest: ['res/drawable-land-hdpi/screen.9.png', 'res/drawable-land-hdpi/screen.png'] },
    { src: ['screen-426x320.9.png', 'screen-426x320.png'], dest: ['res/drawable-land-ldpi/screen.9.png', 'res/drawable-land-ldpi/screen.png'] },
    { src: ['screen-470x320.9.png', 'screen-470x320.png'], dest: ['res/drawable-land-mdpi/screen.9.png', 'res/drawable-land-mdpi/screen.png'] },
    { src: ['screen-960x720.9.png', 'screen-960x720.png'], dest: ['res/drawable-land-xhdpi/screen.9.png', 'res/drawable-land-xhdpi/screen.png'] },
    { src: ['screen-1410x960.9.png', 'screen-1410x960.png'], dest: ['res/drawable-land-xxhdpi/screen.9.png', 'res/drawable-land-xxhdpi/screen.png'] },
    { src: ['screen-1880x1280.9.png', 'screen-1880x1280.png'], dest: ['res/drawable-land-xxxhdpi/screen.9.png', 'res/drawable-land-xxxhdpi/screen.png'] },
    { src: ['screen-480x640.9.png', 'screen-480x640.png'], dest: ['res/drawable-port-hdpi/screen.9.png', 'res/drawable-port-hdpi/screen.png'] },
    { src: ['screen-320x426.9.png', 'screen-320x426.png'], dest: ['res/drawable-port-ldpi/screen.9.png', 'res/drawable-port-ldpi/screen.png'] },
    { src: ['screen-320x470.9.png', 'screen-320x470.png'], dest: ['res/drawable-port-mdpi/screen.9.png', 'res/drawable-port-mdpi/screen.png'] },
    { src: ['screen-720x960.9.png', 'screen-720x960.png'], dest: ['res/drawable-port-xhdpi/screen.9.png', 'res/drawable-port-xhdpi/screen.png'] },
    { src: ['screen-960x1410.9.png', 'screen-960x1410.png'], dest: ['res/drawable-port-xxhdpi/screen.9.png', 'res/drawable-port-xxhdpi/screen.png'] },
    { src: ['screen-1280x1880.9.png', 'screen-1280x1880.png'], dest: ['res/drawable-port-xxxhdpi/screen.9.png', 'res/drawable-port-xxxhdpi/screen.png'] }
];
