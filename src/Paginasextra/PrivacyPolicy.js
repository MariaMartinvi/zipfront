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
    lastUpdate: "Effective Date: 11/23/2026",
    introduction: "At ChatSalsa, we take your privacy very seriously. This Privacy Policy describes how we collect, use, and protect your personal information when you access and use our website and services (hereinafter, the \"Service\").",
    sections: {
      responsible: {
        title: "1. Data Controller",
        description: "The controller of your personal data is:",
        details: [
          "ChatSalsa",
          "Avenida Roma 153, 08011 Barcelona",
          "Email: info@comartinvi.com"
        ]
      },
      important: {
        title: "Important",
        subsections: {
          stats: {
            title: "For chat statistical analysis:",
            items: [
              "Your chats never leave your device (computer or phone).",
              "For the \"Your chat vs. the rest\" comparison, your device sends a summary with numbers from the chat (for example, messages per day or swear words per 100 messages) and whether whoever writes or laughs the most, etc. is male or female, guessed from the name on your device. The summary contains no names, messages or anything that identifies you or your chat: our server only adds 1 to some overall counters and discards it."
            ]
          },
          psych: {
            title: "For psychological chat analysis:",
            items: [
              "Chat anonymization is done on your device.",
              "Chats are anonymized on your device before being sent to Microsoft Azure. We only send a fragment of about 20-50k characters. We send chats without personal data.",
              "Anonymized chats go directly from your device to Microsoft Azure, without passing through a Chatsalsa server or being processed along the way."
            ]
          },
          conclusion: {
            title: "In conclusion:",
            items: [
              "No personal data from your chat files is stored or processed on our servers or by third parties.",
              "All personal data processing is done on your device."
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
            note: "We use Firebase as our authentication and secure user storage provider."
          },
          payments: {
            title: "b) Payments",
            description: "Payments are processed through Stripe. We do not directly store payment card information. Stripe manages and protects this information according to their own privacy policy: https://stripe.com/privacy"
          }
        }
      },
      chatProcessing: {
        title: "3. Chat Data Processing",
        description: "Important: Non-anonymized chat data never leaves your device. When uploading a chat, it is only sent to Azure (Microsoft) for the \"psychological analysis\" section; the rest is processed locally on your computer/device, and personal chat data never leaves your device.",
        important: {
          title: "Important about chats:",
          items: [
            "We do NOT store any chats on the Chatsalsa server.",
            "We do NOT process any chats on the Chatsalsa server.",
            "All data is processed and anonymized directly on your device/computer.",
            "We ONLY send anonymized chat data, without personal information, to AZURE. This sending is direct without passing through our server."
          ]
        },
        additional: {
          description: "Additional: You have the option to keep the chat on your device by clicking the \"Local analysis only\" option. If the user decides to perform psychological analysis, we use Azure OpenAI for chat processing. Before sending the chat text to Azure, we implement strong anonymization measures to ensure personal data doesn't leave the user's device, consisting of 4 main layers:"
        },
        anonymization: {
          title: "a) Anonymization before external processing",
          description: "Before sending text fragments to external services (see next section), we apply the following anonymization process:",
          items: [
            "All participant names are removed, replaced with \"Participant 1\", \"Participant 2\", etc.",
            "Specific dates, emails, and URLs are removed.",
            "Numbers are processed to be unrecognizable:",
            "Single-digit numbers: completely removed.",
            "Two-digit numbers: one digit preserved.",
            "Three-digit numbers: one digit preserved.",
            "Four or more digits: half of the digits preserved.",
            "Places, relationships, and other personal data are removed using transformer-based language models (AI for browser anonymization), the Compromise library, and custom rules with regular expressions (RegEx)."
          ]
        }
      },
      azure: {
        title: "4. Data Sending to Azure",
        description: "Only a limited fragment of 20k-50k characters from the chat is sent.",
        important: {
          title: "Important in Microsoft Azure OpenAI privacy policy:",
          items: [
            "Your chats are not used to train AI.",
            "Your chats remain stored in European data centers.",
            "Your chats may be stored encrypted for 30 days. (For debugging and misuse audit purposes). They are deleted after 30 days."
          ]
        },
        link: "You can find more details in Microsoft Azure's policy: https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy?tabs=azure-portal"
      },
      purposes: {
        title: "5. Processing Purposes",
        description: "We use your data to:",
        items: [
          "Provide you access to the service.",
          "Manage your payments and authentication (Login).",
          "Improve system operation and user experience (anonymized analysis).",
          "Ensure service security and stability."
        ]
      },
      rights: {
        title: "6. User Rights",
        description: "As a user, you have the right to:",
        items: [
          "Access your personal data.",
          "Rectify incorrect or incomplete data.",
          "Request deletion of your data.",
          "Limit or object to processing.",
          "Port your data in a structured format."
        ],
        contact: "To exercise any of these rights, you can write to us at: info@comartinvi.com"
      },
      retention: {
        title: "7. Data Retention",
        items: [
          "Personal data, login, will be kept while you maintain an active account.",
          "Chat data:",
          "We don't store any chat data at Chatsalsa; in fact, we never receive the chat. Everything is processed on your computer. We don't have any personal data beyond what's necessary for login.",
          "Anonymized fragments sent to Azure are automatically deleted after a maximum of 30 days.",
          "Couple chat (follow-up): if you use this feature, we store in your account the date, score and plan of your last analysis so we can compare them in the next one. They are stored under an encrypted identifier of the two people, without names or messages, and are kept while you maintain an active account."
        ]
      },
      changes: {
        title: "8. Changes to This Policy",
        description: "We reserve the right to modify this Privacy Policy at any time. We will notify you of any significant changes through the website or by email."
      },
      contact: {
        title: "9. Contact",
        description: "If you have questions about this policy, contact us at:",
        email: "📧 info@tiendeo.com"
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