export const recommendationsHub = [
  {
    id: 'mutual-funds',
    title: 'Mutual Funds',
    subtitle: 'AI-picked equity & hybrid funds aligned to your risk profile',
    icon: '📊',
    path: '/recommendations/mutual-funds',
    tip: 'Increase SIP by ₹7,000 to close your investment gap.',
  },
  {
    id: 'insurance',
    title: 'Protection',
    subtitle: 'Term & health products to close your coverage gaps',
    icon: '☂️',
    path: '/recommendations/insurance',
    tip: 'Double term cover to ₹1 Cr for income replacement.',
  },
  {
    id: 'savings',
    title: 'Cash Parking',
    subtitle: 'Where to park emergency & short-term surplus',
    icon: '🏦',
    path: '/recommendations/savings',
    tip: 'Move idle savings to a liquid fund earning ~6.8%.',
  },
]

export const mutualFunds = [
  { name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', return3Y: 18.4, allocation: 35 },
  { name: 'UTI Nifty 50 Index', category: 'Large Cap Index', return3Y: 14.2, allocation: 30 },
  { name: 'HDFC Balanced Advantage', category: 'Hybrid', return3Y: 15.1, allocation: 20 },
  { name: 'Axis Small Cap', category: 'Small Cap', return3Y: 22.6, allocation: 15 },
]

export const insuranceProducts = [
  { name: 'HDFC Life Click 2 Protect', type: 'Term', cover: 10000000, premium: '₹850/mo' },
  { name: 'Niva Bupa ReAssure 2.0', type: 'Health', cover: 1000000, premium: '₹1,200/mo' },
  { name: 'Star Super Surplus', type: 'Health Top-up', cover: 2500000, premium: '₹420/mo' },
]

export const savingsInstruments = [
  { name: 'Axis Liquid Fund', type: 'Liquid Fund', expectedReturn: '6.8%', liquidity: 'T+1' },
  { name: 'SBI FD (1 Year)', type: 'Fixed Deposit', expectedReturn: '6.5%', liquidity: 'Premature exit' },
  { name: 'HDFC Arbitrage Fund', type: 'Arbitrage', expectedReturn: '7.1%', liquidity: 'T+2' },
]
