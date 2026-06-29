const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/', async(req,res)=>res.json(await Report.find()));
router.post('/', async(req,res)=>res.json(await new Report(req.body).save()));
router.put('/:id', async(req,res)=>{
  const { status } = req.body;
  res.json(await Report.findByIdAndUpdate(req.params.id, { status }, { new:true }));
});
router.delete('/:id', async(req,res)=>{ await Report.findByIdAndDelete(req.params.id); res.json({ msg:'Deleted' }); });

module.exports = router;
