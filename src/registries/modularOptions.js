export const frontendOptions = {
  'react-vite': 'React (Vite)',
  'nextjs': 'Next.js',
  'vue-vite': 'Vue (Vite)',
  'sveltekit': 'SvelteKit',
  'astro': 'Astro',
  'angular': 'Angular'
};

export const uiOptions = {
  'Tailwind': 'Tailwind CSS',
  'Chakra': 'Chakra UI',
  'Material': 'Material-UI / Angular Material',
  'shadcn': 'shadcn/ui',
  'None': 'None'
};

export const backendOptions = {
  'express': 'Express (Node.js)',
  'nestjs': 'NestJS (Node.js)',
  'fastapi': 'FastAPI (Python)',
  'flask': 'Flask (Python)',
  'django': 'Django (Python)',
  'rails': 'Ruby on Rails',
  'gofiber': 'Go Fiber',
  'spring-boot': 'Spring Boot (Java)',
  null: 'None'
};

export const databaseOptions = {
  'supabase': 'Supabase',
  'postgresql': 'PostgreSQL',
  'sqlite': 'SQLite',
  'mongodb': 'MongoDB',
  'mysql': 'MySQL'
};

export const uiCompatibility = {
  'react-vite': ['Tailwind', 'Chakra', 'Material', 'shadcn', 'None'],
  'nextjs': ['Tailwind', 'Chakra', 'Material', 'shadcn', 'None'],
  'vue-vite': ['Tailwind', 'None'],
  'sveltekit': ['Tailwind', 'None'],
  'astro': ['Tailwind', 'None'],
  'angular': ['Tailwind', 'Material', 'None']
};

export const backendCompatibility = {
  'react-vite': ['express', 'nestjs', 'fastapi', 'flask', 'django', 'rails', 'spring-boot', null],
  'nextjs': [null],
  'vue-vite': ['express', 'nestjs', 'fastapi', 'flask', 'django', 'rails', 'spring-boot', null],
  'sveltekit': ['express', 'nestjs', 'fastapi', 'flask', 'django', 'rails', 'spring-boot', null],
  'astro': ['express', 'nestjs', 'fastapi', 'flask', 'django', 'rails', 'spring-boot', null],
  'angular': ['express', 'nestjs', 'fastapi', 'flask', 'django', 'rails', 'spring-boot', null]
};

export const dbCompatibility = {
  'express': ['supabase', 'postgresql', 'sqlite', 'mongodb'],
  'nestjs': ['supabase', 'postgresql', 'sqlite', 'mongodb'],
  'fastapi': ['supabase', 'postgresql', 'sqlite'],
  'flask': ['supabase', 'postgresql', 'sqlite'],
  'django': ['postgresql', 'sqlite'],
  'rails': ['postgresql', 'sqlite', 'mysql'],
  'gofiber': ['postgresql'],
  'spring-boot': ['postgresql', 'mysql'],
  null: ['sqlite', 'supabase']
};
