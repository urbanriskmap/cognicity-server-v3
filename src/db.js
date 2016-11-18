// Import DB library
const pgp = require('pg-promise')({
	// Postgres options TODO: Any postgres options required?
}) ;

export default (config) => new Promise((resolve, reject) => {

	// Build the connection string
	const cn = `postgres://${config.DB_USERNAME}:${config.DB_PASSWORD}@${config.DB_HOSTNAME}:${config.DB_PORT}/${config.DB_NAME}?ssl=config.pg.ssl`;

	// Connect to postgres
	let db = pgp(cn);

	// Make sure we can connect, if so resolve, if not reject // TODO: Add retries
	db.proc('version')
		.then((data) => resolve(db))
		.catch((err) => reject(err));

});
