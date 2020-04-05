const functions = require('firebase-functions')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin')
const cors = require('cors')({origin: true});
admin.initializeApp({
    credential: admin.credential.applicationDefault(), //FOR PROD
    //credential: admin.credential.cert('C:/Workspace/mcfam-server/MCFAM SYSTEMS-2ae2a0f0f5fa.json'), //FOR DEV
    apiKey: "AIzaSyAhT6LgLK_HcnpTFYOJI07SNdaozbFE39A",
    authDomain: "mcfam-systems.firebaseapp.com",
    databaseURL: "https://mcfam-systems.firebaseio.com",
    projectId: "mcfam-systems",
    storageBucket: "mcfam-systems.appspot.com",
    messagingSenderId: "164025316451",
    appId: "1:164025316451:web:48a5eddbf050a10d7ff456",
    measurementId: "G-8CW9M8PLSF"
    })

const firestore = admin.firestore()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mcfamrealty.is@gmail.com',
        pass: 'McfamRealty2020'
    }
});

// TODO: Upgrade to use 0AUTH2
exports.sendMail = functions.https.onRequest((req, res) => {
    cors(req, res, () => {

        if (!req.body.subject || !req.body.message) {
            return res.status(422).send({
              error: {
                code: 422,
                message: "Missing arguments"
              }
            });
        }

        const mailOptions = {
            from: 'MCFAM Realty  <mcfamrealty.is@gmail.com>',
            to: req.body.email,
            subject: req.body.subject,
            html: req.body.message
        };
  
        return transporter.sendMail(mailOptions, (erro, info) => {
            if(erro){
                return res.send(erro.toString());
            }
                return res.send(String('Succesfully Sent to '+req.body.email));
        });
    });    
});

exports.terminateUser = functions.https.onRequest((req, res) => {
    cors(req, res, () => {

        if (!req.body.uid) {
            return res.status(422).send({
              error: {
                code: 422,
                message: "Missing arguments"
              }
            });
        }

        const uid = req.body.uid;

        return admin.auth().deleteUser(uid)
        .then(() =>  {
            return res.send('Successfully deleted user');
            })
        .catch((error) =>  {
            console.log('Error deleting user:', error);
            return res.send('Error deleting user:', error);
        });
    });    
});

exports.computeRating = functions.https.onRequest( async (req, res) => {
   
        if (!req.body.uid) {
            return res.status(422).send({
              error: {
                code: 422,
                message: "Missing arguments"
              }
            });
        }

        const uid = req.body.uid;

        let snapshot = await firestore.collection("transaction")
            .where("agentUid", "==", uid)
            .where("isCompleted", "==", true)
            .get();

        let arrayRatings = snapshot.docs.map(doc => doc.data().rating)
        let sumRatings = arrayRatings.reduce((previous, current) => current += previous);
        let avgRatings = Math.floor(sumRatings / arrayRatings.length);

        let snapshot2 = await firestore.collection("broker").where("uid", "==", uid).get();
        let docId = snapshot2.docs.map(doc => doc.id);
           
        firestore.collection("broker").doc(docId[0]).update({
            aveRating : avgRatings
        })
        return res.send("ok")

});

