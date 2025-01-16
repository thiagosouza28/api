const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Listar todos os usuários
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .populate('id_igreja', 'nome') // Retorna apenas o nome da igreja
            .populate('id_distrito', 'nome') // Retorna apenas o nome do distrito
            .lean(); // Converte para um objeto simples do JavaScript para podermos modificar

        const formattedUsers = users.map(user => ({
            ...user,
            igreja: user.id_igreja ? user.id_igreja.nome : null,
            distrito: user.id_distrito ? user.id_distrito.nome : null,
            id_igreja: undefined,
            id_distrito: undefined,
        }));

        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
};

// Buscar um usuário por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('id_igreja', 'nome') // Retorna apenas o nome da igreja
            .populate('id_distrito', 'nome') // Retorna apenas o nome do distrito
            .lean(); // Converte para objeto do Javascript

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

       const formattedUser = {
            ...user,
            igreja: user.id_igreja ? user.id_igreja.nome : null,
            distrito: user.id_distrito ? user.id_distrito.nome : null,
            id_igreja: undefined,
            id_distrito: undefined,
        };

        res.status(200).json(formattedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
};

// Criar um novo usuário
exports.createUser = async (req, res) => {
    try {
        const { nome, email, senha, cargo, id_igreja, id_distrito } = req.body;

        // Verificar se o e-mail já está cadastrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'E-mail já cadastrado' });
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Criar o usuário
        const newUser = new User({
            nome,
            email,
            senha: hashedPassword,
            cargo,
            id_igreja,
            id_distrito
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuário criado com sucesso', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar usuário' });
    }
};

// Atualizar um usuário
exports.updateUser = async (req, res) => {
    try {
        const { nome, email, senha, cargo, id_igreja, id_distrito } = req.body;

        // Buscar o usuário pelo ID
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Atualizar os campos
        user.nome = nome || user.nome;
        user.email = email || user.email;
        user.cargo = cargo || user.cargo;
        user.id_igreja = id_igreja || user.id_igreja;
        user.id_distrito = id_distrito || user.id_distrito;

        // Atualizar a senha se fornecida
        if (senha) {
            user.senha = await bcrypt.hash(senha, 10);
        }

        await user.save();
        res.status(200).json({ message: 'Usuário atualizado com sucesso', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
};


// Deletar um usuário
exports.deleteUser = async (req, res) => {
  try {
     const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

     await User.deleteOne({ _id: req.params.id });
     res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
       console.error(error);
       res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
};