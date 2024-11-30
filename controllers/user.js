// IMPORT REQUIRED MODULES
const mongodb = require('../models/db/connect-db');
const chunks = require('../utilities/chunks');
const bcrypt = require('bcryptjs');
const { logError } = require('../error-handling/errorHandler');


// CREATE User CONTROLLER OBJECT HOLDER
const userController = {};

// Get all Users
userController.getAllUsers = async function(req, res) {
    //#swagger.tags=['User routes']
    try {
        const dataResult = await mongodb.getDb().db('testopidia').collection('users').find();
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then((Users) => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(Users);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || "Error occured while trying to fetch all Users";
    }
}

// Get a User by User id
userController.getAUser = async function(req, res) {
    //#swagger.tags=['User routes']
    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id)) {
        let invalidIdError = "invalid id. User id must be valid to get User";
        logError({message: invalidIdError})
        return res.status(400).json({message: invalidIdError});
    }

    const UserId = chunks.validObjectId(req.params.id, true, true);
    console.log(`UserId: ${UserId}`); // for debugging purpose
    try {
        const dataResult = await mongodb.getDb().db('testopidia').collection('users').find({_id: UserId});
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then((Users) => {
            // check if array is empty
            console.log(`Users: ${Users}`);  // for debugging purpose
            if (Users == null || Users == [] || Users == '') {
                return res.status(404).json({message: `User with id: ${UserId}; Not found, or is empty`});
            }
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(Users);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || `Error occured while trying to fetch User with id: ${UserId}`;
    }
}

// Create a User
userController.addNewUser = async function(req, res) {
    //#swagger.tags=['User routes']
    // check if req.body is not empty
    if (!req.body) {
        return res.status(400).send({
          message: 'User fileds cannot be empty.',
        });
    }

    // check User id and convert it to integer if an integer string was provided
    if (chunks.isValidObjectId(req.body._id) == 'integer') {
        req.body._id = parseInt(req.body._id);
        console.log(`_id: ${req.body._id} was converted to a propert integer value`);  // for debugging purpose
    }

    // hash passward
    let passowrdHash;
    try {
        passowrdHash = bcrypt.hashSync(req.body.password);
    } catch (err) {
        logError(err);
        return res.status(500).send({message: err});
    }

    const UserObject = {
        _id: req.body._id,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        profilePhotoUrl: null,
        bio: req.body.bio,
        username: req.body.username,
        password: passowrdHash,
        oAuthProvider: null,
        providerUserId : null,
        accountType: req.body._id == 1 ? 'admin' : req.body.accountType,  // make account of id 1 to be admin
        createdAt : Date.now()
    };

    try {
        const response = await mongodb.getDb().db('testopidia').collection('users').insertOne(UserObject);
        console.log(response);  // for visualizing and testing purpose
        if (response.acknowledged) {
            const msg = "new user added successfully";
            console.log(msg);  // testing purpose
            res.status(200).send({ message: msg });
        } else {
            const msg = "fail to add new user";
            console.log(msg);  // for testing purpose
            res.status(500).send({ message: msg });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || "Error occured while inserting new user";
    }
}

// Find/Create a user that is provided through oAuthProvider
userController.findOrCreateOAuthProviderProfile = async function(oAuthProviderNameAndIdObject, profile) {
    //#swagger.tags=['User routes']
    // check and create profile based on oAuthProvider
    if (oAuthProviderNameAndIdObject.oAuthProvider == 'github') {
        // find id in db where provider is github and userProfile id is same
        const profileObject = {
            firstname: profile.displayName.split(' ')[0],
            lastname: profile.displayName.split(' ')[profile.displayName.split(' ').length - 1],
            email: profile._json.email ? profile._json.email : null,
            profilePhotoUrl : profile.photos[0].value ? profile.photos[0].value : null,
            bio: profile._json.bio ? profile._json.bio : null,
            username: null,
            password: null,
            oAuthProvider: profile.provider,
            providerUserId : profile.id,
            accountType: 'user',
            createdAt : Date.now()
        }
        return await findOrCreate(oAuthProviderNameAndIdObject, profileObject);
    }

    // find or create profile
    async function findOrCreate(object, profileObject) {
        try {
            const usersDb = mongodb.getDb().db('testopidia').collection('users');
            const find = await usersDb.findOne({ oAuthProvider: object.oAuthProvider, providerUserId: object.profileId });
            console.log(find);  // for visualizing and testing purpose
            if (!find) {
                const response = await usersDb.insertOne(profileObject);
                if (response.acknowledged) {
                    const msg = "new oAuthProvider user added successfully";
                    console.log(msg);  // testing purpose
                    return { status: 201, find: false, message: msg };
                } else {
                    const msg = "fail to add new user";
                    console.log(msg);  // for testing purpose
                    return { status: 500, find: false, message: msg };
                }
            }
            const msg = "Profile already exist.";
            console.log(msg);  // for testing purpose;
            return { status: 200, found: true, message: msg };
        } catch (err) {
            console.error(err);
            return message = { status: 500, found: false, message: err} || "Error occured while trying to find or create new user";
        }
    }
}

// Update a User
userController.updateAUser = async function(req, res) {
    //#swagger.tags=['User routes']

    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id, true, true)) {
        let invalidIdError = "invalid id. User id must be valid to update User";
            logError({message: invalidIdError})
            return res.status(400).json({message: invalidIdError});
    };
    // set id
    const UserId = chunks.validObjectId(req.params.id);
    console.log(`UserId: ${UserId}`);

    // check if req.body object is present
    if (!req.body) {
        return res.status(400).send({
          message: 'User details cannot be empty.\nPlease Include the required User details to be updated!',
        });
    }

    let UserObject = {
        subject : req.body.subject,
        level : req.body.level,
        type : req.body.type,
        UserInfo : req.body.UserInfo,
        User : req.body.User,
        answer : req.body.answer,
    };

    try {
        // get the previouse user timestamp and add to updateTimestamp list, to be used for the update
        const dataResult = await mongodb.getDb().db('testopidia').collection('Users').find({ _id: UserId });
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then(async (Users) => {
            // check if array is empty
            console.log(`Users: ${Users}`);  // for debugging purpose
            if (Users == null || Users == [] || Users == '') {
                return res.status(404).json({message: `User with id: ${UserId}; Not found, or is empty`});
            }
            // Add timestamp and updateTimestamp to Update UserObject
            // adding author_id and timestamp
            UserObject.author_id = Users[0].author_id != undefined ? Users[0].author_id : 'current_user_id';
            UserObject.timestamp = Users[0].timestamp == undefined || Users[0].timestamp == null ? Date.now() : Users[0].timestamp;
            // adding update_authors_id and updateTimestamps
            UserObject.update_authors_id = Users[0].update_authors_id != undefined ? [...Users[0].update_authors_id, 'current_user_id'] : ['current_user_id'];
            UserObject.updateTimestamps = Users[0].updateTimestamps != undefined ? [...Users[0].updateTimestamps, Date.now()] : [Date.now()];
            console.log(`updateUserObject: ${JSON.stringify(UserObject)}`);  // for debugging purpose

            // update db with UserObject
            const response = await mongodb.getDb().db('testopidia').collection('Users').replaceOne({_id: UserId}, UserObject);
            console.log(response);  // for visualizing and testing purpose
            if (response.acknowledged && response.modifiedCount > 0) {
                const msg = `User with User-id: ${UserId}; has been updated successfully`;
                console.log(msg);  // testing purpose
                res.status(200).send({message: msg});
            } else {
                const msg = `fail to update User with User-id: ${UserId};\nPosible Error: Provided User id not found: ${UserId}`;
                console.log(msg);  // for testing purpose
                res.status(404).send({message: msg});
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).json(err) || "Error occured while updating User";
    }
}

// Delete a User
userController.deleteAUser = async function(req, res) {
    //#swagger.tags=['User routes']

    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id)) {
        let invalidIdError = "invalid id. User id must be valid to delete User";
        logError(invalidIdError);
        return res.status(400).json({message: invalidIdError});
    }
    
    const UserId = chunks.validObjectId(req.params.id);
    console.log(`UserId: ${UserId}`);  // for testing purpose

    try {
        const response = await mongodb.getDb().db('testopidia').collection('Users').deleteOne({_id: UserId});
        console.log(response);  // for visualizing and testing purpose
        if (response.acknowledged && response.deletedCount > 0) {
            const msg = `User with User-id: ${UserId}; has been deleted successfully`;
            console.log(msg);  // testing purpose
            res.status(200).send({message: msg});
        } else {
            const msg = `fail to delete User with User-id: ${UserId};\nPosible Error: Provided User id not found: ${UserId}`;
            console.log(msg);  // for testing purpose
            res.status(404).send({message: msg});
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).json(err) || "Error occured while deleting User";
    }
}

// EXPORT CONTROLLER

module.exports = userController;