const Participant = require('../models/Participant');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const pdfMake = require('pdfmake');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validação de variáveis de ambiente
const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_APP_PASSWORD'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Variável de ambiente ${varName} não definida.`);
    }
});

// Configuração do Nodemailer com tratamento de erros
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verifica a conexão do Nodemailer
transporter.verify().then(() => {
    console.log('Conexão com o servidor de email estabelecida.');
}).catch(err => {
    console.error('Erro ao conectar ao servidor de email:', err);
    throw new Error('Falha na conexão com o servidor de email.');
});

// Função para gerar o ID do participante (com tratamento de erros)
async function generateParticipantId() {
    const year = new Date().getFullYear();
    try {
        const lastParticipant = await Participant.findOne({ id_participante: { $regex: `^DI${year}` } }, {}, { sort: { 'id_participante': -1 } }).lean();
        let nextNumber = '0001';
        if (lastParticipant) {
            const lastNumber = parseInt(lastParticipant.id_participante.slice(-4), 10);
            nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        }
        return `DI${year}${nextNumber}`;
    } catch (error) {
        console.error('Erro ao gerar ID do participante:', error);
        throw new Error('Falha ao gerar ID do participante.');
    }
}

// Função auxiliar para calcular a idade (implementação robusta)
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Função para formatar a data (DD/MM/YYYY)
function formatDate(date) {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Enviar e-mail de confirmação de cadastro (com tratamento de erros mais detalhado)
async function sendConfirmationEmail(participant) {
    try {
        const dataNascimentoFormatada = formatDate(new Date(participant.nascimento));
        let info = await transporter.sendMail({
            from: `"Inscrição Ipitinga" <${process.env.EMAIL_USER}>`,
            to: participant.email,
            subject: 'Confirmação de inscrição',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4361ee; text-align: center;">Confirmação de Cadastro</h2>
                    <p style="font-size: 16px;">Olá, <strong>${participant.nome}</strong>!</p>
                    <p style="font-size: 16px;">Sua inscrição foi realizada com sucesso.</p>
                    <p style="font-size: 16px;">Confira os detalhes de sua inscrição:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>Nome:</strong> ${participant.nome}</li>
                        <li style="margin-bottom: 10px;"><strong>Idade:</strong> ${participant.idade}</li>
                        <li style="margin-bottom: 10px;"><strong>Data de Nascimento:</strong> ${dataNascimentoFormatada}</li>
                        <li style="margin-bottom: 10px;"><strong>Igreja:</strong> ${participant.igreja ? participant.igreja.nome : 'N/A'}</li> </ul>
                    <p style="font-size: 16px;">Aguarde a confirmação de seu pagamento!</p>
                </div>
            `
        });
        console.log('E-mail de confirmação enviado: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação:', error);
        throw new Error(`Erro ao enviar e-mail de confirmação: ${error.message} - Código de erro: ${error.responseCode}`);
    }
}

// Enviar e-mail de confirmação de pagamento (com tratamento de erros)
async function sendPaymentConfirmationEmail(participant) {
    try {
        let info = await transporter.sendMail({
            from: `"Inscrição Ipitinga" <${process.env.EMAIL_USER}>`,
            to: participant.email,
            subject: 'Confirmação de Pagamento',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4361ee; text-align: center;">Confirmação de Pagamento</h2>
                    <p style="font-size: 16px;">Olá, <strong>${participant.nome}</strong>!</p>
                    <p style="font-size: 16px;">Seu pagamento foi confirmado com sucesso!</p>
                    <p style="font-size: 16px;">Obrigado!</p>
                    <p style="font-size: 16px; text-align: center; margin-top: 30px;">
                        <a href="#" style="background-color: #4361ee; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar o Sistema</a>
                    </p>
                </div>
            `
        });
        console.log('E-mail de confirmação de pagamento enviado: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação de pagamento:', error);
        throw new Error(`Erro ao enviar e-mail de confirmação de pagamento: ${error.message}`);
    }
}

// Criar um novo participante (público, sem autenticação)
exports.createPublicParticipant = async (req, res) => {
    try {
        const { nome, email, nascimento, igreja } = req.body;

        if (!nome || !email || !nascimento || !igreja) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const igrejaObj = await mongoose.model('Igreja').findById(igreja); // Find church by ID
        if (!igrejaObj) {
            return res.status(404).json({ message: 'Igreja não encontrada.' });
        }

        const id_participante = await generateParticipantId();
        const participant = new Participant({
            id_participante,
            nome,
            email,
            nascimento: new Date(nascimento), // Ensure nascimento is a Date object
            idade: calculateAge(nascimento),
            igreja: igrejaObj._id, // Use the church object ID
        });


        await participant.save();
        const emailResult = await sendConfirmationEmail(participant);
        res.status(201).json({ participant, emailSent: emailResult });
    } catch (error) {
        console.error('Erro:', error);
        const isValidationError = error.name === 'ValidationError';
        const statusCode = isValidationError ? 400 : 500;
        const errorMessage = isValidationError ? error.message : 'Erro ao criar participante';
        res.status(statusCode).json({ message: errorMessage, error: error.message });
    }
};


// Criar um novo participante (comum)
exports.createParticipant = async (req, res) => {
    try {
        const id_participante = await generateParticipantId();
        const participant = new Participant({ ...req.body, id_participante, nascimento: new Date(req.body.nascimento) });
        await participant.save();
        await sendConfirmationEmail(participant);
        res.status(201).json(participant);
    } catch (error) {
        console.error('Erro:', error);
        const isValidationError = error.name === 'ValidationError';
        const statusCode = isValidationError ? 400 : 500;
        const errorMessages = isValidationError ? Object.values(error.errors).map(e => e.message) : [error.message];
        res.status(statusCode).json({ message: 'Erro ao criar participante', errors: errorMessages });
    }
};

// Listar todos os participantes
exports.getAllParticipants = async (req, res) => {
    try {
        const { igreja } = req.query;
        const query = {};
        if (igreja) {
            query.igreja = igreja;
        }
        const participants = await Participant.find(query).populate('igreja').lean();
        const formattedParticipants = participants.map(participant => ({
            ...participant,
            nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : null,
            data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)) : null,
            data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : null,
            igreja: participant.igreja ? participant.igreja.nome : null // Assuming igreja has a 'nome' field
        }));
        res.json(formattedParticipants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar participantes', error: error.message });
    }
};

exports.getParticipantById = async (req, res) => {
    try {
        const participant = await Participant.findOne({ id_participante: req.params.id_participante }).populate('igreja').lean();
        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' });
        }
        const formattedParticipant = {
            ...participant,
            nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : null,
            data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)) : null,
            data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : null,
            igreja: participant.igreja ? participant.igreja.nome : null // Assuming igreja has a 'nome' field

        };
        res.json(formattedParticipant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar participante', error: error.message });
    }
};

// Atualizar um participante
exports.updateParticipant = async (req, res) => {
    try {
        const { igreja } = req.body;
        const updateData = { ...req.body };
        if (igreja && (typeof igreja !== 'string' || igreja.trim() === '')) {
            return res.status(400).json({ message: "O nome da igreja fornecido é inválido." });
        }
        if (igreja === undefined) {
            delete updateData.igreja;
        }
        if(updateData.nascimento) updateData.nascimento = new Date(updateData.nascimento); //Ensure nascimento is a date object

        const participant = await Participant.findOneAndUpdate(
            { id_participante: req.params.id_participante },
            updateData,
            { new: true, runValidators: true }
        );
        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' });
        }
        res.json(participant);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', errors: messages });
        }
        res.status(500).json({ message: 'Erro ao atualizar participante', error: error.message });
    }
};

// Confirmação de pagamento
exports.confirmarPagamento = async (req, res) => {
    try {
        const participant = await Participant.findOneAndUpdate(
            { id_participante: req.params.id_participante },
            { data_confirmacao: new Date() },
            { new: true }
        );
        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' });
        }
        await sendPaymentConfirmationEmail(participant);
        res.json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao confirmar pagamento', error: error.message });
    }
};

// Cancelamento da confirmação de pagamento
exports.unconfirmPayment = async (req, res) => {
    try {
        const participant = await Participant.findOneAndUpdate(
            { id_participante: req.params.id_participante },
            { data_confirmacao: null },
            { new: true }
        );
        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' });
        }
        res.json({ message: 'Confirmação de pagamento cancelada com sucesso', participant });
    } catch (error) {
        console.error('Erro ao cancelar confirmação de pagamento:', error);
        res.status(500).json({ message: 'Erro ao cancelar confirmação de pagamento', error: error.message });
    }
};

// Deletar um participante
exports.deleteParticipant = async (req, res) => {
    try {
        const participant = await Participant.findOneAndDelete({ id_participante: req.params.id_participante });
        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' });
        }
        res.json({ message: 'Participante removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover participante', error: error.message });
    }
};

exports.generatePdf = async (req, res) => {
    try {
        const { igreja } = req.query;
        const query = {};
        if (igreja) {
            query.igreja = igreja;
        }
        const participants = await Participant.find(query).populate('igreja').lean();

        const formattedParticipants = participants.map(participant => ({
            ...participant,
            nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : 'N/A',
            data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)) : 'N/A',
            data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : 'N/A',
            igreja: participant.igreja ? participant.igreja.nome : 'N/A'
        }));

        const fonts = {
            Roboto: {
                normal: path.join(__dirname, '..', 'assets', 'Roboto-Regular.ttf'),
                bold: path.join(__dirname, '..', 'assets', 'Roboto-Medium.ttf'),
                italics: path.join(__dirname, '..', 'assets', 'Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '..', 'assets', 'Roboto-BoldItalic.ttf')
            }
        };
        const printer = new pdfMake({ fonts });

        const docDefinition = {
            content: [
                { text: 'Lista de Participantes', style: 'header' },
                {
                    table: {
                        body: [
                            [
                                { text: 'ID', style: 'tableHeader' },
                                { text: 'Nome', style: 'tableHeader' },
                                { text: 'Data de Nascimento', style: 'tableHeader' },
                                { text: 'Idade', style: 'tableHeader' },
                                { text: 'Igreja', style: 'tableHeader' },
                                { text: 'Data de Inscrição', style: 'tableHeader' },
                                { text: 'Data de Confirmação', style: 'tableHeader' },
                            ],
                            ...formattedParticipants.map(participant => [
                                participant.id_participante,
                                participant.nome,
                                participant.nascimento,
                                participant.idade,
                                participant.igreja,
                                participant.data_inscricao,
                                participant.data_confirmacao,
                            ])
                        ]
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 20],
                    alignment: 'center'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    fillColor: '#f0f0f0',
                    alignment: 'center',
                }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition, {});
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="participantes-${igreja || 'todos'}.pdf"`);
            res.send(result);
        });
        pdfDoc.on('error', err => {
            console.error('Erro ao gerar PDF:', err);
            res.status(500).json({ message: 'Erro ao gerar PDF', error: err.message });
        });
        pdfDoc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ message: 'Erro ao gerar PDF', error: error.message });
    }
};

module.exports = exports;
