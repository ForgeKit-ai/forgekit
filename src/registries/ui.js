import * as tailwind from '../ui/tailwind.js';
import * as chakra from '../ui/chakra.js';
import * as shadcn from '../ui/shadcn.js';

export const uiFrameworks = {
  'Tailwind': { install: tailwind.install },
  'Chakra': { install: chakra.install },
  'shadcn': { install: shadcn.setupShadcnUI }
};
