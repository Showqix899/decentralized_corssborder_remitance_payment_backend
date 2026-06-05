//aml risk mangement service
export const runAMLChecks = ({ sender, receiver, amount }) => {
  // Placeholder for AML check logic
  // In a real implementation, this would involve checking the sender and receiver against AML databases,
  // analyzing transaction patterns, and applying risk scoring algorithms.

  let riskScore = 0;

  let reasons = [];

  //large transfer
  if (amount > 1000000) {
    riskScore += 50;
    reasons.push('Large transfer amount');
  }

  //cross border
  if (sender.country !== receiver.country) {
    riskScore += 30;
    reasons.push('Cross-border transaction');
  }

  //high risk country
  const highRiskCountries = [
    'North Korea',
    'Iran',
    'Syria',
    'Sudan',
    'Libya',
    'Yemen',
    'Afghanistan',
    'Venezuela',
    'Somalia',
    'Cuba',
    'Zimbabwe',
  ];

  if (
    highRiskCountries.includes(sender.country) ||
    highRiskCountries.includes(receiver.country)
  ) {
    riskScore += 100;
    reasons.push('Involvement of high-risk country');
  }

  return {
    riskScore,
    reasons,
  };
};

//aml decesion service
export const determineAMLStatus = (riskScore) => {
  if (riskScore >= 100) {
    return 'blocked';
  }

  if (riskScore >= 50) {
    return 'under_review';
  }

  return 'clear';
};
