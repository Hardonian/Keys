export type RuntimeUiConfig = {
  version: number;
  tokens: {
    radius: string;
  };
  banner: {
    enabled: boolean;
    tone: 'info' | 'warning' | 'success' | 'danger';
    text: string;
    href: string | null;
    dismissible: boolean;
  };
  features: Record<string, boolean>;
  sections: Record<string, boolean>;
  copy: Record<string, string>;
};

export const DEFAULT_RUNTIME_UI_CONFIG: RuntimeUiConfig = {
  version: 1,
  tokens: { radius: '0.5rem' },
  banner: { enabled: false, tone: 'info', text: '', href: null, dismissible: true },
  features: {},
  sections: {},
  copy: {},
};

const CSS_LENGTH_RE = /^\d+(\.\d+)?(px|rem|em|%)$/u;
const KEY_RE = /^[a-z0-9_.-]{1,64}$/u;

export function sanitizeRuntimeUiConfig(raw: unknown): RuntimeUiConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_RUNTIME_UI_CONFIG;
  const obj = raw as Record<string, unknown>;

  const version =
    typeof obj.version === 'number' && Number.isInteger(obj.version) && obj.version >= 1 && obj.version <= 1000
      ? obj.version
      : DEFAULT_RUNTIME_UI_CONFIG.version;

  const tokensRaw = obj.tokens && typeof obj.tokens === 'object' ? (obj.tokens as Record<string, unknown>) : {};
  const radius =
    typeof tokensRaw.radius === 'string' && CSS_LENGTH_RE.test(tokensRaw.radius)
      ? tokensRaw.radius
      : DEFAULT_RUNTIME_UI_CONFIG.tokens.radius;

  const bannerRaw = obj.banner && typeof obj.banner === 'object' ? (obj.banner as Record<string, unknown>) : {};
  const enabled = typeof bannerRaw.enabled === 'boolean' ? bannerRaw.enabled : DEFAULT_RUNTIME_UI_CONFIG.banner.enabled;
  const tone =
    bannerRaw.tone === 'info' || bannerRaw.tone === 'warning' || bannerRaw.tone === 'success' || bannerRaw.tone === 'danger'
      ? bannerRaw.tone
      : DEFAULT_RUNTIME_UI_CONFIG.banner.tone;
  const text = typeof bannerRaw.text === 'string' ? bannerRaw.text.slice(0, 200) : DEFAULT_RUNTIME_UI_CONFIG.banner.text;
  const href =
    bannerRaw.href === null
      ? null
      : typeof bannerRaw.href === 'string' && /^https?:\/\//u.test(bannerRaw.href)
        ? bannerRaw.href
        : DEFAULT_RUNTIME_UI_CONFIG.banner.href;
  const dismissible =
    typeof bannerRaw.dismissible === 'boolean'
      ? bannerRaw.dismissible
      : DEFAULT_RUNTIME_UI_CONFIG.banner.dismissible;

  const features: Record<string, boolean> = {};
  const sections: Record<string, boolean> = {};
  const copy: Record<string, string> = {};

  if (obj.features && typeof obj.features === 'object') {
    for (const [k, v] of Object.entries(obj.features as Record<string, unknown>)) {
      if (Object.keys(features).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'boolean') continue;
      features[k] = v;
    }
  }

  if (obj.sections && typeof obj.sections === 'object') {
    for (const [k, v] of Object.entries(obj.sections as Record<string, unknown>)) {
      if (Object.keys(sections).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'boolean') continue;
      sections[k] = v;
    }
  }

  if (obj.copy && typeof obj.copy === 'object') {
    for (const [k, v] of Object.entries(obj.copy as Record<string, unknown>)) {
      if (Object.keys(copy).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'string') continue;
      copy[k] = v.slice(0, 2000);
    }
  }

  return {
    version,
    tokens: { radius },
    banner: { enabled, tone, text, href, dismissible },
    features,
    sections,
    copy,
  };
}

