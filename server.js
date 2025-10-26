require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const cors = require('cors')
const { error } = require('console')

const app = express()

// middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// db connect
const {MONGODB_URI, PORT = 3001} = process.env

mongoose
  .connect(MONGODB_URI, {dbName: 'portfoilo'})
  .then(()=> console.log('connected'))
  .catch((err)=>{
    console.error('error:', err.message)
    process.exit(1)
  })

// model
const projectSchema = new mongoose.Schema(
  {
    date: {type: String, required: true, trim: true},
    company: {type: String, required: true, trim: true},
    role:{type: String, required: true, trim: true},
    link: {type: String, trim: true},
    img: {type: String, required: true, trim: true}
  },
  {timestamps:true}
)

const Project = mongoose.model('Project', projectSchema)

// helpers
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) 

// routes

// Health check
app.get('/', (_req, res)=> {
  res.send('Hello from Portfolio API!')
})

// CREATE (add new project)
app.post('/api/projects', async(req,res)=> {
  try {
    const {date, company, role, link, img} = req.body;
    if(!date) return res.status(400).json({error:'date is required'})
    
    const project = await Project.create({date, company, role, link, img})
    res.status(201).json(project)
  }catch (err) {
    res.status(500).json({error: err.message})
  }
})

// READ all projects
app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one project
app.get('/api/projects/:id', async (req, res)=> {
  try{
    const {id} = req.params
    if(!isValidId(id)) return res.status(400).json({error: 'invalid id'})
  
    const project = await Project.findById(id)
    if(!project) return res.status(404).json({error: 'not found'})
    res.json(project)
  }catch(err){
    res.status(500).json({error: err.message})
  }
})

// UPDATE project
app.put('/api/projects/:id', async(req, res)=> {
  try{
    const {id} = req.params
    if(!isValidId(id)) return res.status(400).json({error: 'invalid id'})

    const {date, company, role, link, img} = req.body
    const project = await Project.findByIdAndUpdate(
      id, 
      {date, company, role, link, img},
      {new: true, runValidators: true}
    )

    if(!project) return res.status(404).json({error: 'not found'})
    res.json(project)
  }catch(err){
    res.status(500).json({error: err.message})
  }
})

// DELETE
app.delete('/api/projects/:id', async(req, res)=> {
  try{
    const {id} = req.params
    if(!isValidId(id)) return res.status(400).json({error:'invalid id'})
  
    const deleted = await Project.findByIdAndDelete(id)
    if(!deleted) return res.status(404).json({error: 'not found'})

    res.json({ok: true})
  }catch(err){
    res.status(500).json({error: err.message})
  }
})

// 404 fallback
app.use((_req, res)=> res.status(404).json({error: 'route not found'}))

// start server
app.listen(PORT, ()=> {
  console.log(`🚀 Portfolio API running at http://localhost:${PORT}`);
})