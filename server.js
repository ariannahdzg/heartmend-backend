const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createContact } = require('./hubspot');

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running 💙");
});

app.get("/mensaje", (req, res) => {
  res.json({
    mensaje: "Hola Arianna, este es tu backend hablando 🚀"
  });
});

app.post("/saludo", (req, res) => {
  const nombre = req.body.nombre;
  res.json({
    mensaje: `Hola ${nombre}, ahora el backend te responde personalizado 😎`
  });
});

app.post("/register", async (req, res) => {
  const { email, firstname, lastname } = req.body;

  await createContact({ email, firstname, lastname });

  res.json({ mensaje: "Usuario registrado y enviado a HubSpot ✅" });
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});