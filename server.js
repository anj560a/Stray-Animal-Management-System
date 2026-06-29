const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- MySQL ----------------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Anjana562002@", // your MySQL password
  database: "stray_animals"
});

db.connect(err => {
  if(err) console.log("MySQL error:", err);
  else console.log("MySQL connected");
});

// ---------------- Nodemailer ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "youremail@gmail.com",   // your Gmail
    pass: "your_app_password"      // Gmail App Password
  }
});

transporter.verify((err, success) => {
  if(err) console.log("Email error:", err);
  else console.log("Email ready to send");
});

const sendOTP = (email, otp) => {
  transporter.sendMail({
    from: "youremail@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`
  }).catch(console.log);
};

// ---------------- AUTH ----------------

// Signup
app.post("/signup", (req,res)=>{
  const { username, password, role, email } = req.body;
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const otpExpires = Date.now() + 5*60*1000;

  db.query("SELECT * FROM users WHERE username=? OR email=?", [username,email], (err,result)=>{
    if(err) return res.json({success:false,error:err});
    if(result.length>0) return res.json({success:false,error:"User/email exists"});

    db.query("INSERT INTO users (username,password,role,email,otp,otp_expires,verified) VALUES (?,?,?,?,?,?,?)",
      [username,password,role,email,otp,otpExpires,0], (err2)=>{
        if(err2) return res.json({success:false,error:err2});
        sendOTP(email, otp);
        res.json({success:true,msg:"OTP sent to email"});
      });
  });
});

// Verify OTP
app.post("/verify-otp", (req,res)=>{
  const { username, otp } = req.body;
  db.query("SELECT * FROM users WHERE username=? AND otp=?", [username,otp], (err,result)=>{
    if(err) return res.json({success:false,error:err});
    if(result.length===0) return res.json({success:false,error:"Invalid OTP"});
    if(result[0].otp_expires < Date.now()) return res.json({success:false,error:"OTP expired"});

    db.query("UPDATE users SET verified=1, otp=NULL, otp_expires=NULL WHERE username=?", [username], (err2)=>{
      if(err2) return res.json({success:false,error:err2});
      res.json({success:true,msg:"Account verified"});
    });
  });
});

// Login
app.post("/login", (req,res)=>{
  const { username,password,role } = req.body;
  db.query("SELECT * FROM users WHERE username=? AND password=? AND role=?", [username,password,role], (err,result)=>{
    if(err) return res.json({success:false,error:err});
    if(result.length===0) return res.json({success:false,error:"Invalid credentials"});
    if(result[0].verified===0) return res.json({success:false,error:"Account not verified"});
    res.json({success:true,user:result[0]});
  });
});

// Forget password: send OTP
app.post("/forget-password", (req,res)=>{
  const { username } = req.body;
  db.query("SELECT * FROM users WHERE username=?", [username], (err,result)=>{
    if(err) return res.json({success:false,error:err});
    if(result.length===0) return res.json({success:false,error:"User not found"});

    const otp = Math.floor(100000 + Math.random()*900000).toString();
    const otpExpires = Date.now() + 5*60*1000;
    db.query("UPDATE users SET otp=?, otp_expires=? WHERE username=?", [otp,otpExpires,username], (err2)=>{
      if(err2) return res.json({success:false,error:err2});
      sendOTP(result[0].email, otp);
      res.json({success:true,msg:"OTP sent to email"});
    });
  });
});

// Reset password
app.post("/reset-password", (req,res)=>{
  const { username, otp, newPassword } = req.body;
  db.query("SELECT * FROM users WHERE username=? AND otp=?", [username,otp], (err,result)=>{
    if(err) return res.json({success:false,error:err});
    if(result.length===0) return res.json({success:false,error:"Invalid OTP"});
    if(result[0].otp_expires < Date.now()) return res.json({success:false,error:"OTP expired"});

    db.query("UPDATE users SET password=?, otp=NULL, otp_expires=NULL WHERE username=?", [newPassword,username], (err2)=>{
      if(err2) return res.json({success:false,error:err2});
      res.json({success:true,msg:"Password reset successful"});
    });
  });
});

// ---------------- ANIMALS ----------------
app.get("/animals",(req,res)=>{
  db.query("SELECT * FROM animals",(err,result)=> err?res.json([]):res.json(result));
});

app.post("/animal",(req,res)=>{
  const { id,type,breed,color,health,location,status,date_found } = req.body;
  if(id){
    db.query("UPDATE animals SET type=?,breed=?,color=?,health=?,location=?,status=?,date_found=? WHERE id=?",
      [type,breed,color,health,location,status,date_found,id], (err)=> err?res.json({success:false}):res.json({success:true}));
  } else {
    db.query("INSERT INTO animals (type,breed,color,health,location,status,date_found) VALUES (?,?,?,?,?,?,?)",
      [type,breed,color,health,location,status,date_found], (err)=> err?res.json({success:false}):res.json({success:true}));
  }
});

app.delete("/animal/:id",(req,res)=>{
  db.query("DELETE FROM animals WHERE id=?", [req.params.id], (err)=> err?res.json({success:false}):res.json({success:true}));
});

// ---------------- REPORTS ----------------
app.post("/report",(req,res)=>{
  const { name,type,location,description } = req.body;
  db.query("INSERT INTO reports (name,type,location,description,status) VALUES (?,?,?,?,?)", [name,type,location,description,'Submitted'], (err)=> err?res.json({success:false}):res.json({success:true}));
});

app.get("/reports",(req,res)=>{
  db.query("SELECT * FROM reports",(err,result)=> err?res.json([]):res.json(result));
});

app.post("/report/status",(req,res)=>{
  const { id,status } = req.body;
  db.query("UPDATE reports SET status=? WHERE id=?", [status,id], (err)=> err?res.json({success:false}):res.json({success:true}));
});

// ---------------- ADOPTIONS ----------------
app.post("/adopt",(req,res)=>{
  const { animal_name, requested_by, reason } = req.body;
  db.query("INSERT INTO adoptions (animal_name,requested_by,reason) VALUES (?,?,?)", [animal_name,requested_by,reason], (err)=> err?res.json({success:false}):res.json({success:true}));
});

app.get("/adoptions",(req,res)=>{
  db.query("SELECT * FROM adoptions",(err,result)=> err?res.json([]):res.json(result));
});

// ---------------- CONTACT ----------------
app.post("/contact",(req,res)=>{
  const { name,email,message } = req.body;
  db.query("INSERT INTO contacts (name,email,message) VALUES (?,?,?)", [name,email,message], (err)=> err?res.json({success:false}):res.json({success:true}));
});

// ---------------- START SERVER ----------------
app.listen(3000,()=>console.log("Server running on port 3000"));
