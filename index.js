const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PSS}@cluster0.bdqfb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db('iFitDB');
        const userCollection = database.createCollection('users')
        const bookingInfoCollection=database.createCollection("bookingInfo")

        app.post('/jwtToken', async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            console.log({ token });
            res.send({ token });
        })

        const verifyToken = (req, res, next) => {
            console.log(req.headers?.Authorization)
            if (!req.headers.Authorization) {
                return res.status(401).send({ message: "forbidden access" })
            }
            const token = req.headers.Authorization
            if (!token) {
                return
            }
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "forbidden access" })
                }
                req.decoded = decoded;
                next()
            })
        }

        app.post('/addUserInfo', async (req, res) => {
            const result = await (await userCollection).insertOne(req.body)
            res.send(result)
        })

        app.get('/existUser', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await (await userCollection).findOne(query);
            console.log(req.query.email)
            res.send(result)
        })

        app.put(`/updateUserInfo`, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const options = { upsert: true };
            const userInfo = { $set: req.body };
            const result = await (await userCollection).updateOne(query, userInfo, options);
            res.send(result)
        })

        app.get('/trainer', async (req, res) => {
            const query = { role: "trainer" };
            const result = await (await userCollection).find(query).toArray();
            res.send(result);
        })
        //find trainer
        app.get('/findTrainer', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const learner =await (await userCollection).findOne(query)
            if (!learner || !learner.slot) {
                return res.status(404).send({ message: "user not found" })
            }
            const learnerSlots = learner.slot.map(slot => parseInt(slot))
            const result = await (await userCollection).find({
                role: "trainer",
                slot: {
                    $elemMatch: {
                        $in: learnerSlots
                    }
                }
            }).toArray()
            res.send(result)
        })

        app.post('/bookedTrainer', async(req, res)=>{
            const bookingInfo=req.body;
            const result=await (await bookingInfoCollection).insertOne(bookingInfo);
            res.send(result)
        })

        app.get('/myBookedTrainer', async(req, res)=>{
            const email=req.query.email;
            const query={bookedBy: email};
            const result=await (await bookingInfoCollection).find(query).toArray();
            res.send(result);
        })

        app.delete(`/deleteBookedItem/:id`, async (req, res)=>{
            const id=req.params.id;
            const query={_id: new ObjectId(id)};
            const result=await (await bookingInfoCollection).deleteOne(query);
            res.send(result);
        })

        app.get('/getMyLearner', async(req,res)=>{
            const email=req.query.email;
            console.log(email, "email")
            const query={email: email}
            const trainer=await (await userCollection).findOne(query);
            if (!trainer) {
                return res.status(404).send({message: 'user not found'})
            }
            console.log(trainer)
            const bookingData=await (await bookingInfoCollection).find({trainerId: trainer._id.toString()}).toArray()
            res.send(bookingData)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('iFit is running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})