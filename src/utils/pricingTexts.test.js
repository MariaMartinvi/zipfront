import i18next from 'i18next';
import { getAiPackPricing } from './pricing';

const IDIOMAS = ['es', 'en', 'de', 'fr', 'it', 'pt'];
const CLAVES = [
  'hero.ai_preview.unlock_button',
  'hero.ai_preview.unlock_note',
  'freemium.ai_pack.price',
  'freemium.ai_pack.original_price',
  'freemium.public.register_and_buy',
];

const crear = async (lng) => {
  const resources = {};
  for (const l of new Set([lng, 'es'])) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    resources[l] = { translation: require(`../../public/locales/${l}/translation.json`) };
  }
  const i18n = i18next.createInstance();
  await i18n.init({ lng, fallbackLng: 'es', resources, interpolation: { escapeValue: false } });
  return i18n;
};

describe.each(IDIOMAS)('textos de precio en %s', (lng) => {
  test('precio normal: 5 €, 10 € tachado y 0,50 € por análisis', async () => {
    const i18n = await crear(lng);
    const p = getAiPackPricing('Europe/Paris', true);
    const textos = CLAVES.map((k) => i18n.t(k, p));
    textos.forEach((txt) => expect(txt).not.toMatch(/\{\{|\}\}/));
    expect(i18n.t('freemium.ai_pack.price', p)).toBe('5€');
    expect(i18n.t('freemium.ai_pack.original_price', p)).toBe('10€');
    expect(i18n.t('hero.ai_preview.unlock_button', p)).toContain('5€');
    expect(i18n.t('hero.ai_preview.unlock_note', p)).toContain('0,50€');
    expect(textos.join(' ')).not.toMatch(/0[.,]05/);
  });

  test('precio Latinoamérica: 1,99 €', async () => {
    const i18n = await crear(lng);
    const p = getAiPackPricing('America/Caracas', true);
    expect(i18n.t('hero.ai_preview.unlock_button', p)).toContain('1,99€');
    expect(i18n.t('freemium.public.register_and_buy', p)).toContain('1,99€');
    expect(i18n.t('hero.ai_preview.unlock_note', p)).toContain('0,20€');
  });

  test('precio España: 2,99 €', async () => {
    const i18n = await crear(lng);
    const p = getAiPackPricing('Europe/Madrid', true, true);
    expect(i18n.t('hero.ai_preview.unlock_button', p)).toContain('2,99€');
    expect(i18n.t('freemium.ai_pack.original_price', p)).toBe('5€');
    expect(i18n.t('hero.ai_preview.unlock_note', p)).toContain('0,30€');
  });
});
