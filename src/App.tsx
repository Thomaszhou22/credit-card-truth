import { useState, useEffect, useMemo } from 'react'
import {
  calculateInstallment, calculateEarlyPayoff, calculateMinimumPayment,
  calculateZeroInterest, BANK_RATES, getBankMonthlyRate,
  type InstallmentResult, type MinimumPaymentResult
} from './lib/calculator'

type Tab = 'installment' | 'early' | 'minimum' | 'free' | 'compare'

function App() {
  const [tab, setTab] = useState<Tab>('installment')

  // 分期计算
  const [amount, setAmount] = useState('12000')
  const [periods, setPeriods] = useState('12')
  const [feeRate, setFeeRate] = useState('0.6')
  const [showSchedule, setShowSchedule] = useState(false)

  // 提前还款
  const [earlyMonth, setEarlyMonth] = useState('3')

  // 最低还款
  const [minBalance, setMinBalance] = useState('10000')
  const [dailyRate, setDailyRate] = useState('0.0005')

  // 免息分期
  const [freeAmount, setFreeAmount] = useState('6000')
  const [freePeriods, setFreePeriods] = useState('12')
  const [freeServiceFee, setFreeServiceFee] = useState('500')

  const result = useMemo(() => calculateInstallment(
    parseFloat(amount) || 0,
    parseInt(periods) || 12,
    (parseFloat(feeRate) || 0) / 100
  ), [amount, periods, feeRate])

  const earlyResult = useMemo(() => calculateEarlyPayoff(result, parseInt(earlyMonth) || 3), [result, earlyMonth])

  const minResult = useMemo(() => calculateMinimumPayment(
    parseFloat(minBalance) || 0,
    0.1,
    parseFloat(dailyRate) || 0.0005
  ), [minBalance, dailyRate])

  const freeResult = useMemo(() => calculateZeroInterest(
    parseFloat(freeAmount) || 0,
    parseInt(freePeriods) || 12,
    parseFloat(freeServiceFee) || 0
  ), [freeAmount, freePeriods, freeServiceFee])

  const fmt = (n: number) => n.toFixed(2)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'installment', label: '分期利率计算', icon: '💳' },
    { key: 'early', label: '提前还款', icon: '⚡' },
    { key: 'minimum', label: '最低还款', icon: '⚠️' },
    { key: 'free', label: '「免息」真相', icon: '🎭' },
    { key: 'compare', label: '银行对比', icon: '📊' },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50'>
      {/* Header */}
      <header className='bg-white/90 backdrop-blur border-b border-red-100 sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-2xl'>💳</span>
            <div>
              <h1 className='text-lg font-bold text-slate-800 leading-tight'>分期真相</h1>
              <p className='text-[10px] text-red-400 -mt-0.5'>银行不会告诉你的利率真相</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className='max-w-4xl mx-auto px-4 pt-6 pb-2 text-center'>
        <div className='inline-block bg-red-100 text-red-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3'>
          🔥 表面费率 {fmt(result.surfaceRate)}% → 实际年化 <span className='text-red-600'>{fmt(result.actualAPR)}%</span>
        </div>
        <p className='text-slate-500 text-sm max-w-lg mx-auto'>
          银行宣传的'月手续费 0.6%'，实际年化利率是 <span className='font-bold text-red-600'>{fmt(result.shockFactor)}倍</span>！
        </p>
      </div>

      {/* Tabs */}
      <div className='max-w-4xl mx-auto px-4 mb-4'>
        <div className='flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm overflow-x-auto'>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 min-w-0 px-2 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap
                ${tab === t.key ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className='max-w-4xl mx-auto px-4 pb-8'>
        {/* Tab 1: 分期利率计算 */}
        {tab === 'installment' && (
          <div className='space-y-4 animate-fade-in'>
            {/* Input */}
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-4'>💳 分期信息</h2>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>分期总金额 (¥)</label>
                  <input type='number' value={amount} onChange={e => setAmount(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition' />
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>分期期数</label>
                  <select value={periods} onChange={e => setPeriods(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 outline-none bg-white'>
                    {[3, 6, 9, 12, 18, 24, 36].map(p => <option key={p} value={p}>{p}期</option>)}
                  </select>
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>月手续费率 (%)</label>
                  <input type='number' step='0.01' value={feeRate} onChange={e => setFeeRate(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition' />
                </div>
              </div>
              {/* Quick period buttons */}
              <div className='flex gap-2 mt-3'>
                {[0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8].map(r => (
                  <button key={r} onClick={() => setFeeRate(r.toString())}
                    className={`px-2.5 py-1 rounded-lg text-xs transition ${feeRate === r.toString()
                      ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Shock Result */}
            <div className='bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg'>
              <div className='text-center'>
                <p className='text-red-100 text-sm mb-1'>银行告诉你的</p>
                <div className='text-3xl font-bold text-red-200 line-through decoration-2'>{fmt(result.surfaceRate)}%</div>
                <div className='flex items-center justify-center my-3'>
                  <svg className='w-8 h-8 text-amber-300 animate-bounce' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
                  </svg>
                </div>
                <p className='text-red-100 text-sm mb-1'>实际年化利率 (IRR)</p>
                <div className='text-5xl font-black'>{fmt(result.actualAPR)}%</div>
                <div className='mt-3 bg-white/20 rounded-xl px-4 py-2 inline-block'>
                  <span className='text-sm'>实际利率是表面的 <span className='font-bold text-amber-300'>{fmt(result.shockFactor)} 倍</span></span>
                </div>
              </div>
              <div className='grid grid-cols-3 gap-3 mt-6'>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-xl font-bold'>¥{fmt(result.monthlyPayment)}</div>
                  <div className='text-xs text-red-200'>每月还款</div>
                </div>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-xl font-bold'>¥{fmt(result.totalFees)}</div>
                  <div className='text-xs text-red-200'>总手续费</div>
                </div>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-xl font-bold'>¥{fmt(result.totalFees / (parseFloat(amount) || 1) * 1000)}</div>
                  <div className='text-xs text-red-200'>每千元成本</div>
                </div>
              </div>
            </div>

            {/* Visual comparison */}
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-4'>📊 银行费率 vs 真实利率对比</h2>
              <div className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-slate-500'>银行宣传费率</span>
                    <span className='text-slate-600'>{fmt(result.surfaceRate)}%</span>
                  </div>
                  <div className='h-6 bg-slate-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-slate-400 rounded-full transition-all flex items-center justify-end pr-2'
                      style={{ width: `${Math.min(result.surfaceRate, 30) / 30 * 100}%` }}>
                      <span className='text-[10px] text-white font-medium'>{fmt(result.surfaceRate)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-red-600 font-medium'>实际年化利率 (IRR)</span>
                    <span className='text-red-600 font-bold'>{fmt(result.actualAPR)}%</span>
                  </div>
                  <div className='h-6 bg-red-50 rounded-full overflow-hidden'>
                    <div className='h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all flex items-center justify-end pr-2'
                      style={{ width: `${Math.min(result.actualAPR, 30) / 30 * 100}%` }}>
                      <span className='text-[10px] text-white font-medium'>{fmt(result.actualAPR)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-slate-500'>同期银行贷款利率 (参考)</span>
                    <span className='text-slate-600'>~3.45%</span>
                  </div>
                  <div className='h-6 bg-green-50 rounded-full overflow-hidden'>
                    <div className='h-full bg-green-500 rounded-full transition-all flex items-center justify-end pr-2'
                      style={{ width: `${3.45 / 30 * 100}%` }}>
                      <span className='text-[10px] text-white font-medium'>3.45%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className='mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800'>
                💡 信用卡分期的实际利率约为银行同期消费贷的 <span className='font-bold'>{fmt(result.actualAPR / 3.45)} 倍</span>！
              </div>
            </div>

            {/* Cost per period visual */}
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-4'>💸 还款结构可视化</h2>
              <p className='text-xs text-slate-500 mb-4'>
                每月手续费按<b>初始金额</b>收取，但你的本金在不断减少 → 前期实际利率极高
              </p>
              <div className='space-y-2 max-h-80 overflow-y-auto'>
                {result.schedule.map(s => {
                  const principalPct = (s.principal / s.payment) * 100
                  const feePct = (s.fee / s.payment) * 100
                  return (
                    <div key={s.month} className='flex items-center gap-2 text-xs'>
                      <span className='w-8 text-slate-500 shrink-0'>第{s.month}期</span>
                      <div className='flex-1 flex h-5 rounded-full overflow-hidden bg-slate-100'>
                        <div className='bg-blue-400 transition-all' style={{ width: `${principalPct}%` }} />
                        <div className='bg-red-400 transition-all' style={{ width: `${feePct}%` }} />
                      </div>
                      <span className='w-20 text-right text-slate-600 shrink-0'>¥{fmt(s.payment)}</span>
                      <span className='w-24 text-right shrink-0'>
                        <span className='text-blue-600'>本{fmt(s.principal)}</span>
                        <span className='text-red-400 ml-1'>费{fmt(s.fee)}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className='flex gap-4 mt-3 text-xs text-slate-500'>
                <span className='flex items-center gap-1'><span className='w-3 h-3 bg-blue-400 rounded' />本金</span>
                <span className='flex items-center gap-1'><span className='w-3 h-3 bg-red-400 rounded' />手续费</span>
              </div>
            </div>

            {/* Schedule toggle */}
            <button onClick={() => setShowSchedule(!showSchedule)}
              className='w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-sm text-slate-600 hover:bg-slate-50 transition'>
              {showSchedule ? '收起还款计划表 ▲' : '查看完整还款计划表 ▼'}
            </button>
            {showSchedule && (
              <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-slate-50'>
                      <tr className='text-slate-500 text-xs'>
                        <th className='px-4 py-2 text-left'>期数</th>
                        <th className='px-4 py-2 text-right'>还款额</th>
                        <th className='px-4 py-2 text-right'>本金</th>
                        <th className='px-4 py-2 text-right'>手续费</th>
                        <th className='px-4 py-2 text-right'>剩余本金</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map(s => (
                        <tr key={s.month} className='border-t border-slate-100'>
                          <td className='px-4 py-2 text-slate-600'>第{s.month}期</td>
                          <td className='px-4 py-2 text-right'>¥{fmt(s.payment)}</td>
                          <td className='px-4 py-2 text-right text-blue-600'>¥{fmt(s.principal)}</td>
                          <td className='px-4 py-2 text-right text-red-500'>¥{fmt(s.fee)}</td>
                          <td className='px-4 py-2 text-right text-slate-400'>¥{fmt(s.remainingPrincipal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className='bg-slate-50 font-medium'>
                      <tr className='text-sm'>
                        <td className='px-4 py-2' colSpan={2}>合计</td>
                        <td className='px-4 py-2 text-right text-blue-600'>¥{fmt(parseFloat(amount))}</td>
                        <td className='px-4 py-2 text-right text-red-500'>¥{fmt(result.totalFees)}</td>
                        <td className='px-4 py-2 text-right text-slate-600'>¥{fmt(parseFloat(amount) + result.totalFees)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 提前还款 */}
        {tab === 'early' && (
          <div className='space-y-4 animate-fade-in'>
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-2'>⚡ 提前还款计算</h2>
              <p className='text-sm text-slate-500 mb-4'>大多数银行：提前还款不退还剩余期数的手续费</p>
              <div className='grid grid-cols-2 gap-3 mb-3'>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>分期金额 (¥)</label>
                  <input type='number' value={amount} onChange={e => setAmount(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>总期数</label>
                  <select value={periods} onChange={e => setPeriods(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white'>
                    {[3, 6, 9, 12, 18, 24, 36].map(p => <option key={p} value={p}>{p}期</option>)}
                  </select>
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>月费率 (%)</label>
                  <input type='number' step='0.01' value={feeRate} onChange={e => setFeeRate(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>第几个月提前还清</label>
                  <input type='number' value={earlyMonth} onChange={e => setEarlyMonth(e.target.value)}
                    min={1} max={periods}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg'>
              <div className='text-center'>
                <p className='text-amber-100 text-sm mb-1'>提前还款后实际年化利率</p>
                <div className='text-5xl font-black'>{fmt(earlyResult.actualAPREarly)}%</div>
                <p className='text-amber-100 text-xs mt-2'>比正常分期({fmt(result.actualAPR)}%) 还要高！</p>
              </div>
              <div className='grid grid-cols-2 gap-3 mt-4'>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold'>¥{fmt(earlyResult.remainingFeesIfPaid)}</div>
                  <div className='text-xs text-amber-200'>白交的剩余手续费</div>
                </div>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold'>{earlyResult.remainingPeriods}期</div>
                  <div className='text-xs text-amber-200'>剩余未用的期数</div>
                </div>
              </div>
            </div>

            <div className='bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700'>
              <p className='font-bold mb-1'>❌ 银行的套路：</p>
              <p>{earlyResult.earlyPayoffMessage}</p>
            </div>
          </div>
        )}

        {/* Tab 3: 最低还款 */}
        {tab === 'minimum' && (
          <div className='space-y-4 animate-fade-in'>
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-2'>⚠️ 最低还款计算器</h2>
              <p className='text-sm text-slate-500 mb-4'>每月只还最低还款额(10%)，看看要付出多大代价</p>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>账单金额 (¥)</label>
                  <input type='number' value={minBalance} onChange={e => setMinBalance(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>日利率</label>
                  <select value={dailyRate} onChange={e => setDailyRate(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white'>
                    <option value='0.0005'>万五 (0.05%/天 = 18.25%/年)</option>
                    <option value='0.0006'>万六 (0.06%/天 = 21.9%/年)</option>
                    <option value='0.00065'>万六五 (0.065%/天 = 23.7%/年)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-lg'>
              <div className='text-center'>
                <p className='text-slate-400 text-sm mb-1'>全部还清需要</p>
                {minResult.months >= 600 ? (
                  <div className='text-4xl font-black text-red-400'>永远还不清！</div>
                ) : (
                  <div className='text-5xl font-black'>{minResult.months} 个月</div>
                )}
                <p className='text-slate-400 text-xs mt-1'>约 {(minResult.months / 12).toFixed(1)} 年</p>
              </div>
              <div className='grid grid-cols-3 gap-3 mt-4'>
                <div className='bg-white/10 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold'>¥{parseFloat(minBalance).toFixed(0)}</div>
                  <div className='text-xs text-slate-400'>原始账单</div>
                </div>
                <div className='bg-white/10 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold text-red-400'>¥{fmt(minResult.totalInterest)}</div>
                  <div className='text-xs text-slate-400'>利息总额</div>
                </div>
                <div className='bg-white/10 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold text-amber-400'>¥{fmt(minResult.totalPaid)}</div>
                  <div className='text-xs text-slate-400'>总还款额</div>
                </div>
              </div>
              {minResult.months < 600 && (
                <div className='mt-4 bg-red-500/20 rounded-xl p-3 text-center'>
                  <span className='text-sm'>利息是本金的 <span className='font-bold text-red-300'>{fmt(minResult.totalInterest / (parseFloat(minBalance) || 1))} 倍</span></span>
                </div>
              )}
            </div>

            {minResult.schedule.length > 0 && (
              <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
                <div className='px-4 py-3 font-bold text-slate-800 text-sm'>还款进度 (前{minResult.schedule.length}期)</div>
                <table className='w-full text-xs'>
                  <thead className='bg-slate-50 text-slate-500'>
                    <tr>
                      <th className='px-3 py-1.5 text-left'>期数</th>
                      <th className='px-3 py-1.5 text-right'>还款额</th>
                      <th className='px-3 py-1.5 text-right'>本金</th>
                      <th className='px-3 py-1.5 text-right'>利息</th>
                      <th className='px-3 py-1.5 text-right'>剩余</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minResult.schedule.slice(0, 12).map(s => (
                      <tr key={s.month} className='border-t border-slate-50'>
                        <td className='px-3 py-1.5 text-slate-600'>第{s.month}月</td>
                        <td className='px-3 py-1.5 text-right'>¥{fmt(s.payment)}</td>
                        <td className='px-3 py-1.5 text-right text-blue-600'>¥{fmt(s.principal)}</td>
                        <td className='px-3 py-1.5 text-right text-red-500'>¥{fmt(s.interest)}</td>
                        <td className='px-3 py-1.5 text-right text-slate-400'>¥{fmt(s.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: 免息分期真相 */}
        {tab === 'free' && (
          <div className='space-y-4 animate-fade-in'>
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-2'>🎭 '免息分期'真相</h2>
              <p className='text-sm text-slate-500 mb-4'>商家说'12期免息'，但收了一笔「服务费」 — 算算实际利率是多少</p>
              <div className='grid grid-cols-3 gap-3'>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>商品价格 (¥)</label>
                  <input type='number' value={freeAmount} onChange={e => setFreeAmount(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>分期期数</label>
                  <select value={freePeriods} onChange={e => setFreePeriods(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white'>
                    {[3, 6, 12, 18, 24].map(p => <option key={p} value={p}>{p}期</option>)}
                  </select>
                </div>
                <div>
                  <label className='text-xs text-slate-500 mb-1 block'>服务费 (¥)</label>
                  <input type='number' value={freeServiceFee} onChange={e => setFreeServiceFee(e.target.value)}
                    className='w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400' />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg'>
              <div className='text-center'>
                <p className='text-purple-200 text-sm mb-1'>所谓「免息」的实际年化利率</p>
                <div className='text-5xl font-black'>{fmt(freeResult.equivalentAPR)}%</div>
                <div className='mt-3 bg-white/20 rounded-xl px-4 py-2 inline-block'>
                  <span className='text-sm'>每借 ¥1,000 实际成本 <span className='font-bold text-amber-300'>¥{fmt(freeResult.actualCostPer1000)}</span></span>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-3 mt-4'>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold'>¥{fmt(freeResult.monthlyPayment)}</div>
                  <div className='text-xs text-purple-200'>每月还款</div>
                </div>
                <div className='bg-white/15 rounded-xl p-3 text-center'>
                  <div className='text-lg font-bold'>¥{fmt(freeResult.serviceFee)}</div>
                  <div className='text-xs text-purple-200'>隐藏服务费</div>
                </div>
              </div>
            </div>

            <div className='bg-purple-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-700'>
              <p className='font-bold mb-1'>🎭 套路解析：</p>
              <p>{'「免息」只是换了个名字叫「服务费」。'}¥{fmt(parseFloat(freeAmount))} {'的商品，你实际到手只有'} ¥{fmt(parseFloat(freeAmount) - parseFloat(freeServiceFee))} {'，但每期还是按'} ¥{fmt(parseFloat(freeAmount))} {'来还。实际利率'} {fmt(freeResult.equivalentAPR)}% {'毫不便宜！'}</p>
            </div>
          </div>
        )}

        {/* Tab 5: 银行对比 */}
        {tab === 'compare' && (
          <div className='space-y-4 animate-fade-in'>
            <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
              <h2 className='font-bold text-slate-800 mb-2'>📊 各银行分期费率 & 真实利率对比</h2>
              <p className='text-sm text-slate-500 mb-4'>金额 ¥{(parseFloat(amount) || 12000).toLocaleString()}，按不同期数计算各银行真实年化利率</p>
              <div className='flex gap-2 mb-4 flex-wrap'>
                {[3, 6, 12, 24, 36].map(p => (
                  <button key={p} onClick={() => setPeriods(p.toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${periods === p.toString()
                      ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {p}期
                  </button>
                ))}
              </div>
            </div>

            <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-slate-50'>
                    <tr className='text-xs text-slate-500'>
                      <th className='px-4 py-2.5 text-left'>银行</th>
                      <th className='px-4 py-2.5 text-right'>月费率</th>
                      <th className='px-4 py-2.5 text-right'>表面费率</th>
                      <th className='px-4 py-2.5 text-right'>实际年化(IRR)</th>
                      <th className='px-4 py-2.5 text-right'>总手续费</th>
                      <th className='px-4 py-2.5 text-left'>排名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...BANK_RATES]
                      .map(bank => {
                        const rate = getBankMonthlyRate(bank, parseInt(periods) || 12) / 100
                        const r = calculateInstallment(parseFloat(amount) || 12000, parseInt(periods) || 12, rate)
                        return { bank, rate, result: r }
                      })
                      .sort((a, b) => a.result.actualAPR - b.result.actualAPR)
                      .map(({ bank, rate, result: r }, i) => (
                        <tr key={bank.bank} className={`border-t border-slate-100 ${i === 0 ? 'bg-green-50' : ''}`}>
                          <td className='px-4 py-2.5'>
                            <span className='mr-1'>{bank.logo}</span>
                            <span className='font-medium text-slate-700'>{bank.bank}</span>
                          </td>
                          <td className='px-4 py-2.5 text-right text-slate-600'>{(rate * 100).toFixed(2)}%</td>
                          <td className='px-4 py-2.5 text-right text-slate-600'>{fmt(r.surfaceRate)}%</td>
                          <td className={`px-4 py-2.5 text-right font-bold ${i === 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(r.actualAPR)}%</td>
                          <td className='px-4 py-2.5 text-right text-slate-600'>¥{fmt(r.totalFees)}</td>
                          <td className='px-4 py-2.5'>
                            {i === 0 && <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>🥇 最便宜</span>}
                            {i === 1 && <span className='text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full'>🥈</span>}
                            {i === 2 && <span className='text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full'>🥉</span>}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700'>
              <p className='font-bold mb-1'>💡 省钱建议：</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>不同银行、不同期数费率差异很大，选前一定要对比</li>
                <li>部分银行有活动期（如首期减免），注意利用</li>
                <li>如果确实需要分期，优先选表面费率最低的银行</li>
                <li>能不分期就不分期 — 年化利率都在10-18%之间</li>
              </ul>
            </div>
          </div>
        )}

        {/* Education section */}
        <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
          <h2 className='font-bold text-slate-800 mb-3 flex items-center gap-2'>
            <span className='text-lg'>🧠</span> 为什么实际利率比表面费率高这么多？
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600'>
            <div className='bg-red-50 rounded-xl p-4'>
              <div className='font-bold text-red-700 mb-2'>❌ 银行的算法（等本等息）</div>
              <p>每月手续费 = <b>原始金额</b> × 月费率</p>
              <p className='mt-1'>第1个月和第12个月的手续费一样多</p>
              <p className='mt-1 text-red-600'>→ 即使你还了一半本金，手续费没少</p>
            </div>
            <div className='bg-green-50 rounded-xl p-4'>
              <div className='font-bold text-green-700 mb-2'>✅ 正规贷款（等额本息）</div>
              <p>每月利息 = <b>剩余本金</b> × 月利率</p>
              <p className='mt-1'>随着还款，利息越来越少</p>
              <p className='mt-1 text-green-600'>→ 真正按你实际欠的钱收利息</p>
            </div>
          </div>
          <div className='mt-3 text-xs text-slate-400'>
            * 本工具使用 IRR（内部收益率）计算实际年化利率，与国际金融标准一致。数据仅供参考，具体以银行实际收费为准。
          </div>
        </div>

        <footer className='mt-6 text-center text-xs text-slate-400 pb-4'>
          分期真相 · 信用卡分期真实利率计算器 · 使用 IRR 算法 · 仅供参考
        </footer>
      </main>
    </div>
  )
}

export default App
