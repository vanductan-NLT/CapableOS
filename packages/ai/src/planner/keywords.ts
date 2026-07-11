import type { Capability } from "@orchestra/contracts";

export const CAPABILITY_KEYWORDS: Record<Capability, RegExp> = {
  summarization: /t[oó]m\s*(t[aắ]t|l[uư][oợ]c)|summary|summari[sz]/i,
  research: /nghi[êe]n\s*c[uứ]u|t[iì]m\s*hi[eể]u|research/i,
  email_drafting: /email|e-mail|mail|th[uư]\s*[đd]i[eệ]n\s*t[uử]|so[aạ]n\s*(mail|email)/i,
  translation: /\bd[iị]ch\b|translate|translation/i,
  meeting_notes: /bi[êe]n\s*b[aả]n|cu[oộ]c\s*h[oọ]p|meeting|minutes|meeting\s*notes/i,
  writing: /(?:^|\s)(vi[eế]t|write|draft)(?:\s|$)|so[aạ]n\s*th[aả]o|b[aà]i\s*vi[eế]t|blog/i,
  analysis: /ph[aâ]n\s*t[ií]ch|analysis|analy[sz]/i,
  coding: /l[aậ]p\s*tr[iì]nh|\bcode\b|coding|programming|implement/i,
  design: /thi[eế]t\s*k[eế]|design|ui|ux|wireframe/i,
};

export const RISK_KEYWORDS = {
  sendExternal: /g[uử]i.*(ra\s*ngo[aà]i|kh[aá]ch|[đd][oố]i\s*t[aá]c)|forward|publish|send.*(email|external|client|customer|partner)/i,
  deleteData: /\b(x[oó]a|xo[aá])\b|delete|drop\s+table|remove.*data/i,
  financialLegal: /thanh\s*to[aá]n|h[oó]a\s*[đd][oơ]n|ho[aá]\s*[đd][oơ]n|h[oợ]p\s*[đd][oồ]ng|ph[aá]p\s*l[yý]|t[aà]i\s*ch[ií]nh|payment|invoice|contract|legal|refund/i,
  affectCustomer: /kh[aá]ch\s*h[aà]ng|client|customer/i,
} as const;
