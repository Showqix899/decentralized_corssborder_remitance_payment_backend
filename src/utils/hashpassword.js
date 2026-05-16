import bcrypt from 'bcryptjs';

// hash password
export const hashPassword = async (rawPass) => {
  // salt password
  const salt = await bcrypt.genSalt(10);
  // hash password
  const hashedPassword = await bcrypt.hash(rawPass, salt);

  // FIX: Return the variable, not the function name!
  return hashedPassword;
};
