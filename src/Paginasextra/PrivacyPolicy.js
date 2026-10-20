import React from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const spanishContent = {
    title: "Política de Privacidad de chatsalsa.com",
    lastUpdate: "Fecha de entrada en vigor: 27/05/2025",
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
        title: "Importante",
        subsections: {
          stats: {
            title: "Para el análisis estadístico de tus chats:",
            items: ["Tus chats no salen de tu dispositivo(ordenador o teléfono)."]
          },
          psych: {
            title: "Para el análisis sicológico de tus chats:",
            items: [
              "La anonimización de tu chat se hace en tu dispositivo.",
              "Los chats son anonimizados en tu dispositivo antes de mandarlos a Microsoft Azure. Solo mandamos un fragmento de alrededor 20-50k caracteres. Mandamos los chats sin datos personales.",
              "Los chats anonimizados pasan directamente de tu dispositivo a Microsoft Azure, sin pasar por un servidor de Chatsalsa ni ser tratados por el camino."
            ]
          },
          conclusion: {
            title: "En conclusión:",
            items: [
              "No se almacena, ni tratan en nuestros servidores ni por terceros ningún dato personal presente en tus archivos de chat.",
              "Todo el tratamiento de datos personales se hace en tu dispositivo."
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
            note: "Utilizamos Firebase como proveedor de autenticación y almacenamiento seguro de usuarios."
          },
          payments: {
            title: "b) Pagos",
            description: "Los pagos son procesados a través de Stripe. No almacenamos directamente información de tarjetas de pago. Stripe gestiona y protege esta información conforme a sus propias políticas de privacidad: https://stripe.com/privacy"
          }
        }
      },
      chatProcessing: {
        title: "3. Tratamiento de Datos de Chat",
        description: "Importante: Los datos del chat sin anonimizar no salen nunca de tu dispositivo. Al subir un chat sólo se mandan a azure (microsoft) para el apartado \"análisis sicológico\", el resto se procesa en local en tu ordenador, dispositivo y los datos personales de los chats no salen de tu dispositivo.",
        important: {
          title: "Importante sobre los chats:",
          items: [
            "En el servidor de Chatsalsa NO almacenamos ningún chat.",
            "En el servidor de Chatsalsa NO tratamos ningún chat.",
            "Todos los datos son tratados y anonimizados directamente en tu dispositivo, ordenador.",
            "SOLO mandamos los datos del chat anonimizados, sin datos personales a AZURE. Este envío es directo sin pasar por nuestro servidor."
          ]
        },
        additional: {
          description: "Adicional: tienes la opción de que el chat no salga de tu dispositivo clicando la opción \"Sólo análisis local\". Si el usuario decide realizar el análisis sicológico, usamos Azure OpenAi para el tratamiento del chat. Antes de mandar el texto del chat a azure, adoptamos fuertes medidas de anonimización para que los datos personales no salgan del dispositivo del usuario que consta de 4 capas principales:"
        },
        anonymization: {
          title: "a) Anonimización antes del procesamiento externo",
          description: "Antes de enviar fragmentos de texto a servicios externos (ver sección siguiente), aplicamos el siguiente proceso de anonimización:",
          items: [
            "Se eliminan todos los nombres de los participantes, sustituyéndolos por \"Participante 1\", \"Participante 2\", etc.",
            "Se eliminan fechas específicas, emails y urls.",
            "Se procesan números para que sean irreconocibles:",
            "Números de 1 cifra: eliminados por completo.",
            "Números de 2 cifras: se conserva 1 cifra.",
            "Números de 3 cifras: se conserva 1 cifra.",
            "Números de 4 o más cifras: se conserva la mitad de las cifras.",
            "Se eliminan lugares, parentescos y otros datos personales, utilizando modelos de lenguaje basados en transformers (IA para la anonimización en browser), la librería Compromise, y reglas personalizadas con expresiones regulares (RegEx)."
          ]
        }
      },
      azure: {
        title: "4. Envío de Datos a Azure",
        description: "Solo se envía un fragmento limitado de entre 20k-50k caracteres del chat.",
        important: {
          title: "Importante en la política de privacidad de Microsoft Azure Openai:",
          items: [
            "Tus chats no se usan para entrenar la AI.",
            "Tus chats permanecen almacenados en centros de datos de Europa",
            "Tus chats pueden ser almacenados encriptados durante 30 días. (Para fines de depuración y auditoria de mal uso). Al cabo de 30 días se borran."
          ]
        },
        link: "Puedes consultar más detalles en la política de Microsoft Azure: https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy?tabs=azure-portal"
      },
      purposes: {
        title: "5. Finalidades del Tratamiento",
        description: "Utilizamos tus datos para:",
        items: [
          "Proporcionarte acceso al servicio.",
          "Gestionar tus pagos y autenticación.( Login )",
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
          "Los datos personales, login, se conservarán mientras mantengas una cuenta activa.",
          "Datos del chat:",
          "En chatsalsa no guardamos ningún dato del chat, de hecho nunca recibimos el chat. Todo se proceso en tu ordenador. No contamos con ningún dato personal más allá de los necesarios para el login.",
          "Los fragmentos anonimizados enviados a Azure se eliminan automáticamente tras un máximo de 30 días.",
          "Chat de pareja (seguimiento): si usas esta función, guardamos en tu cuenta la fecha, la puntuación y el plan de tu último análisis para poder compararlos en el siguiente. Se guardan bajo un identificador cifrado de las dos personas, sin nombres ni mensajes, y se conservan mientras mantengas tu cuenta activa."
        ]
      },
      changes: {
        title: "8. Cambios a Esta Política",
        description: "Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Notificaremos cualquier cambio importante a través del sitio web o por correo electrónico."
      },
      contact: {
        title: "9. Contacto",
        description: "Si tienes dudas sobre esta política, contáctanos en:",
        email: "📧 info@tiendeo.com"
      }
    },
    securityBadge: "100% Privado y Seguro"
  };

  const englishContent = {
    title: "ChatSalsa.com Privacy Policy",
    lastUpdate: "Effective Date: 05/27/2025",
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
            items: ["Your chats never leave your device (computer or phone)."]
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
                
                <p style={{ fontSize: '18px', lineHeight: '1.6' }}><a href={content.sections.azure.link.split(': ')[1]} target="_blank" rel="noopener noreferrer" className="privacy-link">{content.sections.azure.link}</a></p>
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