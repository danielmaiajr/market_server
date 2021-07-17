const express = require('express');
const app = express();

//Using the morgan middleware
const morgan = require('morgan');
app.use(morgan('dev'));

//Using the body-parser middleware
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Using the pool-connection(database config) middleware
const pool = require('./database_config/pool-config');
const connectionMiddleware = require('./database_config/connection-middleware');
app.use(connectionMiddleware(pool));

//Passport inicialization middleware
const passport = require('passport');
app.use(passport.initialize());
require('./auth_config/passport')(passport);

//Using the router for the api
const customers = require('./routes/customers');
const addresses = require('./routes/addresses');
const payments = require('./routes/payments');
const orderStatus = require('./routes/orderStatus');
const cartItems = require('./routes/cartItems');
const products = require('./routes/products');
const orders = require('./routes/orders');
const scheduling = require('./routes/scheduling');
const checkcep = require('./routes/checkcep');

app.use('/api', customers);
app.use('/api', addresses);
app.use('/api', payments);
app.use('/api', orderStatus);
app.use('/api', cartItems);
app.use('/api', products);
app.use('/api', orders);
app.use('/api', scheduling);
app.use('/api', checkcep);

//Server listening to connections
const PORT = 5000;
app.listen(PORT || process.env.PORT, () => console.log(`Server running on Port ${PORT}`));
