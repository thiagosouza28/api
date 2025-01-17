const Participant = require('../models/Participant');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const pdfMake = require('pdfmake');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Função para gerar o ID do participante
async function generateParticipantId() {
    const year = new Date().getFullYear();
    const lastParticipant = await Participant.findOne({ id_participante: { $regex: `^DI${year}` } }, {}, { sort: { 'id_participante': -1 } });
    let nextNumber = '0001';
    if (lastParticipant) {
        const lastNumber = parseInt(lastParticipant.id_participante.slice(-4), 10);
        nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    }
    return `DI${year}${nextNumber}`;
}

// Função auxiliar para calcular a idade (implementação básica)
function calculateAge(dateOfBirth) {
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Enviar e-mail de confirmação de cadastro
async function sendConfirmationEmail(participant) {
    try {
        const dataNascimentoFormatada = formatDate(new Date(participant.nascimento));

        let info = await transporter.sendMail({
            from: `"Inscrição Ipatinga" <${process.env.EMAIL_USER}>`,
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
                        <li style="margin-bottom: 10px;"><strong>Igreja:</strong> ${participant.igreja}</li>
                    </ul>
                    <p style="font-size: 16px;">Obrigado por se cadastrar!</p>
                    <p style="font-size: 16px; text-align: center; margin-top: 30px;">
                        <a href="#" style="background-color: #4361ee; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar o Sistema</a>
                    </p>
                </div>
            `
        });
        console.log('E-mail de confirmação enviado: %s', info.messageId);
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação:', error);
        throw new Error('Erro ao enviar e-mail de confirmação: ' + error.message);
    }
}

// Enviar e-mail de confirmação de pagamento
async function sendPaymentConfirmationEmail(participant) {
    try {
        let info = await transporter.sendMail({
            from: `"Inscrição Ipatinga" <${process.env.EMAIL_USER}>`,
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
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação de pagamento:', error);
        throw new Error('Erro ao enviar e-mail de confirmação de pagamento: ' + error.message);
    }
}


// Criar um novo participante (público, sem autenticação)
exports.createPublicParticipant = async (req, res) => {
    try {
        const { nome, email, nascimento, igreja } = req.body;

        if (!igreja || typeof igreja !== 'string' || igreja.trim() === '') {
            return res.status(400).json({ message: "O nome da igreja é obrigatório e deve ser uma string não vazia." });
        }

        const id_participante = await generateParticipantId();
        const participant = new Participant({
            id_participante,
            nome,
            email,
            nascimento,
            idade: calculateAge(nascimento),
            igreja,
        });

        await participant.save();
        await sendConfirmationEmail(participant);

        res.status(201).json(participant);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
           const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', errors: messages });
        }
        res.status(500).json({ message: 'Erro ao criar participante', error: error.message });
    }
};


// Criar um novo participante (comum)
exports.createParticipant = async (req, res) => {
    try {
        const id_participante = await generateParticipantId();
        const participant = new Participant({ ...req.body, id_participante });
         await participant.save();

        await sendConfirmationEmail(participant);

         res.status(201).json(participant);
    } catch (error) {
        console.error(error);
       if (error.name === 'ValidationError') {
           const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', errors: messages });
       }
        res.status(500).json({ message: 'Erro ao criar participante', error: error.message });
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

        const participants = await Participant.find(query)
          .lean();


       const formattedParticipants = participants.map(participant => ({
            ...participant,
            nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : null,
            data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)): null,
            data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : null
        }));
        res.json(formattedParticipants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar participantes', error: error.message });
    }
};

exports.getParticipantById = async (req, res) => {
    try {
        const participant = await Participant.findOne({ id_participante: req.params.id_participante })
           .lean();

        if (!participant) {
           return res.status(404).json({ message: 'Participante não encontrado' });
       }

       const formattedParticipant = {
           ...participant,
            nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : null,
             data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)): null,
             data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : null
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
        res
           .status(500)
           .json({ message: 'Erro ao atualizar participante', error: error.message });
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

         const participants = await Participant.find(query).lean();
         const formattedParticipants = participants.map(participant => ({
            ...participant,
             nascimento: participant.nascimento ? formatDate(new Date(participant.nascimento)) : 'N/A',
           data_inscricao: participant.data_inscricao ? formatDate(new Date(participant.data_inscricao)) : 'N/A',
             data_confirmacao: participant.data_confirmacao ? formatDate(new Date(participant.data_confirmacao)) : 'N/A',
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
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
         pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="participantes-${igreja || 'todos'}.pdf"`);
            res.send(result);
          });
        pdfDoc.end();
   } catch (error) {
          console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ message: 'Erro ao gerar PDF', error: error.message });
    }
};

module.exports = exports;
