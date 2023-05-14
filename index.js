const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




app.listen(port,()=>{
    console.log('listening from ',port);
})



const uri = `mongodb+srv://${process.env._USER}:${process.env._PASS}@cluster0.xhpmdyt.mongodb.net/?retryWrites=true&w=majority`;
// console.log(process.env._USER)
// console.log(process.env._PASS)
// console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req,res,next) =>{
  console.log('hitting verify');
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization){
    res.status(401).send({error:true,message:'unauthorized access'});
  }
  const token = req.headers.authorization.split(' ')[1];
  console.log('token',token);

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
    if(error)res.status(401).send({error:true,message:'unauthorized access'});

    req.decoded=decoded;
    next();
  });
  
  
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("carDoctorDB");
    const services = database.collection("services");
    const checkOuts = database.collection("checkOuts");

    app.post('/jwt',(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:10
      });

      res.send({token});
    })

    app.get('/', (req,res)=>{
        res.send('hello from car doctor');
    });
    
    app.get('/services',async(req,res)=>{
        const cursor = services.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get('/services/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)};
        const result = await services.findOne(query);
        // console.log(query,result)
        res.send(result);
    });

    app.get('/checkouts',verifyToken,async(req,res)=>{
      console.log('req email: ',req.query);
      
      
      const decoded = req.decoded;
      console.log('came back from verify ',decoded);

      if(!decoded || decoded?.email!==req.query.email){
        res.status(403).send({error:true,message:'forbidden access'});
      }
      else{
        let query = {}
        if(req.query?.email){
          query={userEmail:req.query?.email}
        }
        const result = await checkOuts.find(query).toArray();
        res.send(result);
      }

      
    })


    app.post('/checkOut', async(req,res)=>{
      const data = req.body;
      // console.log(data);
      const result = await checkOuts.insertOne(data);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// common-user
// z41a7R6k1hVi2e7z


