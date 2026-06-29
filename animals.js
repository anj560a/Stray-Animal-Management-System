const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal');

// CRUD
router.get('/', async(req,res)=>res.json(await Animal.find()));
router.post('/', async(req,res)=>res.json(await new Animal(req.body).save()));
router.put('/:id', async(req,res)=>res.json(await Animal.findByIdAndUpdate(req.params.id, req.body, { new:true })));
router.delete('/:id', async(req,res)=>{ await Animal.findByIdAndDelete(req.params.id); res.json({ msg:'Deleted' }); });

module.exports = router;
