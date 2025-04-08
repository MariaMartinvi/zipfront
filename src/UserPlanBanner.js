import React from 'react';

const UserPlanBanner = ({ userProfile }) => {
  // Map plan names to more readable formats
  const getPlanName = (plan) => {
    switch(plan) {
      case 'free': return 'Gratuito';
      case 'basic': return 'Básico';
      case 'standard': return 'Estándar';
      case 'premium': return 'Premium';
      default: return 'Plan Desconocido';
    }
  };

  // Determine max uploads for the current plan
  const getMaxUploads = (plan) => {
    switch(plan) {
      case 'free': return 2;
      case 'basic': return 20;
      case 'standard': return 50;
      case 'premium': return 120;
      default: return 0;
    }
  };

  if (!userProfile) return null;

  const planName = getPlanName(userProfile.plan);
  const maxUploads = getMaxUploads(userProfile.plan);
  const currentUsage = userProfile.currentPeriodUsage || 0;

  return (
    <div className="user-plan-banner">
      <div className="user-plan-banner-content">
        <span className="user-plan-badge">{planName}</span>
        <span>
          Has analizado {currentUsage} de {maxUploads} conversaciones este mes
        </span>
        {userProfile.plan === 'free' && (
          <span 
            className="user-plan-upgrade-link"
            onClick={() => window.location.href = '/plans'}
          >
            Actualizar Plan
          </span>
        )}
      </div>
    </div>
  );
};

export default UserPlanBanner;