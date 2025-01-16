const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Criar uma nova transação
exports.createTransaction = async (req, res) => {
    try {
        // Aqui, você não precisa mais buscar o id_distrito
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', errors: messages });
        }
        res.status(500).json({ message: 'Erro ao criar transação', error: error.message });
    }
};

// Listar todas as transações
exports.getAllTransactions = async (req, res) => {
    try {
        const { tipo, data_inicio, data_fim, id_usuario, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (tipo) filter.tipo = tipo.toLowerCase();
        if (data_inicio) filter.data = { $gte: new Date(data_inicio) };
        if (data_fim) {
            filter.data = filter.data || {};
            filter.data.$lte = new Date(data_fim);
        }
        if (id_usuario) filter.id_usuario = id_usuario;

        const transactions = await Transaction.find(filter)
            .populate('id_usuario', 'nome email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ data: -1 })
            .lean();

        const total = await Transaction.countDocuments(filter);

        const formattedTransactions = transactions.map(transacao => ({
            ...transacao,
            usuario: transacao.id_usuario ? transacao.id_usuario.nome : 'N/A',
            data: transacao.data ? transacao.data.toLocaleDateString('pt-BR') : 'Data Inválida'
        }));

        res.json({
            transactions: formattedTransactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalItems: total,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar transações', error: error.message });
    }
};

// Buscar uma transação específica pelo ID
exports.getTransactionById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de transação inválido' });
        }

        const transaction = await Transaction.findById(req.params.id)
            .populate('id_usuario', 'nome email')
            .lean();

        if (!transaction) {
            return res.status(404).json({ message: 'Transação não encontrada' });
        }

        const formattedTransaction = {
            ...transaction,
            usuario: transaction.id_usuario ? transaction.id_usuario.nome : 'N/A',
            data: transaction.data ? transaction.data.toLocaleDateString('pt-BR') : 'Data Inválida'
        };

        res.json(formattedTransaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar transação', error: error.message });
    }
};

// Atualizar uma transação
exports.updateTransaction = async (req, res) => {
    try {
        const { id_usuario, igreja, data, descricao, tipo, valor } = req.body;

        // Verifica se os IDs são válidos, se fornecidos
        if (id_usuario && !mongoose.Types.ObjectId.isValid(id_usuario)) {
            return res.status(400).json({ message: 'ID de usuário inválido' });
        }

        // Não é necessário validar id_igreja aqui, pois será uma string

        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            {
                id_usuario,
                igreja, // Atualiza com o nome da igreja
                data,
                descricao,
                tipo,
                valor
            },
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ message: 'Transação não encontrada' });
        }

        res.json(transaction);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', errors: messages });
        }
        res.status(500).json({ message: 'Erro ao atualizar transação', error: error.message });
    }
};

// Deletar uma transação
exports.deleteTransaction = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de transação inválido' });
        }

        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transação não encontrada' });
        }

        res.json({ message: 'Transação removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover transação', error: error.message });
    }
};

module.exports = exports;