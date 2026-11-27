import React from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const spanishContent = {
    title: "Política de Privacidad de chatsalsa.com",
    lastUpdate: "Fecha de entrada en vigor: 27/11/2026",
    introduction: "En ChatSalsa, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información personal cuando accedes y utilizas nuestro sitio web y servicios (en adelante, el \"Servicio\").",
    sections: {
      responsible: {
        title: "1. Responsable del Tratamiento",
        description: "El responsable del tratamiento de tus datos personales es:",
        details: [
          "Comartinvi (Propietario de Chatsalsa.com)",
          "Avinguda Roma 153, 08011 Barcelona",
          "Correo electrónico: info@comartinvi.com"
        ]
      },
      important: {
        title: "Importante: qué sale de tu dispositivo",
        subsections: {
          stats: {
            title: "Estadísticas, características, juegos y comparativa (gratis):",
            items: [
              "Las estadísticas, las características y los juegos se calculan en tu dispositivo (ordenador o teléfono). Tu chat no sale de él.",
              "Para la comparativa «Tu chat frente al resto», tu dispositivo envía una ficha con números del chat (por ejemplo, mensajes al día o palabrotas cada 100 mensajes, también sumados por chicos y por chicas), si quien gana cada característica (Vampiro, Amoroso…) es un chico o una chica, deducido del nombre en tu dispositivo, y el país, deducido de la zona horaria de tu dispositivo. Si tienes el análisis con IA, también los temas, la dinámica, los rasgos y la nota que ha elegido la IA de unas listas cerradas. La ficha no lleva nombres, mensajes ni nada que te identifique a ti o a tu chat: nuestro servidor suma esos números a unos contadores generales y la descarta."
            ]
          },
          psych: {
            title: "Análisis con IA, cuadro y libro (de pago):",
            items: [
              "Análisis con IA: antes de salir de tu dispositivo, el chat se anonimiza en él. Los nombres de quienes escriben pasan a ser «Participante 1», «Participante 2»…, también cuando aparecen dentro de los mensajes; se ocultan teléfonos, correos y enlaces, y se quitan fechas y horas. Se envía un fragmento de unos 20.000 caracteres a nuestro servidor, que lo pasa a nuestro proveedor de inteligencia artificial y devuelve el resultado. Nuestro servidor no lo guarda ni lo escribe en sus registros. Los nombres reales se reponen en tu dispositivo al enseñarte el resultado.",
              "Cuadro con las frases del chat: igual que el análisis, el chat se anonimiza en tu dispositivo y se envía a nuestro servidor y a la IA para elegir las frases, y no se guarda. De cada pago solo guardamos un contador de intentos y una huella del chat (un código del que no se puede sacar ninguna palabra), para que un pago valga para un solo chat. La lámina se crea y se descarga en tu dispositivo: ni las frases que eliges ni los nombres pasan por nuestro servidor.",
              "Libro con vuestro chat: el libro se monta en tu dispositivo. Para convertirlo en PDF, su contenido pasa por nuestro servidor y por nuestro servicio de conversión a PDF, en memoria y sin guardarse, y el PDF se descarga en tu dispositivo. Si lo compras en PDF, no se guarda en ningún sitio.",
              "Libro impreso: el PDF se guarda cifrado en nuestro servidor solo hasta que la imprenta lo recibe (como mucho 24 horas) y después se borra. La imprenta recibe el PDF y tu dirección de envío para fabricar y enviar el libro."
            ]
          },
          conclusion: {
            title: "En conclusión:",
            items: [
              "No guardamos tus chats.",
              "Lo que sale de tu dispositivo va anonimizado o, en el caso del libro impreso, cifrado, y no se guarda salvo en los casos y plazos descritos en esta política."
            ]
          }
        }
      },
      data: {
        title: "2. Datos que Recopilamos",
        subsections: {
          user: {
            title: "a) Información de Usuario",
            description: "Cuando te registras o haces login, recopilamos información básica como tu dirección de correo electrónico, nombre de usuario.",
            note: "Utilizamos un proveedor de autenticación para el almacenamiento seguro de las cuentas de usuario."
          },
          payments: {
            title: "b) Pagos",
            description: "Los pagos se procesan a través de nuestro proveedor de pagos. No almacenamos información de tarjetas de pago. En el libro impreso, el proveedor de pagos recoge también la dirección de envío."
          }
        }
      },
      chatProcessing: {
        title: "3. Tratamiento de Datos de Chat",
        description: "Tu chat se analiza en tu dispositivo. Solo sale de él lo descrito en el apartado «Importante» de esta política: anonimizado en el análisis con IA y en el cuadro, y en el libro el contenido necesario para convertirlo en PDF y, si es impreso, enviarlo a la imprenta.",
        important: {
          title: "Importante sobre los chats:",
          items: [
            "En el servidor de Chatsalsa NO almacenamos ningún chat.",
            "Lo que pasa por nuestro servidor (el fragmento anonimizado del análisis y del cuadro, y el libro para convertirlo en PDF) se trata en memoria y no se guarda, salvo el PDF del libro impreso hasta que lo recibe la imprenta.",
            "La anonimización se hace en tu dispositivo, antes de enviar nada."
          ]
        },
        additional: {
          description: "Si no quieres que salga nada del chat de tu dispositivo, usa solo las estadísticas gratuitas, que se calculan íntegramente en él."
        },
        anonymization: {
          title: "a) Anonimización antes del procesamiento externo",
          description: "Antes de enviar fragmentos del chat a nuestro proveedor de inteligencia artificial, se aplica en tu dispositivo el siguiente proceso:",
          items: [
            "Los nombres de los participantes se sustituyen por «Participante 1», «Participante 2», etc., también cuando aparecen dentro de los mensajes.",
            "Se ocultan teléfonos, correos electrónicos y enlaces.",
            "Se eliminan las fechas y las horas de los mensajes.",
            "Se ocultan nombres de personas y lugares frecuentes que se mencionan en la conversación, mediante listas y reglas."
          ]
        }
      },
      azure: {
        title: "4. Proveedores",
        description: "Para dar el servicio usamos proveedores de alojamiento del servidor, de inteligencia artificial (que solo reciben fragmentos del chat ya anonimizados), de pagos, de impresión y envío del libro (que reciben el PDF del libro y la dirección de envío), de cuentas de usuario y de correo electrónico. Ninguno guarda tu chat por encargo nuestro.",
        important: {
          title: "Sobre nuestros proveedores de inteligencia artificial:",
          items: [
            "Según sus condiciones, no usan los datos que reciben para entrenar sus modelos.",
            "Pueden conservarlos un tiempo limitado para vigilar abusos, según sus propias políticas."
          ]
        },
        link: ""
      },
      purposes: {
        title: "5. Finalidades del Tratamiento",
        description: "Utilizamos tus datos para:",
        items: [
          "Proporcionarte acceso al servicio.",
          "Gestionar tus pagos y autenticación.( Login )",
          "Fabricar y enviar el libro impreso, si lo pides.",
          "Mejorar el funcionamiento del sistema y la experiencia del usuario (análisis anonimizados).",
          "Garantizar la seguridad y estabilidad del servicio."
        ]
      },
      rights: {
        title: "6. Derechos del Usuario",
        description: "Como usuario, tienes derecho a:",
        items: [
          "Acceder a tus datos personales.",
          "Rectificar datos incorrectos o incompletos.",
          "Solicitar la eliminación de tus datos.",
          "Limitar u oponerte al tratamiento.",
          "Portar tus datos en un formato estructurado."
        ],
        contact: "Para ejercer cualquiera de estos derechos, puedes escribirnos a: info@comartinvi.com"
      },
      retention: {
        title: "7. Conservación de los Datos",
        items: [
          "Datos de la cuenta (login): mientras la mantengas activa.",
          "Chats: no los guardamos.",
          "Libro impreso: el PDF, cifrado, hasta que lo recibe la imprenta (como mucho 24 horas).",
          "Cuadro: el contador de intentos y la huella del chat de cada pago.",
          "Comparativa: solo contadores sumados, sin datos personales.",
          "Pagos y envíos: los conservan nuestros proveedores de pagos y, en el libro impreso, de impresión, según la ley."
        ]
      },
      changes: {
        title: "8. Cambios a Esta Política",
        description: "Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Notificaremos cualquier cambio importante a través del sitio web o por correo electrónico."
      },
      contact: {
        title: "9. Contacto",
        description: "Si tienes dudas sobre esta política, contáctanos en:",
        email: "📧 info@comartinvi.com"
      }
    },
    securityBadge: "100% Privado y Seguro"
  };

  const englishContent = {
    title: "ChatSalsa.com Privacy Policy",
    lastUpdate: "Effective Date: 11/27/2026",
    introduction: "At ChatSalsa, we take your privacy very seriously. This Privacy Policy describes how we collect, use and protect your personal information when you access and use our website and services (the \"Service\").",
    sections: {
      responsible: {
        title: "1. Data Controller",
        description: "The controller of your personal data is:",
        details: [
          "Comartinvi (Owner of Chatsalsa.com)",
          "Avinguda Roma 153, 08011 Barcelona, Spain",
          "Email: info@comartinvi.com"
        ]
      },
      important: {
        title: "Important: what leaves your device",
        subsections: {
          stats: {
            title: "Statistics, profiles, games and comparison (free):",
            items: [
              "Statistics, profiles and games are calculated on your device (computer or phone). Your chat does not leave it.",
              "For the \"Your chat vs. the rest\" comparison, your device sends a card with numbers from the chat (for example, messages per day or swear words per 100 messages, also added up for men and for women), whether the winner of each profile is a man or a woman (worked out from the name on your device), and the country (worked out from your device's time zone). If you have the AI analysis, it also sends the topics, dynamic, traits and score the AI chose from closed lists. The card contains no names, messages or anything that identifies you or your chat: our server adds those numbers to general counters and discards it."
            ]
          },
          psych: {
            title: "AI analysis, poster and book (paid):",
            items: [
              "AI analysis: before leaving your device, the chat is anonymised on it. The names of the people writing become \"Participant 1\", \"Participant 2\"…, also when they appear inside messages; phone numbers, emails and links are hidden, and dates and times are removed. A fragment of about 20,000 characters is sent to our server, which passes it to our artificial intelligence provider and returns the result. Our server does not store it or write it to its logs. The real names are put back on your device when the result is shown.",
              "Poster with quotes from the chat: as with the analysis, the chat is anonymised on your device and sent to our server and to the AI to choose the quotes, and it is not stored. For each payment we only keep a count of attempts and a fingerprint of the chat (a code from which no word can be recovered), so that one payment is valid for one chat. The poster is created and downloaded on your device: neither the quotes you choose nor the names go through our server.",
              "Book of your chat: the book is put together on your device. To turn it into a PDF, its content goes through our server and our PDF conversion service, in memory and without being stored, and the PDF is downloaded to your device. If you buy it as a PDF, it is not stored anywhere.",
              "Printed book: the PDF is stored encrypted on our server only until the printer receives it (24 hours at most) and is then deleted. The printer receives the PDF and your shipping address to make and send the book."
            ]
          },
          conclusion: {
            title: "In summary:",
            items: [
              "We do not store your chats.",
              "What leaves your device is anonymised or, for the printed book, encrypted, and is not stored except in the cases and for the periods described in this policy."
            ]
          }
        }
      },
      data: {
        title: "2. Data We Collect",
        subsections: {
          user: {
            title: "a) User Information",
            description: "When you register or log in, we collect basic information such as your email address and username.",
            note: "We use an authentication provider to store user accounts securely."
          },
          payments: {
            title: "b) Payments",
            description: "Payments are processed by our payment provider. We do not store payment card information. For the printed book, the payment provider also collects the shipping address."
          }
        }
      },
      chatProcessing: {
        title: "3. Processing of Chat Data",
        description: "Your chat is analysed on your device. Only what is described in the \"Important\" section of this policy leaves it: anonymised for the AI analysis and the poster, and for the book the content needed to turn it into a PDF and, if printed, send it to the printer.",
        important: {
          title: "Important about chats:",
          items: [
            "We do NOT store any chat on the Chatsalsa server.",
            "What goes through our server (the anonymised fragment for the analysis and the poster, and the book to turn it into a PDF) is processed in memory and not stored, except the PDF of the printed book until the printer receives it.",
            "Anonymisation happens on your device, before anything is sent."
          ]
        },
        additional: {
          description: "If you do not want anything from the chat to leave your device, use only the free statistics, which are calculated entirely on it."
        },
        anonymization: {
          title: "a) Anonymisation before external processing",
          description: "Before sending chat fragments to our artificial intelligence provider, the following process is applied on your device:",
          items: [
            "Participants' names are replaced with \"Participant 1\", \"Participant 2\", etc., also when they appear inside messages.",
            "Phone numbers, email addresses and links are hidden.",
            "Message dates and times are removed.",
            "Common names of people and places mentioned in the conversation are hidden, using lists and rules."
          ]
        }
      },
      azure: {
        title: "4. Providers",
        description: "To provide the service we use providers for server hosting, artificial intelligence (which only receive already anonymised chat fragments), payments, printing and shipping of the book (which receive the book PDF and the shipping address), user accounts and email. None of them stores your chat on our behalf.",
        important: {
          title: "About our artificial intelligence providers:",
          items: [
            "According to their terms, they do not use the data they receive to train their models.",
            "They may keep it for a limited time to monitor abuse, under their own policies."
          ]
        },
        link: ""
      },
      purposes: {
        title: "5. Purposes of Processing",
        description: "We use your data to:",
        items: [
          "Give you access to the service.",
          "Manage your payments and authentication (login).",
          "Make and ship the printed book, if you order it.",
          "Improve how the system works and the user experience (anonymised analysis).",
          "Ensure the security and stability of the service."
        ]
      },
      rights: {
        title: "6. User Rights",
        description: "As a user, you have the right to:",
        items: [
          "Access your personal data.",
          "Rectify incorrect or incomplete data.",
          "Request the deletion of your data.",
          "Restrict or object to processing.",
          "Port your data in a structured format."
        ],
        contact: "To exercise any of these rights, write to us at: info@comartinvi.com"
      },
      retention: {
        title: "7. Data Retention",
        items: [
          "Account data (login): while you keep it active.",
          "Chats: we do not store them.",
          "Printed book: the PDF, encrypted, until the printer receives it (24 hours at most).",
          "Poster: the attempt count and chat fingerprint for each payment.",
          "Comparison: only aggregated counters, with no personal data.",
          "Payments and shipping: kept by our payment providers and, for the printed book, our printing provider, as required by law."
        ]
      },
      changes: {
        title: "8. Changes to This Policy",
        description: "We reserve the right to modify this Privacy Policy at any time. We will notify any important change through the website or by email."
      },
      contact: {
        title: "9. Contact",
        description: "If you have questions about this policy, contact us at:",
        email: "📧 info@comartinvi.com"
      }
    },
    securityBadge: "100% Private and Secure"
  };

  const content = isSpanish ? spanishContent : englishContent;

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">{content.title}</h1>
            <p className="hero-description">{content.lastUpdate}</p>
            <p className="hero-description">{content.introduction}</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '40px' }}>
            
            {/* Responsible Section */}
            <div className="feature-card">
              <h3>{content.sections.responsible.title}</h3>
              <p style={{ fontSize: '18px', lineHeight: '1.6' }}>{content.sections.responsible.description}</p>
              <ul style={{ textAlign: 'left', margin: '20px 0', fontSize: '18px', lineHeight: '1.6' }}>
                {content.sections.responsible.details.map((detail, index) => (
                  <li key={index} style={{ marginBottom: '12px' }}>{detail}</li>
                ))}
              </ul>
            </div>

            {/* Important Section */}
            <div className="feature-card">
              <h3>{content.sections.important.title}</h3>
              
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>{content.sections.important.subsections.stats.title}</h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {content.sections.important.subsections.stats.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>

                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>{content.sections.important.subsections.psych.title}</h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {content.sections.important.subsections.psych.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>

                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>{content.sections.important.subsections.conclusion.title}</h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {content.sections.important.subsections.conclusion.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Data Collection Section */}
            <div className="feature-card">
              <h3>{content.sections.data.title}</h3>
              
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>{content.sections.data.subsections.user.title}</h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.data.subsections.user.description}</p>
                <p style={{ marginBottom: '20px', fontStyle: 'italic', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.data.subsections.user.note}</p>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>{content.sections.data.subsections.payments.title}</h4>
                <p style={{ fontSize: '18px', lineHeight: '1.6' }}>{content.sections.data.subsections.payments.description}</p>
              </div>
            </div>

            {/* Chat Processing Section */}
            <div className="feature-card">
              <h3>{content.sections.chatProcessing.title}</h3>
              <p style={{ textAlign: 'left', marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.chatProcessing.description}</p>
              
              <div style={{ textAlign: 'left' }}>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ color: '#DC2626', marginBottom: '15px', fontSize: '20px' }}>{content.sections.chatProcessing.important.title}</h4>
                  <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                    {content.sections.chatProcessing.important.items.map((item, index) => (
                      <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                <p style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.chatProcessing.additional.description}</p>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>{content.sections.chatProcessing.anonymization.title}</h4>
                <p style={{ marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.chatProcessing.anonymization.description}</p>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {content.sections.chatProcessing.anonymization.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Azure Section */}
            <div className="feature-card">
              <h3>{content.sections.azure.title}</h3>
              <p style={{ textAlign: 'left', marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.azure.description}</p>
              
              <div style={{ textAlign: 'left' }}>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ color: '#DC2626', marginBottom: '15px', fontSize: '20px' }}>{content.sections.azure.important.title}</h4>
                  <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                    {content.sections.azure.important.items.map((item, index) => (
                      <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                {content.sections.azure.link && <p style={{ fontSize: '18px', lineHeight: '1.6' }}><a href={content.sections.azure.link.split(': ')[1]} target="_blank" rel="noopener noreferrer" className="privacy-link">{content.sections.azure.link}</a></p>}
              </div>
            </div>

            {/* Purposes Section */}
            <div className="feature-card">
              <h3>{content.sections.purposes.title}</h3>
              <p style={{ textAlign: 'left', marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.purposes.description}</p>
              <ul style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>
                {content.sections.purposes.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Rights Section */}
            <div className="feature-card">
              <h3>{content.sections.rights.title}</h3>
              <p style={{ textAlign: 'left', marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.rights.description}</p>
              <ul style={{ textAlign: 'left', marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>
                {content.sections.rights.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                ))}
              </ul>
              <p style={{ textAlign: 'left', fontWeight: '600', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.rights.contact}</p>
            </div>

            {/* Retention Section */}
            <div className="feature-card">
              <h3>{content.sections.retention.title}</h3>
              <ul style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>
                {content.sections.retention.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Changes Section */}
            <div className="feature-card">
              <h3>{content.sections.changes.title}</h3>
              <p style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.changes.description}</p>
            </div>

            {/* Contact Section */}
            <div className="feature-card">
              <h3>{content.sections.contact.title}</h3>
              <p style={{ textAlign: 'left', marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>{content.sections.contact.description}</p>
              <p style={{ textAlign: 'left', fontSize: '18px', fontWeight: '600', lineHeight: '1.6' }}>{content.sections.contact.email}</p>
            </div>

          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">🔒</span>
          <span className="security-text">{content.securityBadge}</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;