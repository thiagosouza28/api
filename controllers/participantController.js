const Participant = require('../models/Participant');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const pdfMake = require('pdfmake');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const Church = require('../models/Church');
require('dotenv').config();
const authMiddleware = require('../middlewares/authMiddleware');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // Remove this in production! Use a proper SSL certificate.
    }
});

// Function to generate participant ID
async function generateParticipantId() {
    const year = new Date().getFullYear();
    let nextNumber;

    try {
        const lastParticipant = await Participant.findOne({ id_participante: { $regex: `^DI${year}` } })
            .sort({ id_participante: -1 })
            .lean();

        nextNumber = lastParticipant ? parseInt(lastParticipant.id_participante.slice(-4), 10) + 1 : 1;
        nextNumber = nextNumber.toString().padStart(4, '0');
    } catch (error) {
        console.error("Error generating ID:", error);
        return `DI${year}0001`;
    }
    return `DI${year}${nextNumber}`;
}

// Helper function to calculate age
function calculateAge(dateOfBirth) {
    const birthDate = DateTime.fromISO(dateOfBirth);
    const now = DateTime.now();
    return now.diff(birthDate, 'years').years;
}

// Function to format date
function formatDate(date) {
    return DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
}

// Send confirmation email
async function sendConfirmationEmail(participant) {
    try {
        const dataNascimentoFormatada = formatDate(participant.nascimento);
        const linkAcesso = `https://api-ckry.onrender.com/api/participante/${participant.id_participante}`; // Replace with your actual URL

        await transporter.sendMail({
            from: `"Inscrição Ipitinga" <${process.env.EMAIL_USER}>`,
            to: participant.email,
            subject: 'Confirmação de Cadastro',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4361ee; text-align: center;">Confirmação de Cadastro</h2>
                    <p style="font-size: 16px;">Olá, <strong>${participant.nome}</strong>!</p>
                    <p style="font-size: 16px;">Seu cadastro como participante foi realizado com sucesso.</p>
                    <p style="font-size: 16px;">Confira os detalhes do seu cadastro:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>Nome:</strong> ${participant.nome}</li>
                        <li style="margin-bottom: 10px;"><strong>Idade:</strong> ${participant.idade}</li>
                        <li style="margin-bottom: 10px;"><strong>Data de Nascimento:</strong> ${dataNascimentoFormatada}</li>
                        <li style="margin-bottom: 10px;"><strong>Igreja:</strong> ${participant.igreja || 'N/A'}</li>
                    </ul>
                    <p style="font-size: 16px;">Obrigado por se cadastrar!</p>
                    <p style="font-size: 16px; text-align: center; margin-top: 30px;">
                        <a href="${linkAcesso}" style="background-color: #4361ee; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar o Sistema</a>
                    </p>
                </div>
            `
        });
        console.log('Email de confirmação enviado para:', participant.email);
    } catch (error) {
        console.error('Erro ao enviar email de confirmação:', error);
        throw new Error(`Erro ao enviar email de confirmação: ${error.message}`);
    }
}
// Function to handle errors
function handleError(res, error, defaultMessage) {
    console.error(defaultMessage, error);
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';

    if (error.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Erro de validação: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
        statusCode = 409; //Conflict
        errorMessage = 'Já existe um participante com este endereço de e-mail.';
    } else if (error.message.includes('Igreja inválida')) {
        statusCode = 400;
        errorMessage = 'Igreja inválida';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        errorMessage = 'Tipo de dado inválido para algum campo.';
    } else if (error.name === 'DocumentNotFoundError'){
        statusCode = 404;
        errorMessage = 'Recurso não encontrado';
    }

    res.status(statusCode).json({ message: errorMessage, errors: error.errors || [] });
}

// Create participant WITHOUT authentication
exports.createParticipantUnAuth = async (req, res) => {
    try {
        const { nome, email, nascimento, igrejaId } = req.body;

        if (!nome || !email || !nascimento || !igrejaId) {
            throw new Error('Todos os campos são obrigatórios.');
        }

        //Check if email already exists
        const existingParticipant = await Participant.findOne({ email });
        if (existingParticipant) {
            throw new Error('Já existe um participante com este e-mail.');
        }

        const church = await Church.findById(igrejaId);
        if (!church) {
            throw new Error('Igreja inválida.');
        }

        const id_participante = await generateParticipantId();
        const participant = new Participant({
            id_participante,
            nome,
            email,
            nascimento: DateTime.fromISO(nascimento).toJSDate(),
            idade: calculateAge(nascimento),
            igreja: church.nome, 
        });

        await participant.save();
        await sendConfirmationEmail(participant);
        res.status(201).json(participant);
    } catch (error) {
        handleError(res, error, 'Erro ao criar participante (sem autenticação)');
    }
};

const createParticipant = async (req, res, authenticated = false) => {
    try {
        console.log(`Received Request Body (${authenticated ? 'Auth' : 'UnAuth'}):`, req.body);
        const { nome, email, nascimento, igrejaId } = req.body;

        if (!nome || !email || !nascimento || !igrejaId) {
            throw new Error(`Todos os campos são obrigatórios. Dados recebidos: ${JSON.stringify(req.body)}`);
        }

        const existingParticipant = await Participant.findOne({ email });
        if (existingParticipant) {
            return res.status(409).json({ message: 'Já existe um participante com este e-mail.' });
        }

        const church = await Church.findById(igrejaId);
        if (!church) {
            return res.status(404).json({ message: 'Igreja não encontrada.' });
        }

        const id_participante = await generateParticipantId();
        const participant = new Participant({
            id_participante,
            nome,
            email,
            nascimento: DateTime.fromISO(nascimento).toJSDate(),
            idade: calculateAge(nascimento),
            igreja: church.nome,  // Store the church name
        });


        await participant.save();
        await sendConfirmationEmail(participant);

        res.status(201).json(participant);

    } catch (error) {
        handleError(res, error, `Erro ao criar participante (${authenticated ? 'com' : 'sem'} autenticação)`, req.body);
    }
};

exports.createParticipantAuth = (req, res) => createParticipant(req, res, true);
exports.createParticipantUnAuth = (req, res) => createParticipant(req, res, false);

// Update participant
exports.updateParticipant = async (req, res) => {
    try {
        const { id_participante } = req.params;
        const updateData = { ...req.body };

        if (updateData.hasOwnProperty('igrejaId')) {
            const church = await Church.findById(updateData.igrejaId);
            if (church) {
                updateData.igreja = church.nome; 
            } else {
                updateData.igreja = null; 
            }
            delete updateData.igrejaId; 
        }

        const participant = await Participant.findOneAndUpdate(
            { id_participante },
            updateData,
            { new: true, runValidators: true }
        );

        if (!participant) {
            return res.status(404).json({ message: 'Participante não encontrado' }); 
        }

        res.json(participant);
    } catch (error) {
        handleError(res, error, 'Erro ao atualizar participante', req.body);
    }
};

// Confirm payment
exports.confirmarPagamento = async (req, res) => {
    try {
        const { id_participante } = req.params;
        const participant = await Participant.findOneAndUpdate(
            { id_participante },
            { data_confirmacao: new Date() },
            { new: true }
        );

        if (!participant) {
            throw new Error('Participante não encontrado');
        }

        await sendPaymentConfirmationEmail(participant);
        res.json(participant);
    } catch (error) {
        handleError(res, error, 'Erro ao confirmar pagamento');
    }
};

// Cancel payment confirmation
exports.unconfirmPayment = async (req, res) => {
    try {
        const { id_participante } = req.params;
        const participant = await Participant.findOneAndUpdate(
            { id_participante },
            { data_confirmacao: null },
            { new: true }
        );

        if (!participant) {
            throw new Error('Participante não encontrado');
        }

        res.json({ message: 'Confirmação de pagamento cancelada com sucesso', participant });
    } catch (error) {
        handleError(res, error, 'Erro ao cancelar confirmação de pagamento');
    }
};

// Delete participant
exports.deleteParticipant = async (req, res) => {
    try {
        const { id_participante } = req.params;
        const participant = await Participant.findOneAndDelete({ id_participante });

        if (!participant) {
            throw new Error('Participante não encontrado');
        }

        res.json({ message: 'Participante removido com sucesso' });
    } catch (error) {
        handleError(res, error, 'Erro ao remover participante');
    }
};

// Generate PDF
exports.generatePdf = async (req, res) => {
    try {
        const { igreja } = req.query;
        const query = igreja ? { igreja } : {};
        const participants = await Participant.find(query).lean();

        const formattedParticipants = participants.map(p => ({
            ...p,
            nascimento: p.nascimento ? formatDate(p.nascimento) : 'N/A',
            data_inscricao: p.data_inscricao ? formatDate(p.data_inscricao) : 'N/A',
            data_confirmacao: p.data_confirmacao ? formatDate(p.data_confirmacao) : 'N/A',
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
                            [{ text: 'ID', style: 'tableHeader' },
                            { text: 'Nome', style: 'tableHeader' },
                            { text: 'Data de Nascimento', style: 'tableHeader' },
                            { text: 'Idade', style: 'tableHeader' },
                            { text: 'Igreja', style: 'tableHeader' },
                            { text: 'Data de Inscrição', style: 'tableHeader' },
                            { text: 'Data de Confirmação', style: 'tableHeader' }],
                            ...formattedParticipants.map(p => [
                                p.id_participante,
                                p.nome,
                                p.nascimento,
                                p.idade,
                                p.igreja || 'N/A',
                                p.data_inscricao,
                                p.data_confirmacao
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
                    alignment: 'center'
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
        pdfDoc.end();
    } catch (error) {
        handleError(res, error, 'Erro ao gerar PDF');
    }
};

module.exports = exports;
