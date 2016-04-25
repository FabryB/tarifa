var Q = require('q'),
    fs = require('q-io/fs'),
    path = require('path'),
    log = require('../helper/log');

function help(fullname) {
    var helpFile = fullname + '.txt',
        helpPath = path.join(__dirname, helpFile);
    return fs.isFile(helpPath).then(function (exists) {
        if (exists) {
            return fs.read(helpPath).then(function (content) {
                log.send('help', content);
            });
        }
    });
}

function ask(inquirer, question, value) {
    return help(question.fullname).then(function () {
        return inquirer.prompt([question]).then(function (answer) {
            value[question.name] = answer[question.name];
            return value;
        });
    });
}

function askQuestion(question, type, choices) {
    var q = {
        type: type || 'input',
        name: 'result',
        message: question
    };

    if(type === 'list') q.choices = choices;

    return require('inquirer').prompt([q]).then(function (resp) {
        return resp.result;
    });
}

module.exports = function (fullnames) {
    var inquirer = require('inquirer'),
        questions = fullnames.map(function (fullname) {
            var p = path.resolve(fullname) === path.normalize(fullname)
                ? fullname : path.join(__dirname, fullname),
                qst = require(p);

            qst.fullname = fullname;
            return qst;
        });

    return function (answers) {
        return questions.reduce(function (promise, question) {
            var d = Q.defer();
            promise.then(function (answer) {
                if (answer.platforms &&
                    question.dependency &&
                    answer.platforms.indexOf(question.dependency) < 0) {
                    d.resolve(answer); // skip this question
                } else {
                    // if the question is a function it must return a promise,
                    if (typeof question === 'function') {
                        question(answer).then(function (qst) {
                            if(qst.dependency && answer.platforms.indexOf(qst.dependency) < 0)
                                d.resolve(answer); // skip
                            else if((qst.condition && qst.condition(answer)) || !qst.condition)
                                ask(inquirer, qst, answer).then(function (answer) { d.resolve(answer); });
                            else d.resolve(answer); // skip
                        }, function (err) { log.send('error', err); d.reject(err); });
                    } else if((question.condition && question.condition(answer)) || !question.condition){
                        ask(inquirer, question, answer).then(function (answer) { d.resolve(answer); });
                    } else {
                        d.resolve(answer); //skip
                    }
                }
            });
            return d.promise;
        }, Q.resolve(answers));
    };
};

module.exports.question = askQuestion;

module.exports.password = function (question) {
    return askQuestion(question, 'password', 'password');
};
