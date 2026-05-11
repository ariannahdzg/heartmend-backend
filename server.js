const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pendingUsers = {};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── REGISTRO: genera token y manda email ──
app.post("/api/register", async (req, res) => {
  const { email, firstname, lastname, lang } = req.body;

  if (!email || !firstname) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  pendingUsers[token] = { email, firstname, lastname, lang, createdAt: Date.now() };

  const confirmUrl = `https://heartmend-backend.onrender.com/confirm?token=${token}`;

  const isEs = lang === "es";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;">
      <h2 style="color:#3b82f6;">💙 ${isEs ? `Bienvenido/a a HeartMend, ${firstname}` : `Welcome to HeartMend, ${firstname}`}</h2>
      <p>${isEs ? "Haz clic en el botón para confirmar tu cuenta:" : "Click the button below to confirm your account:"}</p>
      <a href="${confirmUrl}" 
         style="display:inline-block;padding:0.85rem 1.5rem;background:#3b82f6;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">
        ${isEs ? "Confirmar mi cuenta →" : "Confirm my account →"}
      </a>
      <p style="color:#94a3b8;font-size:0.8rem;margin-top:1.5rem;">
        ${isEs 
          ? "Este link expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje." 
          : "This link expires in 24 hours. If you didn't create this account, ignore this email."}
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"HeartMend 💙" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: isEs ? "Confirma tu cuenta en HeartMend" : "Confirm your HeartMend account",
      html,
    });

    res.json({ ok: true, mensaje: isEs ? "Email de confirmación enviado ✅" : "Confirmation email sent ✅" });
  } catch (error) {
    console.error("Error enviando email:", error);
    res.status(500).json({ error: isEs ? "No se pudo enviar el email." : "Could not send the email." });
  }
});

// ── CONFIRMACIÓN: valida el token ──
app.get("/confirm", (req, res) => {
  const { token } = req.query;
  const user = pendingUsers[token];

  if (!user) {
    return res.send(`
      <h2 style="font-family:sans-serif;color:#ef4444;">
        ❌ ${user?.lang === "es" ? "Link inválido o expirado." : "Invalid or expired link."}
      </h2>
    `);
  }

  const isEs = user.lang === "es";
  const age = Date.now() - user.createdAt;

  if (age > 24 * 60 * 60 * 1000) {
    delete pendingUsers[token];
    return res.send(`
      <h2 style="font-family:sans-serif;color:#ef4444;">
        ❌ ${isEs ? "Este link expiró. Regístrate de nuevo." : "This link has expired. Please register again."}
      </h2>
    `);
  }

  delete pendingUsers[token];

  res.send(`
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;text-align:center;">
      <h2 style="color:#3b82f6;">💙 ${isEs ? "¡Cuenta confirmada!" : "Account confirmed!"}</h2>
      <p>${isEs ? `Bienvenido/a ${user.firstname}. Ya puedes usar HeartMend.` : `Welcome ${user.firstname}. You can now use HeartMend.`}</p>
      <a href="https://qx5n7y.csb.app" 
         style="display:inline-block;padding:0.85rem 1.5rem;background:#3b82f6;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">
        ${isEs ? "Ir a HeartMend →" : "Go to HeartMend →"}
      </a>
    </div>
  `);
});

// ── CHAT ──
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    res.json({
      content: [{ text: data.choices?.[0]?.message?.content || "I'm here for you 💙" }],
    });
  } catch (error) {
    res.status(500).json({ error: "Chat error" });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log("Server running on port " + (process.env.PORT || 3001));
});