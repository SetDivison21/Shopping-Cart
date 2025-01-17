// Import necessary modules
var { uri } = require('./databaseConnection');
const { MongoClient, ServerApiVersion } = require('mongodb');
const session = require('express-session');

// Create a MongoClient instance
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Function to check if the account already exists
async function checkAccountExistance(email, password) {
    try {
        // Connect to the MongoDB database
        await client.connect();

        // Access the main database
        const db = client.db("mainDataBase");

        // Access the users collection
        const usersCollection = db.collection("users");

        // Check if there is any user with the same email and password
        const user = await usersCollection.findOne({ email: email});

        // If user exists, return true
        if (user) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        // Handle error if encountered
        throw error;
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
}

// Function to handle the creation of a new account
module.exports.attemptCreateAccount = async function(req, res, next){
    var value_password = req.body.password;
    var value_email = req.body.email;

    try {
        const accountExists = await checkAccountExistance(value_email, value_password);

        if (accountExists) {
            res.render('createAccountResult', { success: false, message: 'Account already exists. Please log in or use different credentials.' });
        } else {
            await client.connect();
            const db = client.db("mainDataBase");
            const usersCollection = db.collection("users");
            await usersCollection.insertOne({ email: value_email, password: value_password });

            res.render('createAccountResult', { success: true, message: 'Your account has been created successfully!' });
            req.session.user = value_email;
        }
    } catch (error) {
        console.error("Error creating account:", error);
        res.render('createAccountResult', { success: false, message: 'There seems to be an account associtated with that email, please attempt logging in instead!' });
    } finally {
        await client.close();
    }
}

