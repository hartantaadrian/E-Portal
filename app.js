const express = require('express')

const morgan = require('morgan')
const mysql = require('mysql')
const bodyparser = require('body-parser')
const jwt = require('jsonwebtoken')
const hash = require('string-hash')
const mssql = require('mssql')

const app = express()

app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json());
app.use(morgan('combined'))

function getConnection() {
   return mysql.createConnection({
        host:'localhost',
        user:'root',
        database:'nodedb'
    })
}

function mssqlcon(){
    return mssql.connect({
        user: 's1sql',
        password: 'Password.1',
        server: '192.168.10.103:1433', // You can use 'localhost\\instance' to connect to named instance
        database: '...',
    })
}


app.post('/login',(req,res)=>{
    const connection = getConnection()
    const name = req.body.name
    const pass = hash(req.body.pass)
    const queryString="Select * from users where Name = ? and password = ?"
    connection.query(queryString,[name,pass],(err,rows,fields)=>{
        if(err){
            console.log("Failed : " + err)
            res.sendStatus(500)
            return
        }else if(rows.length == 0){
            console.log("not found : ")
            res.status(201).json({
                "message":"User not found",
            })
            return
        }
        console.log(name)   
        const users = rows.map((row)=>{
            return {
                id:row.id,
                username: row.Name
            }
        })
        jwt.sign({users},'secretkey123',{expiresIn: '30s'},(err,token)=>{
            res.json({
                status:"success",
                user:users,
                token:token
            })
        })

    })
})


app.get('/authget',verifyToken,(req,res)=>{
    console.log(req.token)
    jwt.verify(req.token,'secretkey123',(err,authData)=>{
        if(err){
            res.sendStatus(403)
        }else{
            res.json({
                authData
            })
        }

    })
})

app.post('/postuser',(req,res)=>{
    console.log(req.body)
    const connection = getConnection()
    const name = req.body.name
    const pass = hash(req.body.pass)
    const queryString = " Insert into users (name,password) values (?,?)"
    connection.query(queryString,[name,pass],(err,rows,fields)=>{
        if(err){
            console.log("Failed : " + err)
            res.sendStatus(500)
            return
        }
        console.log("Sucess")
        res.sendStatus(200)
    })
   
})

app.get("/users/:id",(req,res)=>{
   console.log('id: ' + req.params.id)
   const connection = getConnection()
   const userId = req.params.id
   const queryString = " Select * from users where id = ?"
   connection.query(queryString,[userId],(err,rows,fields)=>{
       if(err){
           console.log("Failed : " + err)
           res.sendStatus(500)
           return
       }
       console.log("sucess")
       const users = rows.map((row)=>{
           return {
               id:row.id,
               username: row.Name
           }
       })
       
       res.json(rows)
   })
})

app.get("/",(req,res)=>{
    console.log("ehehe")
    res.send("heloo")
})

app.get("/users",(req,res)=>{
    const connection = getConnection()
    const userId = req.params.id
    const queryString = " Select * from users"
    connection.query(queryString,(err,rows,fields)=>{
        if(err){
            console.log("Failed : " + err)
            res.sendStatus(500)
            return
        }
        console.log("sucess")
        const users = rows.map((row)=>{
            return {
                id:row.id,
                username: row.Name
            }
        })
        
        res.json(rows)
    })
})







app.listen(5020,()=>{
    console.log("ehehe")
})


//token format
//Authorization : Bearer <access_token>

function verifyToken(req,res,next){
    //get auth value on header
    const bearerHeader = req.headers['authorization'];
    //check bearer
    if(typeof bearerHeader !=='undefined'){
        // split the space
        const bearer = bearerHeader.split(' ')
        //get token from auth array
        const bearerToken = bearer[1]
        //set token
        req.token = bearerToken
        next();
    }else{
        //forbidden
        res.send(403)
    }



}