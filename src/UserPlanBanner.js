import React from 'react';
import { useTranslation } from 'react-i18next';

const UserPlanBanner = ({ userProfile }) => {
  const { t } = useTranslation();

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

  const planName = t(`subscription.plans.${userProfile.plan}.name`, { fallbackValue: userProfile.plan });
  const maxUploads = getMaxUploads(userProfile.plan);
  const currentUsage = userProfile.currentPeriodUsage || 0;

  return (
    <div className="user-plan-banner">
      <div className="user-plan-banner-content">
        <span className="user-plan-badge">{planName}</span>
        <span>
          {t('subscription.banner.analyzed', { used: currentUsage, total: maxUploads })}
        </span>
        {userProfile.plan === 'free' && (
          <span 
            className="user-plan-upgrade-link"
            onClick={() => window.location.href = '/plans'}
          >
            {t('subscription.banner.upgrade')}
          </span>
        )}
      </div>
    </div>
  );
};

export default UserPlanBanner;