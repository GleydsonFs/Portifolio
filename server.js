const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const path = require("path");

// Carregar variáveis de ambiente
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuração do Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY || "",
    url: "https://api.mailgun.net"
});

// Configuração do banco de dados SQLite
const dbPath = path.join(__dirname, "email_backend", "src", "database", "app.db");
const db = new sqlite3.Database(dbPath);

// Criar tabela de usuários se não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        assunto TEXT,
        mensagem TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Rotas da API

// Rota para salvar usuário no banco
app.post("/api/users", (req, res) => {
    const { nome, email, telefone, assunto, mensagem } = req.body;
    
    if (!nome || !email || !mensagem) {
        return res.status(400).json({ 
            success: false, 
            message: "Nome, email e mensagem são obrigatórios" 
        });
    }
    
    const stmt = db.prepare(`INSERT INTO users (nome, email, telefone, assunto, mensagem) 
                            VALUES (?, ?, ?, ?, ?)`);
    
    stmt.run([nome, email, telefone, assunto, mensagem], function(err) {
        if (err) {
            console.error("Erro ao salvar usuário:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Erro interno do servidor" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Usuário salvo com sucesso",
            id: this.lastID 
        });
    });
    
    stmt.finalize();
});

// Rota para listar usuários
app.get("/api/users", (req, res) => {
    db.all("SELECT * FROM users ORDER BY created_at DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Erro interno do servidor" 
            });
        }
        
        res.json({ 
            success: true, 
            users: rows 
        });
    });
});

// Rota para envio de email usando Mailgun
app.post("/api/send-email", async (req, res) => {
    const { nome, email, telefone, assunto, mensagem } = req.body;
    
    if (!nome || !email || !mensagem) {
        return res.status(400).json({ 
            success: false, 
            message: "Nome, email e mensagem são obrigatórios" 
        });
    }
    
    try {
        // Primeiro, salvar no banco de dados
        const stmt = db.prepare(`INSERT INTO users (nome, email, telefone, assunto, mensagem) 
                                VALUES (?, ?, ?, ?, ?)`);
        
        stmt.run([nome, email, telefone, assunto, mensagem], function(err) {
            if (err) {
                console.error("Erro ao salvar no banco:", err);
            }
        });
        stmt.finalize();
        
        // Verificar se as configurações do Mailgun estão presentes
        if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
            console.log("Mailgun não configurado. Mensagem salva no banco de dados.");
            return res.json({ 
                success: true, 
                message: "Mensagem recebida com sucesso! (Mailgun não configurado - verifique as instruções)" 
            });
        }
        
        // Configurar o email
        const emailData = {
            from: `Portfólio <noreply@${process.env.MAILGUN_DOMAIN}>`,
            to: process.env.EMAIL_DESTINO || "seu-email@exemplo.com",
            subject: `Contato do Portfólio: ${assunto || "Sem assunto"}`,
            html: `
                <h2>Nova mensagem do portfólio</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone || "Não informado"}</p>
                <p><strong>Assunto:</strong> ${assunto || "Não informado"}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagem}</p>
                <hr>
                <p><small>Mensagem enviada através do formulário de contato do portfólio</small></p>
            `,
            "h:Reply-To": email
        };
        
        console.log("Tentando enviar e-mail com Mailgun...");
        console.log("Dados do e-mail:", emailData);

        // Enviar email via Mailgun
        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
        
        console.log("Resposta do Mailgun:", response);
        
        if (response.id) {
            res.json({ 
                success: true, 
                message: "Mensagem enviada com sucesso! Em breve entraremos em contato." 
            });
        } else {
            console.error("Erro no envio do Mailgun (sem ID de resposta):");
            console.error("Resposta:", response);
            res.status(500).json({ 
                success: false, 
                message: "Erro ao enviar e-mail (verifique o console do servidor para detalhes)." 
            });
        }
        
    } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        
        // Se o erro for do Mailgun, ainda assim confirma que a mensagem foi salva
        if (error.status && error.status >= 400) {
            console.error("Detalhes do erro do Mailgun:", error.details || error.message);
            return res.json({ 
                success: true, 
                message: "Mensagem recebida com sucesso! (Erro no envio de email - verifique a configuração do Mailgun)" 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Erro interno do servidor" 
        });
    }
});

// Servir arquivos estáticos
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    
    // Verificar configurações
    if (!process.env.MAILGUN_API_KEY) {
        console.log("⚠️  ATENÇÃO: Mailgun API Key não configurada");
        console.log("   Configure as variáveis de ambiente para envio de emails");
    }
    if (!process.env.MAILGUN_DOMAIN) {
        console.log("⚠️  ATENÇÃO: Mailgun Domain não configurado");
        console.log("   Configure as variáveis de ambiente para envio de emails");
    }
    if (!process.env.EMAIL_DESTINO) {
        console.log("⚠️  ATENÇÃO: Email de destino não configurado");
    }
});

// Fechar conexão com banco ao encerrar aplicação
process.on("SIGINT", () => {
    db.close((err) => {
        if (err) {
            console.error("Erro ao fechar banco de dados:", err);
        } else {
            console.log("Conexão com banco de dados fechada.");
        }
        process.exit(0);
    });
});

