const mysql = require('mysql');

const pool = mysql.createPool({
	connectionLimit: 1,
	host: 'localhost',
	user: 'root',
	password: '123456',
	database: 'test_store'
});

console.log('Database Connected');

pool.on('release', () => {
	//console.log('pool => connection returned ----------------------');
});

process.on('SIGINT', () =>
	pool.end((err) => {
		if (err) return console.log(err);
		console.log('pool => closed');
		process.exit(0);
	})
);

module.exports = pool;
