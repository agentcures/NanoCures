#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const STAGE_INDEX = {
  web_search: 0,
  web_fetch: 0,
  refua_data_list: 0,
  refua_data_fetch: 0,
  refua_data_materialize: 0,
  refua_data_query: 0,
  refua_validate_spec: 1,
  refua_fold: 2,
  refua_affinity: 2,
  refua_antibody_design: 2,
  refua_protein_properties: 2,
  refua_admet_profile: 3,
  refua_clinical_simulator: 4,
  refua_job: 5,
};

const EVIDENCE_TOOLS = new Set([
  'web_search',
  'web_fetch',
  'refua_data_list',
  'refua_data_fetch',
  'refua_data_materialize',
  'refua_data_query',
]);

const HYPOTHESIS_TOOLS = new Set([
  'refua_fold',
  'refua_affinity',
  'refua_antibody_design',
  'refua_admet_profile',
  'refua_clinical_simulator',
]);

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  }

  return { command, positional, flags };
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(inputPath) {
  const raw =
    !inputPath || inputPath === '-'
      ? fs.readFileSync(0, 'utf8')
      : fs.readFileSync(inputPath, 'utf8');
  return JSON.parse(raw);
}

function writeOutput(data, outputPath) {
  const rendered =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n';
  if (outputPath) {
    ensureDir(outputPath);
    fs.writeFileSync(outputPath, rendered);
  } else {
    process.stdout.write(rendered);
  }
}

function asBool(value, fallback = false) {
  if (value === undefined) return fallback;
  if (value === true) return true;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boundedScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
}

function validatePlan(plan, policy) {
  const calls = Array.isArray(plan?.calls) ? plan.calls : [];
  const errors = [];
  const warnings = [];

  if (calls.length === 0) {
    warnings.push('plan contains no calls');
  }

  if (calls.length > policy.max_calls) {
    errors.push(`call budget exceeded: ${calls.length} > ${policy.max_calls}`);
  }

  if (policy.require_validate_first && calls.length > 0) {
    const firstTool = String(calls[0]?.tool || '').trim();
    if (firstTool !== 'refua_validate_spec') {
      errors.push('first call must be refua_validate_spec');
    }
  }

  if (policy.enforce_stage_progression) {
    let lastStage = -1;
    for (const call of calls) {
      const tool = String(call?.tool || '').trim();
      const stage = STAGE_INDEX[tool];
      if (stage === undefined) {
        warnings.push(`unknown tool for stage progression: ${tool}`);
        continue;
      }
      if (stage < lastStage) {
        errors.push(
          `stage regression detected: tool ${tool} appears after a later-stage tool`,
        );
      }
      lastStage = Math.max(lastStage, stage);
    }
  }

  if (policy.require_evidence_before_hypothesis) {
    let sawEvidence = false;
    for (const call of calls) {
      const tool = String(call?.tool || '').trim();
      if (EVIDENCE_TOOLS.has(tool)) sawEvidence = true;
      if (HYPOTHESIS_TOOLS.has(tool) && !sawEvidence) {
        errors.push(
          `hypothesis tool ${tool} appears before evidence-gathering tools`,
        );
        break;
      }
    }
  }

  return {
    approved: errors.length === 0,
    errors,
    warnings,
    stats: {
      call_count: calls.length,
      tools: calls.map((call) => call.tool).filter(Boolean),
    },
  };
}

function rankPortfolio(payload, flags) {
  const diseases = Array.isArray(payload) ? payload : payload?.diseases;
  if (!Array.isArray(diseases)) {
    fail('portfolio input must be an array or an object with a diseases array');
  }

  const weights = {
    burden: boundedScore(flags['weight-burden'] ?? 0.35),
    tractability: boundedScore(flags['weight-tractability'] ?? 0.25),
    unmet_need: boundedScore(flags['weight-unmet-need'] ?? 0.2),
    translational_readiness: boundedScore(
      flags['weight-translational-readiness'] ?? 0.1,
    ),
    novelty: boundedScore(flags['weight-novelty'] ?? 0.1),
  };

  const voiWeight = asNumber(flags['voi-weight'], 0.15);
  const totalBudget =
    flags['total-budget'] === undefined
      ? null
      : asNumber(flags['total-budget'], null);

  const ranked = diseases
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const burden = boundedScore(item.burden);
      const tractability = boundedScore(item.tractability);
      const unmetNeed = boundedScore(item.unmet_need);
      const translational = boundedScore(item.translational_readiness);
      const novelty = boundedScore(item.novelty);
      const voi = boundedScore(item.voi ?? item.value_of_information);
      const score =
        weights.burden * burden +
        weights.tractability * tractability +
        weights.unmet_need * unmetNeed +
        weights.translational_readiness * translational +
        weights.novelty * novelty;
      const expectedValue = score * (1 + Math.max(0, voiWeight) * voi);
      return {
        name: String(item.name || item.disease || 'unknown'),
        score: Number(score.toFixed(6)),
        expected_value: Number(expectedValue.toFixed(6)),
        rationale: [
          `burden=${burden.toFixed(3)}`,
          `tractability=${tractability.toFixed(3)}`,
          `unmet_need=${unmetNeed.toFixed(3)}`,
          `translational_readiness=${translational.toFixed(3)}`,
          `novelty=${novelty.toFixed(3)}`,
          `voi=${voi.toFixed(3)}`,
        ],
        raw: item,
      };
    })
    .sort(
      (a, b) =>
        b.expected_value - a.expected_value || b.score - a.score || a.name.localeCompare(b.name),
    );

  if (totalBudget !== null) {
    const totalEv = ranked.reduce(
      (sum, item) => sum + Math.max(item.expected_value, 0),
      0,
    );
    for (const item of ranked) {
      const fraction = totalEv > 0 ? item.expected_value / totalEv : 0;
      item.allocation_fraction = Number(fraction.toFixed(6));
      item.recommended_budget = Number((totalBudget * fraction).toFixed(4));
      item.decision = item.score >= 0.45 ? 'advance' : 'watch';
    }
  } else {
    for (const item of ranked) {
      item.decision = item.score >= 0.45 ? 'advance' : 'watch';
    }
  }

  return {
    ranked,
    weights,
    voi_weight: voiWeight,
    total_budget: totalBudget,
    generated_at: new Date().toISOString(),
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildHandoff(run) {
  const cures = normalizeArray(run.promising_cures);
  const targets = normalizeArray(run.interesting_targets);
  const nextActions = normalizeArray(run.next_actions);
  const refs = normalizeArray(run.references);
  const lines = [];
  lines.push(`# Translational Handoff`);
  lines.push('');
  lines.push(`Objective: ${run.objective || 'unspecified'}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`## Prioritized Targets`);
  if (targets.length === 0) {
    lines.push('- None recorded');
  } else {
    for (const item of targets) {
      lines.push(
        `- ${item.name || item.target || 'unnamed target'}: ${item.assessment || item.summary || 'no assessment provided'}`,
      );
    }
  }
  lines.push('');
  lines.push(`## Promising Cures`);
  if (cures.length === 0) {
    lines.push('- None recorded');
  } else {
    for (const item of cures) {
      const name = item.name || item.candidate || item.candidate_slug || 'unnamed candidate';
      const disease = item.disease || item.disease_slug || 'unspecified disease';
      lines.push(`- ${name} for ${disease}: ${item.assessment || 'assessment pending'}`);
    }
  }
  lines.push('');
  lines.push(`## Next Actions`);
  if (nextActions.length === 0) {
    lines.push('- No next actions recorded');
  } else {
    for (const action of nextActions) {
      lines.push(`- ${typeof action === 'string' ? action : JSON.stringify(action)}`);
    }
  }
  lines.push('');
  lines.push(`## References`);
  if (refs.length === 0) {
    lines.push('- No references recorded');
  } else {
    for (const ref of refs) {
      lines.push(`- ${typeof ref === 'string' ? ref : JSON.stringify(ref)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function buildRegulatoryBundle(run) {
  const cures = normalizeArray(run.promising_cures);
  const targets = normalizeArray(run.interesting_targets);
  const evidence = normalizeArray(run.evidence);
  const risks = normalizeArray(run.risks);
  const references = normalizeArray(run.references);

  return {
    objective: run.objective || null,
    generated_at: new Date().toISOString(),
    claims: [
      ...targets.map((item) => ({
        type: 'target',
        name: item.name || item.target || null,
        claim: item.assessment || item.summary || null,
      })),
      ...cures.map((item) => ({
        type: 'candidate',
        name: item.name || item.candidate || item.candidate_slug || null,
        claim: item.assessment || null,
      })),
    ],
    evidence_summary: evidence,
    risks,
    references,
  };
}

function loadTrials(storePath) {
  if (!fs.existsSync(storePath)) {
    return { version: 1, last_updated: '', trials: [] };
  }
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function saveTrials(storePath, payload) {
  payload.last_updated = new Date().toISOString();
  ensureDir(storePath);
  fs.writeFileSync(storePath, JSON.stringify(payload, null, 2) + '\n');
}

function trialCommand(action, flags) {
  const storePath = flags.store || 'groups/main/trials/clinical-trials.json';
  const payload = loadTrials(storePath);
  payload.trials = normalizeArray(payload.trials);

  if (action === 'list') {
    return payload;
  }

  if (action === 'add') {
    const trial = {
      trial_id: flags['trial-id'] || fail('--trial-id is required'),
      title: flags.title || '',
      phase: flags.phase || '',
      indication: flags.indication || '',
      status: flags.status || 'planned',
      source_url: flags['source-url'] || '',
      notes: flags.notes || '',
      updated_at: new Date().toISOString(),
    };
    payload.trials = payload.trials.filter((item) => item.trial_id !== trial.trial_id);
    payload.trials.push(trial);
    saveTrials(storePath, payload);
    return payload;
  }

  if (action === 'update') {
    const trialId = flags['trial-id'] || fail('--trial-id is required');
    const existing = payload.trials.find((item) => item.trial_id === trialId);
    if (!existing) fail(`trial not found: ${trialId}`);
    for (const key of ['title', 'phase', 'indication', 'status', 'source-url', 'notes']) {
      if (flags[key] === undefined) continue;
      const targetKey = key === 'source-url' ? 'source_url' : key;
      existing[targetKey] = flags[key];
    }
    existing.updated_at = new Date().toISOString();
    saveTrials(storePath, payload);
    return payload;
  }

  fail(`unknown trial action: ${action}`);
}

function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'validate-plan': {
      const payload = readJson(positional[0]);
      const policy = {
        max_calls: asNumber(flags['max-calls'], 10),
        require_validate_first: asBool(flags['require-validate-first'], false),
        enforce_stage_progression: asBool(flags['enforce-stage-progression'], false),
        require_evidence_before_hypothesis: asBool(
          flags['require-evidence-before-hypothesis'],
          false,
        ),
      };
      const result = validatePlan(payload, policy);
      result.policy = policy;
      writeOutput(result, flags.output);
      return;
    }
    case 'rank-portfolio': {
      const payload = readJson(positional[0]);
      writeOutput(rankPortfolio(payload, flags), flags.output);
      return;
    }
    case 'translational-handoff': {
      const payload = readJson(positional[0]);
      writeOutput(buildHandoff(payload), flags.output);
      return;
    }
    case 'regulatory-bundle': {
      const payload = readJson(positional[0]);
      writeOutput(buildRegulatoryBundle(payload), flags.output);
      return;
    }
    case 'trials-list': {
      writeOutput(trialCommand('list', flags), flags.output);
      return;
    }
    case 'trials-add': {
      writeOutput(trialCommand('add', flags), flags.output);
      return;
    }
    case 'trials-update': {
      writeOutput(trialCommand('update', flags), flags.output);
      return;
    }
    default:
      fail(
        `usage: nanocures-cli.mjs <validate-plan|rank-portfolio|translational-handoff|regulatory-bundle|trials-list|trials-add|trials-update> ...`,
      );
  }
}

main();
