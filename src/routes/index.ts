const express = require("express");

const app = express();

const port = 3000;

app.get( '/',(request : Request, response : any)=>{
    response.send("hello node");
})

app.listen(port , ()=>{
    console.log(`listening at ${port}` );
})