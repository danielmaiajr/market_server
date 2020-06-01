const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

var opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: 'SECRET',
	passReqToCallback: true
};

module.exports = (passport) => {
	passport.use(
		new JwtStrategy(opts, (req, jwt_payload, done) => {
			const my_query = 'SELECT customer_id FROM customer WHERE customer_id = ?';
			req.connection.query(my_query, [ jwt_payload.id ], (error, results, fields) => {
				if (error) throw error;
				if (results.length > 0) {
					//jwt_payload.isAdmin = results[0].isAdmin;
					return done(null, jwt_payload);
				}

				return done(null, false);
			});
		})
	);
};
