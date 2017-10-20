var fs = require('fs'),
    xml2js = require('xml2js'),
    collectionsHelper = require('../helper/collections'),
    parse = require('../helper/xml').parse;

function build(file) {
    return function (xml) {
        var builder = new xml2js.Builder({
            renderOpts: { pretty: true, indent: '    ', newline: '\n' },
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            headless: false
        });
        var xmlString = builder.buildObject(xml);
        fs.writeFileSync(file, xmlString, 'utf-8');
    };
}

function readWhitelist(xmlRoot) {
    var whitelist = {
        'access-origin': [],
        'allow-intent': [],
        'allow-navigation': []
    };
    if (xmlRoot.access !== undefined) {
        xmlRoot.access.forEach(function (access) {
            var type = access.$['launch-external'] === 'yes' ? 'allow-intent' : 'access-origin';
            whitelist[type].push(access.$.origin);
        });
    }
    if (xmlRoot['allow-intent'] !== undefined) {
        xmlRoot['allow-intent'].forEach(function (allowIntent) {
            whitelist['allow-intent'].push(allowIntent.$.href);
        });
    }
    if (xmlRoot['allow-navigation'] !== undefined) {
        xmlRoot['allow-navigation'].forEach(function (allowNavigation) {
            whitelist['allow-navigation'].push(allowNavigation.$.href);
        });
    }
    return Object.keys(whitelist).map(function (key) {
        return {
            type: key,
            origin: whitelist[key]
        };
    }).filter(function (w) {
        return w.origin.length > 0;
    });
}

function get(filePath) {
    return parse(filePath).then(function (xml) {
        var preferences = {},
            whitelist = {};

        xml.widget.preference.forEach(function (pref) {
            preferences[pref.$.name] = pref.$.value;
        });

        whitelist.shared = readWhitelist(xml.widget);
        for (var p in xml.widget.platform) {
            var platformName = xml.widget.platform[p].$.name;
            if (whitelist[platformName] === undefined) { whitelist[platformName] = []; }
            whitelist[platformName] = whitelist[platformName].concat(readWhitelist(xml.widget.platform[p]));
        }

        return {
            id: xml.widget.$.id,
            version: xml.widget.$.version,
            author_name: xml.widget.author[0]._,
            author_email: xml.widget.author[0].$.email,
            author_href: xml.widget.author[0].$.href,
            description: xml.widget.description[0],
            preference: preferences,
            whitelist: whitelist,
            content: xml.widget.content[0].$.src
        };
    });
}

function writeWhitelist(xmlRoot, whitelist, platform) {
    if (whitelist === null) {
        xmlRoot.access = [];
        xmlRoot['allow-intent'] = [];
        xmlRoot['allow-navigation'] = [];
    } else {
        var originToNode = function (hrefAttrName, launchExternal) {
            return function (origin) {
                var $ = {};
                $[hrefAttrName] = origin;
                if (launchExternal === true) { $['launch-external'] = 'yes'; }
                return {
                    $: $
                };
            };
        };
        for (var w in whitelist) {
            var nodeName, launchExternal;
            var hrefAttrName = whitelist[w].type === 'access-origin' ? 'origin' : 'href';
            if (platform === 'android') {
                nodeName = whitelist[w].type === 'access-origin' ? 'access' : whitelist[w].type;
                launchExternal = false;
            } else if (platform === 'ios') {
                nodeName = whitelist[w].type === 'access-origin' ? 'access' : whitelist[w].type;
                launchExternal = whitelist[w].type === 'access-origin';
            } else {
                continue;
            }
            xmlRoot[nodeName] = xmlRoot[nodeName].concat(whitelist[w].origin.map(originToNode(hrefAttrName, launchExternal)));
        }
    }
}

function set(file, id, version, author_name, author_email, author_href, description, preference, whitelist, content, platform) {
    return parse(file).then(function (xml) {
        xml.widget.$.id = id;
        if(version) xml.widget.$.version = version;
        if(author_name) xml.widget.author[0]._ = author_name;
        if(author_email) xml.widget.author[0].$.email = author_email;
        if(author_href) xml.widget.author[0].$.href = author_href;
        if(description) xml.widget.description[0] = description;
        if (whitelist) {
            writeWhitelist(xml.widget, null);
            for (var p in xml.widget.platform) {
                writeWhitelist(xml.widget.platform[p], null);
            }
            if (platform !== undefined) {
                writeWhitelist(xml.widget, whitelist.shared.concat(whitelist[platform]), platform);
            } else {
                writeWhitelist(xml.widget, whitelist.shared, null);
                for (p in xml.widget.platform) {
                    var platformName = xml.widget.platform[p].$.name;
                    writeWhitelist(xml.widget.platform[p], whitelist[platformName], platformName);
                }
            }
        }

        if(content) {
            xml.widget.content[0].$.src = content;
            if(content.match(/http.*/)) {
                if(!xml.widget['allow-navigation']) xml.widget['allow-navigation'] = [];
                xml.widget['allow-navigation'].push({
                    $: {
                        href: content
                    }
                });
            } else {
                delete xml.widget['allow-navigation'];
            }
        }

        if(preference) {
            xml.widget.preference = [];
            for(var pref in preference) {
                xml.widget.preference.push({
                    $: {
                        name: pref,
                        value: preference[pref]
                    }
                });
            }
        }
        return xml;
    }).then(build(file));
}

function setName(file, name) {
    return parse(file).then(function (xml) {
        xml.widget.name[0] = name;
        return xml;
    }).then(build(file));
}

function removePlugins(filePath, plugins) {
    return parse(filePath).then(function (xml) {
        xml.widget.plugin = xml.widget.plugin.filter(function (plugin) {
            return plugins.indexOf(plugin.$.name) < 0;
        });
        return xml;
    }).then(build(filePath));
}

function merge(file, xmlObj) {
    return parse(file).then(function (xmlInit) {
        return collectionsHelper.mergeObject(xmlInit, xmlObj, true);
    }).then(build(file));
}

module.exports = {
    set: set,
    get: get,
    setName: setName,
    removePlugins: removePlugins,
    merge: merge
};
