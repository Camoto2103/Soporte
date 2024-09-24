const express = require('express');
const path = require('path');
const objectRout = require('./rout.js');
const app = express();
const { verifyToken } = require('./rout.js'); 

app.use(express.static(path.join(__dirname, 'Public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/usuarios', objectRout);

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.get('/inicio', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'inicio.html'));
});

const port = 3001;

app.listen(port,()=>{
    console.log('FUNCIONA!');
});
