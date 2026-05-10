const mongoose=require("mongoose")

const connectDB=async()=>{
    const uri=process.env.MONGO_URI
    try{
        await mongoose.connect(uri)
        console.log("Mongo db connected")
    }
    catch(err){
        console.err(err.message)
        process.exit(1)
    }
}

module.exports=connectDB