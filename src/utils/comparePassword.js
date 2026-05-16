import bcrypt from 'bcryptjs';

const comparePassword = async (password, userPassword) => {
  return bcrypt.compare(password, userPassword);
};

export default comparePassword;
