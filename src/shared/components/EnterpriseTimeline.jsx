import React from 'react';
import { Steps } from 'antd';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseTimeline({
  milestones = [],
  currentStep = 0,
  activeRole = 'MOTHER',
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  const items = milestones.map((m, idx) => ({
    title: m.title,
    description: m.description,
    status: idx < currentStep ? 'finish' : idx === currentStep ? 'process' : 'wait',
  }));

  return (
    <div style={{ padding: enterpriseTokens.spacing.md }}>
      <Steps
        current={currentStep}
        direction="vertical"
        items={items}
        {...props}
      />
    </div>
  );
}
