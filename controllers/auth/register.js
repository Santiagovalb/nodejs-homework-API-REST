const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const { v4 } = require("uuid");
const { basedir } = global;
const { User, schemas } = require(`${basedir}/models/user`);
const { createError, sendEmail } = require(`${basedir}/helpers`);

const register = async (req, res) => {
    const { error } = schemas.register.validate(req.body);
    if (error) {
        throw createError(400, error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
        throw createError(409, 'Email in use')
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = v4();

    const result = await User.create({ ...req.body, password: hashPassword, avatarURL, verificationToken });
    
    const mail = {
        to: email,
        subject: "Verification email",
        html: `<a target="_blank" href="http://localhost:3000/api/auth/verify/${verificationToken}">Click to confirm registration</a>`,
    }

    await sendEmail(mail);
    
    res.status(201).json({
        user: {
            email: result.email,
            subscription: result.subscription,
        },
    });
}

module.exports = register;