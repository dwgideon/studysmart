export type SafetyDecision = {
  allowed: boolean;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  safeResponse?: string;
  strikeCount?: number;
  lockedUntil?: string;
  violationId?: string;
};

const PII_PATTERN = /(?:\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr)\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i;
const CRISIS_PATTERN = /\b(?:kill myself|suicid(?:e|al)|end my (?:own )?life|hurt myself|self[- ]?harm|want to die|ways? to (?:die|kill myself)|how (?:can|could|do|should|would) i (?:die|kill myself)|(?:best|easiest|fastest|least painful|painless) way to (?:die|kill myself)|how to (?:commit )?suicide|suicide (?:instructions?|methods?|plan)|unalive myself|end it all|(?:do not|don['’]?t) want to (?:be alive|live))\b/i;
const EXPLOITATION_PATTERN = /\b(?:nudes?|sexual pictures?|meet (?:me|up) secretly|don't tell (?:your )?(?:parent|mom|dad|teacher))\b/i;
const PROFANITY_PATTERN = /\b(?:f[\W_]*u[\W_]*c[\W_]*k(?:er|ing|ed|s)?|s[\W_]*h[\W_]*i[\W_]*t(?:ty|ting|s)?|b[\W_]*i[\W_]*t[\W_]*c[\W_]*h(?:es|y)?|a[\W_]*s[\W_]*s[\W_]*h[\W_]*o[\W_]*l[\W_]*e(?:s)?|m[\W_]*o[\W_]*t[\W_]*h[\W_]*e[\W_]*r[\W_]*f[\W_]*u[\W_]*c[\W_]*k(?:er|ing|ed|s)?|c[\W_]*u[\W_]*n[\W_]*t(?:s)?|s[\W_]*l[\W_]*u[\W_]*t(?:s)?|w[\W_]*h[\W_]*o[\W_]*r[\W_]*e(?:s)?|d[\W_]*u[\W_]*m[\W_]*b[\W_]*a[\W_]*s[\W_]*s|w[\W_]*t[\W_]*f)\b/i;
const EXPLICIT_REQUEST_PATTERN = /\b(?:create|describe|draw|generate|make|roleplay|show|write)\b[\s\S]{0,80}\b(?:erotic|nudes?|porn(?:ography|ographic)?|sex scene|sexually explicit|sexual pictures?|xxx)\b|\b(?:erotic|porn(?:ography|ographic)?|sexually explicit|xxx)\b[\s\S]{0,80}\b(?:content|image|picture|scene|story|video)\b/i;
const DISCLOSURE_CONTEXT_PATTERN = /\b(?:an adult|a person|friend|he|she|someone|they)\b[\s\S]{0,60}\b(?:asked|forced|pressured|sent|showed|threatened|told)\b/i;
const PROMPT_INJECTION_PATTERN = /\b(?:ignore|disregard|override|forget)\b[\s\S]{0,45}\b(?:previous|prior|system|developer|safety)\b[\s\S]{0,30}\b(?:instruction|instructions|prompt|rules?)\b|\b(?:bypass|disable|evade)\b[\s\S]{0,40}\b(?:safety|filter|moderation|restriction)|\b(?:jailbreak|developer mode|do anything now)\b/i;

export const EDUCATIONAL_SENSITIVE_CONTEXT = /\b(?:abuse|anatomy|assault|biology|consent|doctor|health class|harassment|medical|personal safety|puberty|reproduction|trusted adult)\b/i;

export function localK12SafetyDecision(content: string): SafetyDecision | null {
  if (CRISIS_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "SELF_HARM_CONCERN",
      severity: "CRITICAL",
      safeResponse:
        "I’m really glad you said something. You should not handle this alone. Please tell a trusted adult right now. If you may act or are in immediate danger, call local emergency services now. In the U.S. or Canada, call or text 988.",
    };
  }
  if (EXPLOITATION_PATTERN.test(content) && DISCLOSURE_CONTEXT_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "EXPLOITATION_OR_GROOMING",
      severity: "CRITICAL",
      safeResponse:
        "I can’t help with secret or sexual contact involving a young person. Stop sharing information, save the evidence, and tell a trusted adult. If anyone is pressuring or threatening you, contact local emergency services or a child-safety hotline.",
    };
  }
  if (PII_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "PERSONAL_INFORMATION",
      severity: "MEDIUM",
      safeResponse: "For your privacy, remove contact details or a home address and ask again without personal information.",
    };
  }
  if (PROFANITY_PATTERN.test(content)) {
    return { allowed: false, category: "PROFANITY", severity: "MEDIUM", safeResponse: "Please reword that without foul language." };
  }
  if (EXPLICIT_REQUEST_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "EXPLICIT_SEXUAL_CONTENT",
      severity: "HIGH",
      safeResponse: "I can’t create or help study explicit sexual content. I can help with factual, age-appropriate health, biology, consent, or personal-safety education.",
    };
  }
  if (EXPLOITATION_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "EXPLOITATION_OR_GROOMING",
      severity: "CRITICAL",
      safeResponse: "I can’t help with secret or sexual contact involving a young person. Stop sharing information, save the evidence, and tell a trusted adult. If anyone is pressuring or threatening you, contact local emergency services or a child-safety hotline.",
    };
  }
  if (PROMPT_INJECTION_PATTERN.test(content)) {
    return {
      allowed: false,
      category: "SAFETY_BYPASS_ATTEMPT",
      severity: "HIGH",
      safeResponse: "I can’t bypass StudySmart’s safety rules. Ask an age-appropriate school question instead.",
    };
  }
  return null;
}
