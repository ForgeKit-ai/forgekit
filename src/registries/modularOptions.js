export const frontendOptions = {
  'react-vite': 'React (Vite)',
  'nextjs': 'Next.js',
  'vue-vite': 'Vue (Vite)',
  'sveltekit': 'SvelteKit',
  'astro': 'Astro',
  'blazor': 'Blazor',
  'godot': 'Godot'
};

export const uiOptions = {
  'Tailwind': 'Tailwind CSS',
  'Chakra': 'Chakra UI',
  'None': 'None'
};

export const backendOptions = {
  'express': 'Express (Node.js)',
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
  'react-vite': ['Tailwind', 'Chakra'],
  'nextjs': ['Tailwind', 'Chakra'],
  'vue-vite': ['Tailwind'],
  'sveltekit': ['Tailwind'],
  'astro': ['Tailwind'],
  'blazor': [],
  'godot': []
};

export const backendCompatibility = {
  'react-vite': ['express', 'spring-boot'],
  'nextjs': [null],
  'vue-vite': ['express', 'fastapi'],
  'sveltekit': ['flask', 'express'],
  'astro': ['django'],
  'blazor': ['rails'],
  'godot': ['gofiber']
};

export const dbCompatibility = {
  'express': ['supabase', 'postgresql', 'sqlite', 'mongodb'],
  'fastapi': ['supabase', 'postgresql', 'sqlite'],
  'flask': ['supabase', 'postgresql', 'sqlite'],
  'django': ['postgresql', 'sqlite'],
  'rails': ['postgresql', 'sqlite', 'mysql'],
  'gofiber': ['postgresql'],
  'spring-boot': ['postgresql', 'mysql'],
  null: ['sqlite', 'supabase']
};
