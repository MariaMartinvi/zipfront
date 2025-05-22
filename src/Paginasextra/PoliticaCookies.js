import React from 'react';
import { useTranslation } from 'react-i18next';
import './PoliticaCookies.css';

const PoliticaCookies = () => {
  const { t } = useTranslation();

  return (
    <div className="politica-cookies-container">
      <div className="politica-cookies-content">
        <h1>{t('cookiePolicy.title')}</h1>
        
        <section>
          <h2>{t('cookiePolicy.introduction.title')}</h2>
          <p>{t('cookiePolicy.introduction.content')}</p>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.whatAreCookies.title')}</h2>
          <p>{t('cookiePolicy.whatAreCookies.content')}</p>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.typesOfCookies.title')}</h2>
          <h3>{t('cookiePolicy.typesOfCookies.byPurpose.title')}</h3>
          <ul>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byPurpose.necessary.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byPurpose.necessary.description')}</p>
            </li>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byPurpose.preferences.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byPurpose.preferences.description')}</p>
            </li>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byPurpose.statistics.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byPurpose.statistics.description')}</p>
            </li>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byPurpose.marketing.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byPurpose.marketing.description')}</p>
            </li>
          </ul>
          
          <h3>{t('cookiePolicy.typesOfCookies.byLifespan.title')}</h3>
          <ul>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byLifespan.session.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byLifespan.session.description')}</p>
            </li>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byLifespan.persistent.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byLifespan.persistent.description')}</p>
            </li>
          </ul>
          
          <h3>{t('cookiePolicy.typesOfCookies.byOrigin.title')}</h3>
          <ul>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byOrigin.firstParty.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byOrigin.firstParty.description')}</p>
            </li>
            <li>
              <strong>{t('cookiePolicy.typesOfCookies.byOrigin.thirdParty.title')}:</strong>
              <p>{t('cookiePolicy.typesOfCookies.byOrigin.thirdParty.description')}</p>
            </li>
          </ul>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.cookiesUsed.title')}</h2>
          
          <div className="cookie-table-container">
            <h3>{t('cookiePolicy.cookiesUsed.necessary.title')}</h3>
            <table className="cookie-table">
              <thead>
                <tr>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.name')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.provider')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.purpose')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.expiry')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.type')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>cookieConsent</td>
                  <td>Propia</td>
                  <td>{t('cookiePolicy.cookiesUsed.necessary.cookieConsent')}</td>
                  <td>1 año</td>
                  <td>HTTP</td>
                </tr>
                <tr>
                  <td>cookiePreferences</td>
                  <td>Propia</td>
                  <td>{t('cookiePolicy.cookiesUsed.necessary.cookiePreferences')}</td>
                  <td>1 año</td>
                  <td>HTTP</td>
                </tr>
                <tr>
                  <td>JSESSIONID</td>
                  <td>Propia</td>
                  <td>{t('cookiePolicy.cookiesUsed.necessary.sessionId')}</td>
                  <td>Sesión</td>
                  <td>HTTP</td>
                </tr>
              </tbody>
            </table>
            
            <h3>{t('cookiePolicy.cookiesUsed.analytics.title')}</h3>
            <table className="cookie-table">
              <thead>
                <tr>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.name')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.provider')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.purpose')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.expiry')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.type')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_ga</td>
                  <td>Google Analytics</td>
                  <td>{t('cookiePolicy.cookiesUsed.analytics.ga')}</td>
                  <td>2 años</td>
                  <td>HTTP</td>
                </tr>
                <tr>
                  <td>_gid</td>
                  <td>Google Analytics</td>
                  <td>{t('cookiePolicy.cookiesUsed.analytics.gid')}</td>
                  <td>24 horas</td>
                  <td>HTTP</td>
                </tr>
              </tbody>
            </table>
            
            <h3>{t('cookiePolicy.cookiesUsed.marketing.title')}</h3>
            <table className="cookie-table">
              <thead>
                <tr>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.name')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.provider')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.purpose')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.expiry')}</th>
                  <th>{t('cookiePolicy.cookiesUsed.tableHeaders.type')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_fbp</td>
                  <td>Facebook</td>
                  <td>{t('cookiePolicy.cookiesUsed.marketing.fbp')}</td>
                  <td>3 meses</td>
                  <td>HTTP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.thirdPartyServices.title')}</h2>
          <p>{t('cookiePolicy.thirdPartyServices.description')}</p>
          <ul>
            <li>
              <strong>Google Analytics</strong>
              <p>{t('cookiePolicy.thirdPartyServices.googleAnalytics')}</p>
              <p>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  {t('cookiePolicy.thirdPartyServices.privacyPolicy')}
                </a>
              </p>
            </li>
            <li>
              <strong>Facebook Pixel</strong>
              <p>{t('cookiePolicy.thirdPartyServices.facebookPixel')}</p>
              <p>
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                  {t('cookiePolicy.thirdPartyServices.privacyPolicy')}
                </a>
              </p>
            </li>
          </ul>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.howToManage.title')}</h2>
          <p>{t('cookiePolicy.howToManage.description')}</p>
          <h3>{t('cookiePolicy.howToManage.browsers.title')}</h3>
          <ul>
            <li>
              <strong>Google Chrome</strong>: 
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                {t('cookiePolicy.howToManage.instructions')}
              </a>
            </li>
            <li>
              <strong>Mozilla Firefox</strong>: 
              <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">
                {t('cookiePolicy.howToManage.instructions')}
              </a>
            </li>
            <li>
              <strong>Safari</strong>: 
              <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
                {t('cookiePolicy.howToManage.instructions')}
              </a>
            </li>
            <li>
              <strong>Microsoft Edge</strong>: 
              <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                {t('cookiePolicy.howToManage.instructions')}
              </a>
            </li>
          </ul>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.consent.title')}</h2>
          <p>{t('cookiePolicy.consent.description')}</p>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.updates.title')}</h2>
          <p>{t('cookiePolicy.updates.description')}</p>
          <p>{t('cookiePolicy.updates.lastUpdate')}: 2024-07-01</p>
        </section>
        
        <section>
          <h2>{t('cookiePolicy.contact.title')}</h2>
          <p>{t('cookiePolicy.contact.description')}</p>
          <p>Email: privacy@tudominio.com</p>
        </section>
      </div>
    </div>
  );
};

export default PoliticaCookies; 