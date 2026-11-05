// Everything about you lives here. The pages read from this file.

export const site = {
  name: 'CHOI YOUNG JAE',
  role: 'Designer and creative developer',
  location: 'Lisbon',
  timezone: 'Europe/Lisbon',
  email: 'hello@yourname.studio',
  available: true,
  intro: 'I design brands, products and websites for people building something worth looking at. Ten years in, still curious.',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'Are.na', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Read.cv', href: '#' },
  ],
  marquee: ['Brand identity', 'Product design', 'Web design', 'Creative development', 'Art direction', 'Motion'],
}

export interface Project {
  slug: string
  title: string
  client: string
  category: string
  year: string
  cover: string
  tint: string
  summary: string
  role: string[]
  deliverables: string[]
  link?: string
  body: string[]
  size: 'large' | 'small'
}

export const projects: Project[] = [
  {
    slug: 'aurora',
    title: 'Aurora',
    client: 'Aurora Climate',
    category: 'Brand and website',
    year: '2026',
    cover: '/images/aurora.jpg',
    tint: '#efe4d8',
    summary: 'A brand and launch site for a climate-tech company that wanted to feel like weather, not like a dashboard.',
    role: ['Art direction', 'Identity', 'Website'],
    deliverables: ['Identity system', 'Motion language', 'Launch site', 'Pitch deck'],
    link: '#',
    body: [
      'Aurora captures carbon from the air and turns it into stone. The founders had spent two years in the lab and six months being told their brand should look like every other climate company: green, serious, full of graphs.',
      'We went the other way. The identity is built around a single soft form that changes with light, rendered in a palette borrowed from the sky at dawn. It moves slowly on the site and sits still on paper, and it never needs a leaf.',
      'The launch site took the company from a waitlist of 400 to 11,000 in a month, and the pitch deck helped close a Series A.',
    ],
    size: 'large',
  },
  {
    slug: 'meridian',
    title: 'Meridian',
    client: 'Meridian Bank',
    category: 'Product design',
    year: '2026',
    cover: '/images/meridian.jpg',
    tint: '#dbe0f5',
    summary: 'Redesigning a banking app around the one question people actually have: can I afford this?',
    role: ['Product design', 'Design system', 'Prototyping'],
    deliverables: ['iOS and Android app', 'Design system', 'Research synthesis'],
    body: [
      'Meridian had a feature for everything and a home screen nobody understood. We spent a month talking to customers and heard the same thing in different words: they open the app to decide whether to spend money, and the app made that harder.',
      'The new home screen answers that question first, in one number, then explains it. Everything else moved behind it. We rebuilt the design system in the process so the team could ship the rest without us.',
      'App store rating went from 3.1 to 4.7 over the following two releases.',
    ],
    size: 'small',
  },
  {
    slug: 'fold',
    title: 'Fold',
    client: 'Self-initiated',
    category: 'Typeface',
    year: '2025',
    cover: '/images/fold.jpg',
    tint: '#e8e2d6',
    summary: 'A high-contrast serif drawn for editorial headlines, with a specimen printed by hand.',
    role: ['Type design', 'Print'],
    deliverables: ['Variable font, two axes', 'Letterpress specimen', 'Microsite'],
    link: '#',
    body: [
      'Fold started as a sketch of an S that would not sit still. Two years later it is a two-axis variable family with a display cut that leans into its own awkwardness.',
      'The specimen was printed on a Vandercook in an afternoon with a friend who knows what he is doing. The impression you can feel on the paper is the whole point.',
    ],
    size: 'small',
  },
  {
    slug: 'halcyon',
    title: 'Halcyon',
    client: 'Halcyon Hotels',
    category: 'Website',
    year: '2025',
    cover: '/images/halcyon.jpg',
    tint: '#ebe3d6',
    summary: 'A booking site for a small group of hotels that feels like checking in, not checking out.',
    role: ['Design', 'Development'],
    deliverables: ['Website', 'Booking flow', 'CMS'],
    link: '#',
    body: [
      'Halcyon runs four hotels in buildings that are each a hundred years old. Their old site was a template with a booking widget bolted on, and it looked like every other hotel.',
      'We built something slower. Big photography, long scrolling pages that tell you about the neighbourhood before they tell you about the rooms, and a booking flow with three steps instead of nine.',
      'Direct bookings rose 38% in the first quarter, which is the number the owners cared about.',
    ],
    size: 'large',
  },
  {
    slug: 'nocturne',
    title: 'Nocturne',
    client: 'Vela Records',
    category: 'Art direction',
    year: '2024',
    cover: '/images/nocturne.jpg',
    tint: '#d8d4e4',
    summary: 'A visual identity for a debut album that had to work as a vinyl sleeve, a stage and a four-second loop.',
    role: ['Art direction', 'Motion'],
    deliverables: ['Album artwork', 'Live visuals', 'Social system'],
    body: [
      'The record is dark, slow and strangely warm. The visuals are liquid captured at macro scale, lit so the colour only appears where it catches the light.',
      'The same footage runs behind the band on stage and loops in nine-by-sixteen on the socials. One idea, every surface.',
    ],
    size: 'small',
  },
  {
    slug: 'kite',
    title: 'Kite',
    client: 'Kite Outdoors',
    category: 'E-commerce',
    year: '2024',
    cover: '/images/kite.jpg',
    tint: '#d9e6dc',
    summary: 'A storefront for an outdoor brand that sells fewer, better things, and wanted the site to say so.',
    role: ['Design', 'Development'],
    deliverables: ['Storefront', 'Campaign system', 'Email templates'],
    link: '#',
    body: [
      'Kite makes eleven products. Most outdoor sites are built for eleven thousand. We designed a store that treats each product like a chapter, with campaign photography shot on seamless colour so the range reads as one family.',
      'Conversion rate doubled against the previous site, with roughly half the pages.',
    ],
    size: 'small',
  },
]

export const bySlug = (slug: string) => projects.find((p) => p.slug === slug)

export const services = [
  {
    title: 'Brand identity',
    body: 'Naming, identity systems, guidelines and the motion that makes them feel alive. Built to be used by your team, not just admired by mine.',
  },
  {
    title: 'Product design',
    body: 'Research, flows, interface and design systems for apps and software. I work inside the product team, in your tools, at your pace.',
  },
  {
    title: 'Websites',
    body: 'Marketing sites, storefronts and editorial platforms, designed and built. Fast, accessible, and easy to keep updated without me.',
  },
  {
    title: 'Creative development',
    body: 'The interactive and generative layer: WebGL, motion, shaders and the small details that make a site feel considered.',
  },
]

export const testimonials = [
  {
    quote: 'The rare designer who can hold the whole thing in their head: the brand, the product, the code. We shipped in half the time and it looks twice as good.',
    name: 'Lena Fischer',
    role: 'Founder, Aurora Climate',
  },
  {
    quote: 'Every review ended with us removing something. I have never worked with anyone so good at taking things away.',
    name: 'Charlotte Ng',
    role: 'Head of Digital, Meridian Bank',
  },
  {
    quote: 'Our site finally feels like our hotels. Guests mention it at check-in.',
    name: 'Jonas Weber',
    role: 'Owner, Halcyon Hotels',
  },
]

export const experience = [
  { period: '2021 to now', title: 'Independent', detail: 'Brand, product and web for startups and studios' },
  { period: '2018 to 2021', title: 'Design lead, Fathom', detail: 'Led a team of six across analytics products' },
  { period: '2015 to 2018', title: 'Designer, Halcyon Studio', detail: 'Identity and editorial work for cultural clients' },
]
