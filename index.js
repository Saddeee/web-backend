require('dotenv').config()
const express = require("express");
const Note = require("./modules/note")
const app = express();


const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}



const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.static("dist"))
app.use(requestLogger)


app.post("/api/notes", (request, response,next) => {
  const body = request.body;

  if(body.content === undefined){
    return response.status(400).json({ error: 'content missing' })
  }
  const note= new Note({
    content: body.content,
    important: Boolean(body.important),
  })

  note.save().then(savedNote=>{
    response.json(savedNote)
  }).catch(error=>next(error))
});



app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes)=>{
    response.json(notes)
  })
});

app.get("/api/notes/:id", (request, response) => {
  Note.findById(request.params.id).then(note=>{
    response.json(note)
  })
})

app.put("/api/notes/:id", (req, res,next)=>{
  const {content, important}= req.body

  Note.findByIdAndUpdate(req.params.id,{content, important}, {new:true, runValidators:true,context:"query"}).then(
    updatedNote=>{
      res.json(updatedNote)
    }).catch(error=>{
      next(error)
    })
})

app.delete("/api/notes/:id", (request, response) => {
  Note.findByIdAndDelete(request.params.id).then(result=>{
    response.status(204).end()
  }).catch(
    error=>next(error)
  )
});



const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }else if(error.name === "ValidationError"){
    return response.status(400).json({error:error.message})
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT|| 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
