import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

let mockUser = null;
jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('./firebase_auth', () => ({
  canUsePareja: jest.fn(() => new Promise(() => {})), decrementParejaCredit: jest.fn(), purchasePareja: jest.fn(),
  leerSeguimientoPareja: jest.fn(() => new Promise(() => {})), guardarSeguimientoPareja: jest.fn(),
}));
jest.mock('./fileService', () => ({ prepararChatPareja: jest.fn(), getParejaAnalysis: jest.fn() }));
jest.mock('./utils/chatImport', () => ({ extractChatContent: jest.fn(), anonimizarChat: jest.fn() }));
jest.mock('./UploadBox', () => ({ titulo }) => require('react').createElement('div', { className: 'upload-box' }, titulo));

// eslint-disable-next-line import/first
import ParejaPage, { Resultado } from './ParejaPage';
// eslint-disable-next-line import/first
import { guardarEstado, borrarEstado } from './utils/pareja';

const pintar = () => renderToStaticMarkup(<MemoryRouter><ParejaPage /></MemoryRouter>);

afterEach(() => { borrarEstado(); mockUser = null; });

test('sin sesión: explica y pide empezar', () => {
  const html = pintar();
  expect(html).toContain('Consigue tu objetivo');
  expect(html).toContain('Empezar');
});

test('con sesión y sin chat: pide subirlo', () => {
  mockUser = { uid: 'u1' };
  expect(pintar()).toContain('Sube el chat con esa persona');
});

test('con chat: pregunta quién eres con los dos nombres', () => {
  mockUser = { uid: 'u1' };
  guardarEstado({ procesado: 'x', mapping: {}, participantes: ['Eva', 'Leo'] });
  const html = pintar();
  expect(html).toContain('¿Quién eres tú en este chat?');
  expect(html).toContain('>Eva<');
  expect(html).toContain('>Leo<');
});

test('tras elegir: objetivos con el nombre de la otra persona', () => {
  mockUser = { uid: 'u1' };
  guardarEstado({ procesado: 'x', mapping: {}, participantes: ['Eva', 'Leo'], usuarioNombre: 'Eva' });
  const html = pintar();
  expect(html).toContain('¿Qué quieres con Leo?');
  expect(html).toContain('Recuperar a Leo');
});

test('paywall: candados y privacidad', () => {
  mockUser = { uid: 'u1' };
  guardarEstado({ procesado: 'x', mapping: {}, participantes: ['Eva', 'Leo'], usuarioNombre: 'Eva', objetivo: 'avanzar' });
  const html = pintar();
  expect(html).toContain('Tu análisis con Leo está listo');
  expect(html).toContain('Lo cerca que estás de tu objetivo');
  expect(html).toContain('nunca los mensajes');
});

const A = {
  puntuacion: 64, diagnostico: 'Vas bien.', bandera_verde: 'v', bandera_roja: 'r',
  lo_que_hiciste_bien: [{ fecha: '01/10/26', tu_mensaje: 'hola', por_que_funciono: 'p' }],
  momentos_mejorables: [{ fecha: '', tu_mensaje: 'ok', por_que_no_ayudo: 'seco', alternativa: '¡Me encantaría!' }],
  tono_actual: 'seco', tono_recomendado: 'cálido', plan_2_semanas: ['Propón un plan'],
  mensajes_ejemplo: { divertido: ['jaja'], carinoso: [], coqueto: [], atrevido: [] }, alerta_seguridad: false,
};

test('resultado: puntuación, alternativa y mensajes', () => {
  const html = renderToStaticMarkup(<Resultado a={A} otra="Leo" onNuevo={() => {}} />);
  expect(html).toContain('64');
  expect(html).toContain('Mejor así:');
  expect(html).toContain('Divertido');
  expect(html).not.toContain('016');
});

test('resultado con alerta de seguridad: aviso y teléfono de ayuda', () => {
  const html = renderToStaticMarkup(<Resultado a={{ ...A, alerta_seguridad: true, mensajes_ejemplo: { divertido: [], carinoso: [], coqueto: [], atrevido: [] } }} otra="Leo" onNuevo={() => {}} />);
  expect(html).toContain('016');
  expect(html).not.toContain('Mensajes listos para enviar');
});
