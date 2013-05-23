var fs = require('fs'),
    
    nunjucks = require('nunjucks'),
    async = require('async'),

    META = require('./meta'),
    data = require('./data');

var IS_DEBUG = process.argv[2] === 'debug';

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('template'));

var template = env.getTemplate('code.html');

var left = 0;
function loadData(data, deep) {
    if (deep === undefined) deep = 1;

    function processItem(id) {
        var obj = {
            id: id,
            h: deep
        };

        left++;

        var file = __dirname + '/data/' + id + '.html';
        fs.readFile(file, {encoding: 'utf-8'}, function(error, fileContent) {
            if (error) throw error;

            var pos = fileContent.indexOf('\n');

            obj.title = fileContent.slice(0, pos),
            obj.content = fileContent.slice(pos + 1);

            left--;
            if (left === 0) onLoaded();
        });

        return obj;
    }

    return data.map(function(data) {
        if (typeof data === 'string') {
            return processItem(data);
        } else {
            var first = processItem(data[0]);
            first.childs = loadData(data.slice(1), deep + 1);
            return first;
        }
    });
}

data = loadData(data);

function onLoaded() {
    write(render(data));
}

function render(items) {
    var rendered = template.render({
        analytics: !IS_DEBUG,

        version: META.VERSION,
        date: META.DATE,

        title: META.TITLE,

        items: items
    });

    return rendered;
}

function write(text) {
    var file = __dirname + '/' + (IS_DEBUG ? 'debug' : 'html') + '/index.html'

    fs.writeFile(file, text, function(error) {
        if (error) throw error;

        console.log('Code Hardcorius ' + META.VERSION +
            ' (' + META.DATE + ') is constructed!');
    });
}
