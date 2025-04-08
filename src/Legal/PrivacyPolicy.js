export const PrivacyPolicyPage = () => {
    return (
      <div style={legalPageStyles.container}>
        <div style={legalPageStyles.header}>
          <h1 style={legalPageStyles.title}>Política de Privacidad</h1>
          <p style={legalPageStyles.lastUpdated}>Última actualización: Abril 2024</p>
        </div>
        <div style={legalPageStyles.content}>
          <ReactMarkdown>{privacyPolicy}</ReactMarkdown>
        </div>
      </div>
    );
  };