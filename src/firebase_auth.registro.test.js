// Registro con un email que ya tiene cuenta y otra contraseña:
// debe decir «Ya existe una cuenta con este email», no «Credenciales inválidas».
jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ signOut: jest.fn() })),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  browserSessionPersistence: {},
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));
jest.mock('i18next', () => ({
  t: (key) => ({
    'errors.auth.email-already-in-use': 'Ya existe una cuenta con este email.',
    'errors.auth.invalid-credential': 'Credenciales inválidas.',
  }[key] || key),
}));

const firebaseAuth = require('firebase/auth');
const { registerUser } = require('./firebase_auth');

const errorFirebase = (code) => Object.assign(new Error(code), { code });

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(errorFirebase('auth/email-already-in-use'));
});

test.each(['auth/invalid-credential', 'auth/wrong-password'])(
  'email ya registrado y otra contraseña (%s) → avisa de que la cuenta ya existe',
  async (codigo) => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(errorFirebase(codigo));
    await expect(registerUser('a@b.com', 'otra-clave', 'Ana')).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
      message: 'Ya existe una cuenta con este email.',
    });
  }
);

test('otros fallos al entrar (p. ej. red) se siguen mostrando tal cual', async () => {
  firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(errorFirebase('auth/network-request-failed'));
  await expect(registerUser('a@b.com', 'x', 'Ana')).rejects.toMatchObject({
    code: 'auth/network-request-failed',
  });
});
