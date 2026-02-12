/** Shared types & default data for admin-managed site content */

export interface MenuItemData {
  title: string;
  desc?: string;
}

export interface MenuSection {
  label: string;
  items: MenuItemData[];
}

export interface SiteData {
  contactEmail: string;
  sec2Title: string;
  sec2Desc: string;
  descText: string;
  sec4Data: { title: string; desc: string }[];
  sec6Data: { title: string; desc: string }[];
  menuData: MenuSection[];
}

export const defaultSiteData: SiteData = {
  contactEmail: 'infor@floatcapital.com',
  sec2Title: 'Engineering Direction in Decentralized Markets.',
  sec2Desc:
    'Float Capital incubates and invests in next-generation blockchain systems\u2014where architecture, intelligence, and capital align to create scalable infrastructure, autonomous market dynamics, and long-term structural value across decentralized economies.',
  descText:
    'Float Capital focuses on next-generation blockchain systems built on DAG-based architectures, enabling parallel processing, higher throughput, and non-linear scalability. These structures reflect how real markets evolve\u2014not as a single chain, but as multiple paths forming simultaneously. We incubate projects where infrastructure is designed for complexity from day one.',
  sec4Data: [
    {
      title: 'Infrastructure Incubation',
      desc: 'Float Capital incubates blockchain projects at the architectural level\u2014focusing on DAG-based frameworks, scalable protocol design, and foundational infrastructure. We help teams build systems capable of handling parallel execution, dynamic growth, and evolving market behavior.',
    },
    {
      title: 'AI-Driven Multi-Layer Trading Systems',
      desc: 'We support and develop AI agent\u2013based trading systems that operate across multiple layers\u2014protocol, liquidity, volatility, and strategy. These agents adapt in real time, navigating intersections and responding to shifts before they become visible.',
    },
    {
      title: 'Strategic Capital Deployment',
      desc: 'Float Capital deploys capital at structural inflection points\u2014where technology, team, and timing align. Our investment philosophy focuses on durability over hype, backing systems designed to extend beyond initial acceleration and maintain long-term market presence.',
    },
  ],
  sec6Data: [
    {
      title: 'Initiate Transfer',
      desc: "Every transaction begins with a clear intent: moving capital across borders with precision and control. Through Flow Capital\u2019s dashboard or API, clients initiate a payment or settlement request by defining the amount, destination, currency, and settlement preferences. Our system immediately validates the request structure and parameters, ensuring accuracy before execution. Whether triggered manually or programmatically, each transfer enters a unified workflow designed for speed and reliability. From the first interaction, clients gain full visibility into the transaction lifecycle, setting the foundation for a seamless and transparent cross-border experience.",
    },
    {
      title: 'Crypto Rail Settlement',
      desc: "Once initiated, funds move onto Flow Capital\u2019s crypto-powered settlement rails. Instead of passing through multiple correspondent banks, transactions are routed through secure blockchain infrastructure, enabling near real-time settlement and continuous availability. This architecture reduces delays, minimizes intermediaries, and enhances transparency throughout the transfer. Each movement is cryptographically secured and traceable, providing a clear record of settlement progress. By leveraging blockchain as a settlement layer\u2014not speculation\u2014Flow Capital delivers faster finality and more efficient capital movement across global markets.",
    },
    {
      title: 'Local Payout',
      desc: "With settlement complete, funds arrive at their final destination. Flow Capital enables local payout in the client\u2019s chosen currency or digital asset, delivering predictable settlement outcomes and clear confirmation. Whether converting to fiat, retaining digital assets, or redistributing capital internally, payouts are executed efficiently and transparently. Clients receive full reporting and transaction records, supporting reconciliation, audit, and treasury operations. The result is a complete end-to-end flow\u2014capital initiated globally, settled securely, and delivered locally with speed and confidence.",
    },
  ],
  menuData: [
    {
      label: 'Proposition',
      items: [
        { title: 'Instant Cross-Border Transfers', desc: 'Settle transactions in minutes not days.' },
        { title: 'Lower Transaction Costs', desc: 'Reduce fees compared to traditional correspondent banking networks.' },
        { title: 'Global Reach', desc: 'Move capital across countries and currencies without geographical limitations.' },
        { title: 'Institution-Grade Security', desc: 'Advanced custody, encryption, and risk controls.' },
      ],
    },
    {
      label: 'Products & Services',
      items: [
        { title: 'Cross-Border Payments', desc: 'Send and receive funds globally using crypto rails while settling in local or digital currencies.' },
        { title: 'Treasury & Liquidity Management', desc: 'Optimize capital allocation, manage digital asset liquidity, and streamline treasury operations across regions.' },
        { title: 'On/Off-Ramp Solutions', desc: 'Seamlessly convert between fiat and digital assets with transparent pricing and fast settlement.' },
      ],
    },
    {
      label: 'How It Works',
      items: [
        { title: 'Initiate Transfer', desc: 'Submit a payment or settlement request via API or dashboard.' },
        { title: 'Crypto Rail Settlement', desc: 'Funds are transferred using secure blockchain infrastructure.' },
        { title: 'Local Payout', desc: 'Receive funds in the desired currency or digital asset.' },
      ],
    },
    {
      label: 'Connect',
      items: [
        { title: 'Multi-layer custody and wallet security' },
        { title: 'Real-time transaction monitoring' },
        { title: 'Regulatory-aligned operations across jurisdictions' },
      ],
    },
  ],
};
