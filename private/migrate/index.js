const mysql = require('mysql2');
var path = require('path');
var config = require(path.resolve(__dirname,'..','..','config.js'));

var connection;
var connection_fail = false;
try {
    connection = mysql.createConnection(config.connection);
} catch(e) {
    connection_fail = true;
}

var clear = [
    (next)=>{
        connection.query(`
            DROP TABLE IF EXISTS \`comments\`;
        `,function(err,results,fields) {
            if(err) {
                console.log(err);
                connection.close();
                return;
            }
            //console.log(results);
            next();
        });
    }, (next)=>{
        connection.close();
    }
];

var create = [(next)=>{
    console.log("CREATE TABLE comments");
    connection.query(`
        CREATE TABLE IF NOT EXISTS \`comments\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`user\` INT NOT NULL DEFAULT 1,
            \`mode\` INT NOT NULL DEFAULT 1,
            \`state\` INT NOT NULL DEFAULT 1,
            \`file\` VARCHAR(256) NOT NULL DEFAULT '',
            \`date\` VARCHAR(256) NOT NULL DEFAULT '',
            \`comment\` TEXT NOT NULL,
            PRIMARY KEY (\`id\`)
        );
    `,function(err,results,fields) {
        if(err) {
            console.log(err);
            connection.close();
            return;
        }
        console.log(results);
        next();
    });
},(next)=>{
    connection.close();
    console.log("JOB END");
}];


var test = [(next)=>{
    setTimeout(()=>{
        if(connection_fail) {
            console.log("CONEXAO COM O BANCO FALHOU.");
        } else {
            console.log("CONEXAO COM O BANCO FOI UM SUCESSO.");
        }
        next();
    },1000);
},(next)=>{
    process.exit(0);
    console.log("JOB END");
}];

var show_tables = [(next)=>{
    console.log("SHOW TABLES;");
    connection.query(`
        SHOW TABLES;
    `,function(err,results,fields) {
        console.log(results);
        next();
    });
},(next)=>{
    connection.close();
    console.log("JOB END");
}];

function run_stack(up) {
    var r = [];
    function setf(r,up,x) { r.push(()=>{ if(x+1 < up.length) up[x+1]( r[x+1] ); }) }
    for(var x = 0; x < up.length;x++) { setf(r,up,x); }
    up[0](r[0]);
}

const { program } = require('commander');

program
    .option('--clear', 'clear database')
    .option('--showtables', 'show tables')
    .option('--createtables', 'create tables')
    .option('--test', 'test connection');

program.parse(process.argv);

process.on('uncaughtException', function (err) {
    connection_fail = true;
    console.log("ERRO!");
    //console.log(err);
});

try {
    if (program.clear) {
        run_stack(clear);
    } else if(program.showtables) {
        run_stack(show_tables);
    } else if(program.createtables) {
        run_stack(create);
    } else if(program.test) {
        run_stack(test);
    }
} catch(e) {
    console.log("ERRO!");
}
