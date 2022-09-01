const mongoClient=require('mongodb').MongoClient



const state={
    db:null
}


module.exports.connect=function(done){
     const url=`mongodb+srv://nishadmuhammed:${process.env.DATABASE_PASSWORD}@cluster0.zoic2fb.mongodb.net/vogue-furniture`
     const dbname='vogue-furniture'


mongoClient.connect(url,(err,data)=>{
    if(err) return done(err)
    state.db=data.db(dbname)

    done()

   
})


module.exports.get=function(){
    return state.db
}


}


