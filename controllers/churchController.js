const Church = require('../models/Church');
const mongoose = require('mongoose');

// Função auxiliar para validar ObjectId
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Criar uma nova igreja
exports.createChurch = async (req, res) => {
    try {
        if (!req.body.nome) {
            return res.status(400).json({ error: 'O campo nome é obrigatório' });
        }

        const church = new Church(req.body);
        await church.save();
        res.status(201).json(church);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Erro de validação', message: error.message });
        } else {
            res.status(500).json({ error: 'Erro ao criar igreja', message: error.message });
        }
    }
};

// Buscar todas as igrejas
exports.getAllChurches = async (req, res) => {
    try {
        const churches = await Church.find();
        res.json(churches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar igrejas', message: error.message });
    }
};

// Buscar uma igreja específica pelo ID
exports.getChurchById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID da igreja inválido' });
        }

        const church = await Church.findById(req.params.id);
        if (!church) {
            return res.status(404).json({ error: 'Igreja não encontrada' });
        }
        res.json(church);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar igreja', message: error.message });
    }
};

// Atualizar uma igreja
exports.updateChurch = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID da igreja inválido' });
        }

        if (!req.body.nome) {
            return res.status(400).json({ error: 'O campo nome é obrigatório para atualização' });
        }

        // Validação adicional: verifica se os campos são do tipo correto
        if (req.body.nome && typeof req.body.nome !== 'string') {
            return res.status(400).json({ error: 'O campo nome deve ser uma string' });
        }

        const church = await Church.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!church) {
            return res.status(404).json({ error: 'Igreja não encontrada' });
        }
        res.json(church);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Erro de validação', message: error.message });
        } else {
            res.status(500).json({ error: 'Erro ao atualizar igreja', message: error.message });
        }
    }
};

// Deletar uma igreja
exports.deleteChurch = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID da igreja inválido' });
        }

        const church = await Church.findByIdAndDelete(req.params.id);
        if (!church) {
            return res.status(404).json({ error: 'Igreja não encontrada' });
        }
        res.json({ message: 'Igreja removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover igreja', message: error.message });
    }
};

module.exports = exports;