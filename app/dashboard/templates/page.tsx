'use client';

export default function TemplatesPage() {
  const resources = [
    {
      title: 'Resume Guide',
      description: 'View keywords to include and generally PM resume tips & tricks',
      url: 'https://docs.google.com/document/d/1TgMhFSh1PLJ4q8rSskt7iQi4GzaNzDgUA5Gt7HH0o5c/edit',
      icon: '📄',
      color: 'from-blue-200 to-cyan-200',
      borderColor: 'border-blue-300',
      shadowColor: 'rgba(37,99,235,0.3)',
    },
    {
      title: 'Case Study Template',
      description: 'Use this template as you build your Product Portfolio case studies',
      url: 'https://docs.google.com/document/d/1c2RO866_VMP1UcHagka9agOz8wUeCdJjfmy4LicQ01o/edit#heading=h.2fjp59d97orb',
      icon: '📋',
      color: 'from-purple-200 to-pink-200',
      borderColor: 'border-purple-300',
      shadowColor: 'rgba(147,51,234,0.3)',
    },
    {
      title: 'Figma Graphic Templates',
      description: 'Edit pre-made user journey and graphics for your Portfolio',
      url: 'https://www.figma.com/file/fk0PJS7fZtWxBLg5eE0iF6/Product-Portfolio-Pro-Templates?node-id=0%3A1&t=kWeA9R5gayq3qDrB-1',
      icon: '🎨',
      color: 'from-pink-200 to-rose-200',
      borderColor: 'border-pink-300',
      shadowColor: 'rgba(236,72,153,0.3)',
    },
    {
      title: 'Networking Scripts',
      description: 'Get the exact scripts that convert to informational calls and referrals',
      url: 'https://docs.google.com/document/d/1T7LYwjsuH8gdjJq4ggLpgfvuBP85fcJOgnibI0jtTdM/edit',
      icon: '💬',
      color: 'from-green-200 to-emerald-200',
      borderColor: 'border-green-300',
      shadowColor: 'rgba(22,163,74,0.3)',
    },
    {
      title: 'Find Contacts Guide',
      description: 'Learn how to find important Product folks on LinkedIn',
      url: 'https://docs.google.com/document/d/11TIOe5plhFVjyDhynVGAQs5MVVz6QsdPCXupaMeLO-E/edit',
      icon: '🔍',
      color: 'from-teal-200 to-cyan-200',
      borderColor: 'border-teal-300',
      shadowColor: 'rgba(20,184,166,0.3)',
    },
    {
      title: 'Company Red Flags',
      description: 'Watch out for these Red Flags when considering a company',
      url: 'https://docs.google.com/document/d/1BVr0zFRQOh0YJYe3KMzYssVLpxWO1IgM0KIzMYMSF7k/edit',
      icon: '🚩',
      color: 'from-red-200 to-rose-200',
      borderColor: 'border-red-300',
      shadowColor: 'rgba(239,68,68,0.3)',
    },
    {
      title: 'Job Application Checklist',
      description: 'Follow these steps to increase your chances of an offer',
      url: 'https://docs.google.com/document/d/1hONTPDVQnw8ki5Bg_5Rqohz0doTcBB4_xw4rcVv0IrE/edit',
      icon: '✅',
      color: 'from-yellow-200 to-amber-200',
      borderColor: 'border-yellow-300',
      shadowColor: 'rgba(245,158,11,0.3)',
    },
    {
      title: 'My 8 Stories',
      description: 'Prepare for Behavioral PM interviews with this worksheet',
      url: 'https://docs.google.com/document/d/1gqH7oXT8GSp53yFc3cGeonzn5EkJXev_sfUYUO9oxkg/edit',
      icon: '📖',
      color: 'from-indigo-200 to-purple-200',
      borderColor: 'border-indigo-300',
      shadowColor: 'rgba(99,102,241,0.3)',
    },
    {
      title: 'Interview Prep',
      description: 'Be prepared for every PM interview you have',
      url: 'https://docs.google.com/document/d/12qwhC74AqdbP6ExlQggMDv2XETCR7Yd3LUYebF2SeO8/edit',
      icon: '🎯',
      color: 'from-violet-200 to-purple-200',
      borderColor: 'border-violet-300',
      shadowColor: 'rgba(124,58,237,0.3)',
    },
    {
      title: 'PM Interview Frameworks',
      description: 'Cheatsheet all the most powerful and relevant frameworks',
      url: 'https://docs.google.com/document/d/1qDLPAQGgV3RkseyjvXYZbQFqbUF3nMb9AQm4FjqsXyY',
      icon: '🧩',
      color: 'from-fuchsia-200 to-pink-200',
      borderColor: 'border-fuchsia-300',
      shadowColor: 'rgba(217,70,239,0.3)',
    },
    {
      title: 'Questions & Answers',
      description: 'View dozens of potential interview questions and answers',
      url: 'https://docs.google.com/document/d/18NHHSmKziFwbMLbIuZDA88PAEWM8YJkYFCIJZOUVF2I',
      icon: '❓',
      color: 'from-orange-200 to-yellow-200',
      borderColor: 'border-orange-300',
      shadowColor: 'rgba(234,88,12,0.3)',
    },
    {
      title: 'Offer Calculator',
      description: 'Use this calculator to increase your total compensation',
      url: 'https://docs.google.com/spreadsheets/d/10ZJVW9ME0JduJDs2b6ot3f_VAuFaEJmpQyNpVWe-oGY/edit?gid=0#gid=0',
      icon: '💰',
      color: 'from-emerald-200 to-green-200',
      borderColor: 'border-emerald-300',
      shadowColor: 'rgba(16,185,129,0.3)',
    },
    {
      title: 'Negotiation Scripts',
      description: 'Get the exact scripts you can use to increase your compensation',
      url: 'https://docs.google.com/document/d/1Tu77g5QTQ7CyHCrUhmnXFPaW389QdIuuM3uavGajc1M/edit',
      icon: '💼',
      color: 'from-slate-200 to-gray-200',
      borderColor: 'border-slate-300',
      shadowColor: 'rgba(71,85,105,0.3)',
    },
    {
      title: 'Product Requirements Doc (PRD)',
      description: 'Get started on a product initiative with this template',
      url: 'https://docs.google.com/document/d/12zR--P3Pe6E1znDH4PYTNJ5lgDtmeov2RPC9fmg_Dm8',
      icon: '📝',
      color: 'from-cyan-200 to-blue-200',
      borderColor: 'border-cyan-300',
      shadowColor: 'rgba(6,182,212,0.3)',
    },
    {
      title: 'Jira Ticket Templates',
      description: 'Improve your team\'s effectiveness by standardizing your tickets',
      url: 'https://docs.google.com/document/d/11ucJ6ls2PzuO7UdtOgXx0crZjae7_noR74BpTn7l9ok/',
      icon: '🎫',
      color: 'from-blue-200 to-indigo-200',
      borderColor: 'border-blue-300',
      shadowColor: 'rgba(59,130,246,0.3)',
    },
    {
      title: 'Roadmap Template',
      description: 'Organize your Roadmap into a visual tracker',
      url: 'https://docs.google.com/spreadsheets/d/1FAMgirb42Sp9N8tD8etDTxXn_fMRjYMl_zl7EZrpHu4/edit?gid=0#gid=0',
      icon: '🗺️',
      color: 'from-purple-200 to-indigo-200',
      borderColor: 'border-purple-300',
      shadowColor: 'rgba(147,51,234,0.3)',
    },
    {
      title: 'PM Terminology Glossary',
      description: 'Stuck on a concept? Look it up quickly and see an example',
      url: 'https://docs.google.com/document/d/1uYzYUJQyvx6jowhpYCjwkqNO0-2P31mTEnVnNGehEk4/edit',
      icon: '📚',
      color: 'from-amber-200 to-yellow-200',
      borderColor: 'border-amber-300',
      shadowColor: 'rgba(245,158,11,0.3)',
    },
    {
      title: 'Popular Metrics',
      description: 'Understand the most common KPIs used by product teams',
      url: 'https://docs.google.com/document/d/1h2rDM1Hx7Pwp_OC6oOssOdLhHKpfgjj6idyG5nEePLE/edit',
      icon: '📊',
      color: 'from-rose-200 to-pink-200',
      borderColor: 'border-rose-300',
      shadowColor: 'rgba(244,63,94,0.3)',
    },
    {
      title: 'Software Guide (Jira, Notion)',
      description: 'Learn the basis of popular PM software Jira & Notion',
      url: 'https://docs.google.com/document/d/1wJ8OQBiQxt5QCT_uMqIkBZYEd_rcCBCoo3wD3Q0tsAg',
      icon: '🛠️',
      color: 'from-sky-200 to-blue-200',
      borderColor: 'border-sky-300',
      shadowColor: 'rgba(14,165,233,0.3)',
    },
    {
      title: 'Project Tracker',
      description: 'Use this project tracker to keep your initiatives on track',
      url: 'https://docs.google.com/spreadsheets/d/1rK9ASRuKtvm2i22pmV59MUKdQoLJUbM1NDz5yMKLGOc/edit?gid=0#gid=0',
      icon: '📈',
      color: 'from-lime-200 to-green-200',
      borderColor: 'border-lime-300',
      shadowColor: 'rgba(132,204,22,0.3)',
    },
    {
      title: 'User Research / Interview Guide',
      description: 'Follow this guide for effective user research projects',
      url: 'https://docs.google.com/document/d/1SB7Qao94RvOlSWxl2QdYroE-ODNvccyx-3xRxOsC1k4',
      icon: '👥',
      color: 'from-teal-200 to-emerald-200',
      borderColor: 'border-teal-300',
      shadowColor: 'rgba(20,184,166,0.3)',
    },
  ];

  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_15px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300">
          <span className="text-5xl mb-4 block">📚</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            PM Resources
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Essential guides, templates, and tools for Product Managers
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <ResourceCard
            key={index}
            icon={resource.icon}
            title={resource.title}
            description={resource.description}
            url={resource.url}
            color={resource.color}
            borderColor={resource.borderColor}
            shadowColor={resource.shadowColor}
          />
        ))}
      </div>
    </div>
  );
}

const ResourceCard = ({
  icon,
  title,
  description,
  url,
  color,
  borderColor,
  shadowColor,
}: {
  icon: string;
  title: string;
  description: string;
  url: string;
  color: string;
  borderColor: string;
  shadowColor: string;
}) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-6 rounded-[2rem] bg-gradient-to-br ${color} border-2 ${borderColor} hover:translate-y-1 transition-all duration-200 cursor-pointer`}
      style={{
        boxShadow: `0 10px 0 0 ${shadowColor}`,
        '--shadow-color': shadowColor,
      } as React.CSSProperties & { '--shadow-color': string }}
      tabIndex={0}
      aria-label={`Open ${title}`}
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-700 font-medium mb-4">{description}</p>
      <span className="text-sm font-black text-gray-800 hover:text-gray-900 inline-flex items-center gap-1">
        Open Resource
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </span>
    </a>
  );
};
