import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import Mongodb from 'mongodb';
dotenv.config();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
const MongoClient = Mongodb.MongoClient;

// find al collection name
// client.db(`${process.env.DB_NAME}`).listCollections()
//     .toArray((err, collections) => {
//         collections.map(collection => console.log(collection.name))
//     });
app.get('/', (req, res) => {
    res.send("NODE JS");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zhub4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);
    const accountCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_ACCOUNT}`);

    //   account collection
    app.post('/createAccount', (req, res) => {
        const newAccount = req.body;
        accountCollection.insertOne(newAccount)
            .then(success => res.status(201).send(success.insertedCount > 0))
            .catch(err => res.status(500).send(err));
    })

    app.get('/getAllAccount', (req, res) => {
        accountCollection.find()
            .toArray((err, accounts) => {
                if (err) {
                    res.send(err);
                } else {
                    res.status(200).send(accounts);
                }
            });
    });

    app.get('/getOneAccount/:email', (req, res) => {
        const email = req.params.email;
        accountCollection.find({email: email})
        .toArray((err, documents) => {
            if (err) {
                res.status(404).send(err);
            } else {
                res.status(200).send(documents[0]);
            }
        });
    });


    // message
    app.post('/messages/new', (req, res) => {
        const newMessage = req.body;
        collection.insertOne(newMessage)
            .then(data => {
                res.status(201).send(data.insertedCount > 0);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    });

    app.get('/getAllMessageInfo', (req, res) => {
        collection.find()
            .toArray((err, documents) => {
                if (err) {
                    res.send(err);
                } else {
                    res.status(200).send(documents);
                }
            });
    });

    app.get('/getSpecificChatMessages/:userEmail', (req, res) => {
        const userEmail = req.params.userEmail;
        collection.find({senderEmail:userEmail} & {receiverEmail:userEmail})
        .toArray((err, documents) => {
            if (err) {
                res.status(404).send(err);
            } else {
                const senderAndReceiver = documents.map(document =>  {
                    if (document.receiverEmail !== userEmail) {
                        return document.receiverEmail;
                    } else if (document.senderEmail !== userEmail){
                        return document.receiverEmail
                    }
                });
                const friends = senderAndReceiver.filter(email => email !== userEmail);
                const friendsEmail = friends.filter((email, index) => {
                    return friends.indexOf(email) === index;
                });
                res.status(200).send(friendsEmail);
            }
        })
    });

    app.get('/getSpecificConversation/:userEmail/:friendEmail', (req, res) => {
        const userEmail = req.params.userEmail;
        const friendEmail = req.params.friendEmail;

        collection.find({senderEmail:userEmail, receiverEmail:friendEmail} & {senderEmail:friendEmail, receiverEmail:userEmail})
        .toArray((err, documents) => {
            if (err) {
                res.status(404).send(err);
            } else {
                res.status(200).send(documents);
            }
        });
    });

});



app.listen(process.env.PORT || 5000, () => console.log('Server running'));