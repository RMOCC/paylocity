export const BASE_URL = 'https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod';

export const CREDENTIALS = {
  username: 'TestUser521',
  password: '#2hyPU+!I+A$',
  authHeader: 'Basic VGVzdFVzZXI1MjE6IzJoeVBVKyFJK0Ek',
};

export const BENEFITS = {
  salaryPerPaycheck: 2000,
  paychecksPerYear: 26,
  employeeCostPerYear: 1000,
  dependantCostPerYear: 500,
};

// Annual gross salary (salary per paycheck × number of paychecks)
export function calculateGross(): number {
  return BENEFITS.salaryPerPaycheck * BENEFITS.paychecksPerYear;
}

// Per-paycheck deduction: annual costs (employee + dependants) spread over 26 paychecks
export function calculateBenefitsCost(dependants: number): number {
  const annualCost = BENEFITS.employeeCostPerYear + dependants * BENEFITS.dependantCostPerYear;
  return annualCost / BENEFITS.paychecksPerYear;
}

export function calculateNet(dependants: number): number {
  return BENEFITS.salaryPerPaycheck - calculateBenefitsCost(dependants);
}

export function parseCurrency(value: string | null): number {
  return parseFloat(value!.replace(/[^0-9.]/g, ''));
}
