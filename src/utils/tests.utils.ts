const allowed = {
  uppers: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  lowers: 'qwertyuiopasdfghjklzxcvbnm',
  numbers: '1234567890',
  symbols: '!@#$%^&*',
};

const getRandomCharFromString = (str: string): string => str.charAt(Math.floor(Math.random() * str.length));

const generateRandomPassword = (length: number = 10): string => {
  let pwd = '';
  pwd += getRandomCharFromString(allowed.uppers);
  pwd += getRandomCharFromString(allowed.lowers);
  pwd += getRandomCharFromString(allowed.numbers);
  pwd += getRandomCharFromString(allowed.symbols);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(Object.values(allowed).join(''));
  }
  return pwd;
};

const generateRandomString = (length: number = 8): string => {
  let pwd = '';
  pwd += getRandomCharFromString(allowed.lowers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.lowers);
  }
  pwd += getRandomCharFromString(allowed.numbers);
  return pwd;
};

const generateRandomEmail = (length: number = 8): string => {
  return `${generateRandomString(length)}@email.com`;
};

const generateRandomNumber = (length: number = 9): string => {
  let pwd = getRandomCharFromString(allowed.numbers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.numbers);
  }
  return pwd;
};

const getAdminLoginData = (): { email: string; phone: string; password: string } => {
  return { email: 'admin@domain.com', phone: '123456789', password: 'P@ssWord!1' };
};

export {
  generateRandomEmail,
  generateRandomNumber,
  generateRandomPassword,
  generateRandomString,
  getAdminLoginData
};
