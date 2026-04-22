// IRR 计算：用牛顿迭代法求内部收益率
function irr(cashFlows: number[]): number {
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    let npv = 0
    let dnpv = 0
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j)
      dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1)
    }
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < 1e-10) return newRate
    rate = newRate
  }
  return rate
}

export interface InstallmentResult {
  amount: number
  periods: number
  monthlyFeeRate: number        // 银行宣传的月手续费率
  surfaceRate: number           // 银行宣传的"总费率" = 月费率×期数
  actualAPR: number             // 实际年化利率 (IRR × 12)
  totalFees: number             // 总手续费
  monthlyPayment: number        // 每月还款额（本金+手续费）
  monthlyPrincipal: number      // 每月本金
  monthlyFee: number            // 每月手续费
  shockFactor: number           // 震惊倍数 = 实际利率/表面费率
  schedule: { month: number; remainingPrincipal: number; payment: number; fee: number; principal: number }[]
}

export function calculateInstallment(
  amount: number,
  periods: number,
  monthlyFeeRate: number
): InstallmentResult {
  const monthlyFee = amount * monthlyFeeRate
  const monthlyPrincipal = amount / periods
  const monthlyPayment = monthlyPrincipal + monthlyFee
  const totalFees = monthlyFee * periods
  const surfaceRate = monthlyFeeRate * periods

  // 构建现金流: 第0期收到 amount, 之后每期支出 monthlyPayment
  const cashFlows = [amount]
  for (let i = 0; i < periods; i++) {
    cashFlows.push(-monthlyPayment)
  }
  const monthlyIRR = irr(cashFlows)
  const actualAPR = monthlyIRR * 12

  const schedule = []
  let remaining = amount
  for (let i = 1; i <= periods; i++) {
    remaining -= monthlyPrincipal
    schedule.push({
      month: i,
      remainingPrincipal: Math.max(remaining, 0),
      payment: monthlyPayment,
      fee: monthlyFee,
      principal: monthlyPrincipal,
    })
  }

  return {
    amount,
    periods,
    monthlyFeeRate,
    surfaceRate,
    actualAPR,
    totalFees,
    monthlyPayment,
    monthlyPrincipal,
    monthlyFee,
    shockFactor: surfaceRate > 0 ? actualAPR / surfaceRate : 0,
    schedule,
  }
}

// 提前还款计算
export interface EarlyPayoffResult {
  remainingPeriods: number
  remainingFeesIfPaid: number    // 如果继续分期要交的手续费
  savedFees: number              // 提前还节省的（可能为0）
  actualAPREarly: number         // 提前还的实际利率（更高）
  earlyPayoffMessage: string
}

export function calculateEarlyPayoff(
  result: InstallmentResult,
  earlyPayoffMonth: number
): EarlyPayoffResult {
  // 银行通常：提前还款 = 一次性还剩余本金 + 剩余所有手续费
  const remainingPeriods = result.periods - earlyPayoffMonth
  const remainingFeesIfPaid = result.monthlyFee * remainingPeriods
  
  // 大多数银行提前还款不退手续费，所以省了0
  const savedFees = 0
  
  // 提前还的实际IRR
  const cashFlows = [result.amount]
  for (let i = 0; i < earlyPayoffMonth; i++) {
    cashFlows.push(-result.monthlyPayment)
  }
  // 最后一笔：还全部剩余本金 + 一次性剩余手续费
  const remainingPrincipal = result.amount * remainingPeriods / result.periods
  cashFlows.push(-(remainingPrincipal + remainingFeesIfPaid))
  
  const monthlyIRR = irr(cashFlows)
  const actualAPREarly = monthlyIRR * 12

  return {
    remainingPeriods,
    remainingFeesIfPaid,
    savedFees,
    actualAPREarly,
    earlyPayoffMessage: `你提前还款，银行依然收取剩余 ${remainingPeriods} 期的全部手续费 ¥${remainingFeesIfPaid.toFixed(2)}，实际年化利率飙升至 ${actualAPREarly.toFixed(2)}%！`
  }
}

// 最低还款计算
export interface MinimumPaymentResult {
  months: number          // 还清所需月数
  totalInterest: number   // 总利息
  totalPaid: number       // 总还款
  schedule: { month: number; payment: number; principal: number; interest: number; remaining: number }[]
}

export function calculateMinimumPayment(
  balance: number,
  minPaymentRate: number,  // 最低还款比例 (如 0.1 = 10%)
  dailyRate: number,        // 日利率 (如 0.0005 = 万五)
): MinimumPaymentResult {
  let remaining = balance
  let totalInterest = 0
  let months = 0
  const schedule = []

  while (remaining > 0.01 && months < 600) {
    months++
    const monthlyInterest = remaining * dailyRate * 30 // 按30天算月息
    const minPayment = Math.max(remaining * minPaymentRate, remaining + monthlyInterest)
    
    if (minPayment >= remaining + monthlyInterest) {
      // 最后一期
      const payment = remaining + monthlyInterest
      schedule.push({ month: months, payment, principal: remaining, interest: monthlyInterest, remaining: 0 })
      totalInterest += monthlyInterest
      remaining = 0
      break
    }

    const principal = minPayment - monthlyInterest
    remaining -= principal
    totalInterest += monthlyInterest
    schedule.push({ month: months, payment: minPayment, principal, interest: monthlyInterest, remaining: Math.max(remaining, 0) })
  }

  return {
    months,
    totalInterest,
    totalPaid: balance + totalInterest,
    schedule: schedule.slice(0, 24), // 只显示前24期
  }
}

// 银行分期费率数据
export interface BankRate {
  bank: string
  logo: string
  rates3: number    // 3期月费率
  rates6: number    // 6期
  rates12: number   // 12期
  rates24: number   // 24期
  rates36: number   // 36期
  minAmount?: number
  note?: string
}

export const BANK_RATES: BankRate[] = [
  { bank: '工商银行', logo: '🏦', rates3: 0.72, rates6: 0.70, rates12: 0.60, rates24: 0.60, rates36: 0.60 },
  { bank: '建设银行', logo: '🏛️', rates3: 0.70, rates6: 0.60, rates12: 0.60, rates24: 0.60, rates36: 0.60 },
  { bank: '招商银行', logo: '🔴', rates3: 0.75, rates6: 0.70, rates12: 0.66, rates24: 0.68, rates36: 0.68 },
  { bank: '中国银行', logo: '🇨🇳', rates3: 0.65, rates6: 0.60, rates12: 0.50, rates24: 0.50, rates36: 0.50 },
  { bank: '农业银行', logo: '🌾', rates3: 0.60, rates6: 0.60, rates12: 0.55, rates24: 0.55, rates36: 0.55 },
  { bank: '交通银行', logo: '🚢', rates3: 0.72, rates6: 0.70, rates12: 0.68, rates24: 0.68, rates36: 0.68 },
  { bank: '浦发银行', logo: '🟣', rates3: 0.68, rates6: 0.65, rates12: 0.55, rates24: 0.55, rates36: 0.55 },
  { bank: '中信银行', logo: '🟠', rates3: 0.65, rates6: 0.60, rates12: 0.55, rates24: 0.55, rates36: 0.55 },
  { bank: '平安银行', logo: '🟡', rates3: 0.75, rates6: 0.70, rates12: 0.65, rates24: 0.65, rates36: 0.65 },
  { bank: '花呗分期', logo: '🌟', rates3: 0.75, rates6: 0.70, rates12: 0.65, rates24: 0.65, rates36: 0.65 },
  { bank: '白条分期', logo: '🐶', rates3: 0.50, rates6: 0.50, rates12: 0.50, rates24: 0.50, rates36: 0.50, note: '部分期数有活动优惠' },
]

// 获取银行的月费率
export function getBankMonthlyRate(bank: BankRate, periods: number): number {
  switch (periods) {
    case 3: return bank.rates3
    case 6: return bank.rates6
    case 12: return bank.rates12
    case 24: return bank.rates24
    case 36: return bank.rates36
    default: return bank.rates12
  }
}

// "免息分期"计算（收服务费的情况）
export interface ZeroInterestResult {
  amount: number
  periods: number
  serviceFee: number          // 一次性服务费
  equivalentMonthlyRate: number
  equivalentAPR: number
  monthlyPayment: number
  actualCostPer1000: number   // 每借1000的实际成本
}

export function calculateZeroInterest(
  amount: number,
  periods: number,
  serviceFee: number
): ZeroInterestResult {
  const monthlyPayment = amount / periods
  const cashFlows = [amount - serviceFee] // 实际到手
  for (let i = 0; i < periods; i++) {
    cashFlows.push(-monthlyPayment)
  }
  const monthlyIRR = irr(cashFlows)
  const equivalentAPR = monthlyIRR * 12
  const equivalentMonthlyRate = monthlyIRR * 100

  return {
    amount,
    periods,
    serviceFee,
    equivalentMonthlyRate,
    equivalentAPR: equivalentAPR * 100,
    monthlyPayment,
    actualCostPer1000: (serviceFee / amount) * 1000,
  }
}
