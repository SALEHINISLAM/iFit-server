const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

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