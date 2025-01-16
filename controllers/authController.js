const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new Error('Login inválido');
    }
    const isMatch = await bcrypt.compare(req.body.senha, user.senha);
    if (!isMatch) {
      throw new Error('Login inválido');
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};


exports.getProfile = async (req, res) => {
  try {
      // req.user is set by auth middleware after token verification
      const user = await User.findById(req.user.id)
          .select('-senha') // Exclude password
          .populate('id_igreja')
          .populate('id_distrito');

      if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      res.json(user);
  } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar perfil do usuário' });
  }
};
