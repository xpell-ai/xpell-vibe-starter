import type { VibeKnowledgeSelection, VibeSkillDocument } from "./VibeKnowledgeSelector.js";

export type VibeArtifactType = "view" | "flow" | "entity" | "command";
export type VibeRequestedArtifactType = VibeArtifactType | "auto";

export type VibePromptBuildInput = {
  prompt: string;
  _mode: "full" | "refine";
  _artifact_type: VibeArtifactType;
  selection: VibeKnowledgeSelection;
};

const DEFAULT_MAX_SKILL_PROMPT_CHARS = 5_000;
const MAX_ARRAY_ITEMS = 10;
const MAX_PATTERN_ITEMS = 5;
const MAX_EXAMPLE_ITEMS = 3;
const MAX_JSON_CHARS = 1_200;

function has_value(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function truncate_text(value: string, max_chars: number): string {
  if (value.length <= max_chars) return value;
  return `${value.slice(0, Math.max(0, max_chars - 18))}\n...[truncated]`;
}

function compact_json(value: unknown, max_chars = MAX_JSON_CHARS): string {
  return truncate_text(JSON.stringify(value, null, 2), max_chars);
}

function compact_array(value: unknown, max_items = MAX_ARRAY_ITEMS): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max_items);
}

function format_identity(skill: VibeSkillDocument): string {
  const identity: Record<string, unknown> = {};

  for (const key of ["_id", "_title", "_version", "_type"] as const) {
    if (has_value(skill[key])) {
      identity[key] = skill[key];
    }
  }

  return compact_json(identity);
}

function format_string_array_section(title: string, value: unknown): string[] {
  const items = compact_array(value).filter((item): item is string => typeof item === "string");
  if (items.length === 0) return [];

  return [
    `${title}:`,
    ...items.map((item) => `- ${item}`),
  ];
}

function compact_pattern(pattern: unknown): unknown {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) return pattern;

  const source = pattern as Record<string, unknown>;
  const compact: Record<string, unknown> = {};

  for (const key of ["_name", "_description", "_example"] as const) {
    if (has_value(source[key])) {
      compact[key] = source[key];
    }
  }

  return compact;
}

function compact_anti_pattern(pattern: unknown): unknown {
  if (typeof pattern === "string") return pattern;
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) return pattern;

  const source = pattern as Record<string, unknown>;
  const compact: Record<string, unknown> = {};

  for (const key of ["_bad", "_reason"] as const) {
    if (has_value(source[key])) {
      compact[key] = source[key];
    }
  }

  return compact;
}

function compact_example(example: unknown): unknown {
  if (!example || typeof example !== "object" || Array.isArray(example)) return example;
  return example;
}

function format_json_section(title: string, value: unknown): string[] {
  if (!has_value(value)) return [];

  return [
    `${title}:`,
    compact_json(value),
  ];
}

function format_skill(skill: VibeSkillDocument, max_chars: number): string {
  const lines: string[] = [
    "identity:",
    format_identity(skill),
    ...format_string_array_section("priority_rules", skill._priority_rules),
    ...format_string_array_section("core_rules", skill._core_rules),
    ...format_json_section("fields", skill._fields),
    ...format_json_section("exports", skill._exports),
  ];

  const patterns = compact_array(skill._patterns, MAX_PATTERN_ITEMS).map(compact_pattern);
  if (patterns.length > 0) {
    lines.push("patterns:", compact_json(patterns));
  }

  const canonical_examples = compact_array(skill._canonical_examples, MAX_EXAMPLE_ITEMS).map(compact_example);
  if (canonical_examples.length > 0) {
    lines.push("canonical_examples:", compact_json(canonical_examples));
  }

  const anti_patterns = compact_array(skill._anti_patterns, MAX_PATTERN_ITEMS).map(compact_anti_pattern);
  if (anti_patterns.length > 0) {
    lines.push("anti_patterns:", compact_json(anti_patterns));
  }

  return truncate_text(lines.join("\n"), max_chars);
}

function output_contract_for_artifact(artifact_type: VibeArtifactType): string {
  if (artifact_type === "flow") {
    return '{ "_flow": { "_id": "...", "_steps": [] } }';
  }

  if (artifact_type === "entity") {
    return '{ "_entity": { "_id": "...", "_schema": {} } }';
  }

  if (artifact_type === "command") {
    return '{ "_command": { "_module": "...", "_op": "...", "_params": {} } }';
  }

  return '{ "_view": { "_id": "...", "_type": "view", "_children": [] } }';
}

function artifact_rule(artifact_type: VibeArtifactType): string {
  if (artifact_type === "flow") {
    return 'Root MUST be { "_flow": { "_id": "...", "_steps": [...] } }.';
  }

  if (artifact_type === "entity") {
    return 'Root MUST be { "_entity": { "_id": "...", "_schema": {...} } }.';
  }

  if (artifact_type === "command") {
    return 'Root MUST be { "_command": { "_module": "...", "_op": "...", "_params": {...} } }.';
  }

  return 'Root MUST be { "_view": { "_id": "...", "_type": "view", "_children": [...] } }.';
}

export function infer_artifact_type(
  prompt: string,
  requested_artifact_type?: VibeRequestedArtifactType,
): VibeArtifactType {
  if (
    requested_artifact_type === "view" ||
    requested_artifact_type === "flow" ||
    requested_artifact_type === "entity" ||
    requested_artifact_type === "command"
  ) {
    return requested_artifact_type;
  }

  const normalized_prompt = prompt.toLowerCase();

  if (/\b(view|screen|page|ui)\b/.test(normalized_prompt)) return "view";
  if (/\b(flow|workflow|steps)\b/.test(normalized_prompt)) return "flow";
  if (/\b(entity|schema|model)\b/.test(normalized_prompt)) return "entity";
  if (/\b(command|op)\b/.test(normalized_prompt)) return "command";

  return "view";
}

export class VibePromptBuilder {
  private readonly max_skill_prompt_chars: number;

  constructor(opts: { _max_skill_prompt_chars?: number } = {}) {
    this.max_skill_prompt_chars = opts._max_skill_prompt_chars ?? DEFAULT_MAX_SKILL_PROMPT_CHARS;
  }

  build(input: VibePromptBuildInput): string {
    const skills_block = input.selection.skills.length > 0
      ? input.selection.skills
          .map((skill) => format_skill(skill, this.max_skill_prompt_chars))
          .join("\n\n---\n\n")
      : "No dynamic skills selected.";
    const output_contract = output_contract_for_artifact(input._artifact_type);

    return [
      "You are an Xpell JSON artifact generator.",
      "Return ONLY JSON.",
      "",
      "STRICT RULES:",
      "1. Output MUST be valid JSON.",
      "2. DO NOT return markdown.",
      "3. DO NOT return explanations.",
      "4. DO NOT return HTML, CSS, JavaScript, or framework code.",
      "5. Use only data-only Xpell JSON.",
      `6. ${artifact_rule(input._artifact_type)}`,
      "7. Runtime-managed fields must use _snake_case.",
      "8. No functions, only JSON-compatible data.",
      "9. Deterministic output only.",
      "",
      `Generation Mode: ${input._mode}`,
      `Artifact Type: ${input._artifact_type}`,
      "",
      "Selected Skill IDs:",
      input.selection.skill_ids.join(", "),
      "",
      "Selected Skills:",
      skills_block,
      "",
      "User Task:",
      input.prompt,
      "",
      "OUTPUT CONTRACT:",
      `Return ONLY this shape: ${output_contract}`,
    ].join("\n");
  }
}
