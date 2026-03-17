#!/usr/bin/env node
/**
 * Generates/updates dashboard/public/components.json
 * by scanning cli-tool/components/ for all agents and skills.
 *
 * Run: node generate-components.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT          = __dirname;
const AGENTS_DIR    = path.join(ROOT, 'cli-tool/components/agents');
const SKILLS_DIR    = path.join(ROOT, 'cli-tool/components/skills');
const OUTPUT_FILE   = path.join(ROOT, 'dashboard/public/components.json');

// ── Helpers ───────────────────────────────────────────────────────────────

function extractFrontmatterField(content, field) {
  // Handles both single-line and multi-line (|) YAML values
  const singleLine = new RegExp(`^${field}:\\s*["']?([^\\n"']+)["']?`, 'm');
  const blockStart = new RegExp(`^${field}:\\s*\\|`, 'm');

  const blockMatch = blockStart.test(content);
  if (blockMatch) {
    // Collect indented lines after the "field: |" line
    const afterField = content.split(new RegExp(`^${field}:\\s*\\|\\s*\\n`, 'm'))[1] || '';
    const lines = [];
    for (const line of afterField.split('\n')) {
      if (/^\s+/.test(line)) lines.push(line.trim());
      else break;
    }
    return lines.join(' ').trim();
  }

  const m = content.match(singleLine);
  return m ? m[1].trim() : '';
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { description: '', name: '' };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { description: '', name: '' };
  const fm = content.slice(0, end + 4);
  return {
    name:        extractFrontmatterField(fm, 'name'),
    description: extractFrontmatterField(fm, 'description'),
  };
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, callback);
    else callback(full);
  }
}

// ── Scan agents ───────────────────────────────────────────────────────────

function scanAgents() {
  const agents = [];
  if (!fs.existsSync(AGENTS_DIR)) return agents;

  for (const categoryEntry of fs.readdirSync(AGENTS_DIR, { withFileTypes: true })) {
    if (!categoryEntry.isDirectory()) continue;
    const category = categoryEntry.name;
    const categoryPath = path.join(AGENTS_DIR, category);

    for (const file of fs.readdirSync(categoryPath)) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(categoryPath, file);
      const content  = fs.readFileSync(filePath, 'utf-8');
      const { name, description } = parseFrontmatter(content);
      const agentName = name || file.replace(/\.md$/, '');

      agents.push({
        name:        agentName,
        path:        `${category}/${file}`,
        category,
        type:        'agent',
        content,
        description,
        author:      '',
        repo:        '',
        version:     '',
        license:     '',
        keywords:    [],
        downloads:   0,
        security: {
          validated: false, valid: null, score: null,
          errorCount: 0, warningCount: 0, lastValidated: null,
        },
      });
    }
  }
  return agents;
}

// ── Scan skills ───────────────────────────────────────────────────────────

function scanSkills() {
  const skills = [];
  if (!fs.existsSync(SKILLS_DIR)) return skills;

  // Walk all SKILL.md files under skills/
  walkDir(SKILLS_DIR, (filePath) => {
    if (path.basename(filePath) !== 'SKILL.md') return;

    const content      = fs.readFileSync(filePath, 'utf-8');
    const { name, description } = parseFrontmatter(content);

    // Derive category and skill-name from directory structure
    // e.g. skills/sap-btp/sap-abap/SKILL.md  → category=sap-btp, name=sap-abap
    //      skills/development/foo/SKILL.md    → category=development, name=foo
    const rel      = path.relative(SKILLS_DIR, filePath);   // sap-btp/sap-abap/SKILL.md
    const parts    = rel.split(path.sep);                   // ['sap-btp','sap-abap','SKILL.md']
    const category = parts.length >= 3 ? parts[0] : 'skills';
    const skillDir = parts.length >= 3 ? parts[1] : parts[0];
    const skillName = name || skillDir;

    skills.push({
      name:        skillName,
      path:        `${category}/${skillDir}`,
      category,
      type:        'skill',
      content,
      description,
      author:      '',
      repo:        '',
      version:     '',
      license:     '',
      keywords:    [],
      downloads:   0,
      security: {
        validated: false, valid: null, score: null,
        errorCount: 0, warningCount: 0, lastValidated: null,
      },
      references:  [],
    });
  });

  return skills;
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading existing components.json ...');
  const raw      = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  const existing = JSON.parse(raw);

  console.log(`Existing: agents=${existing.agents.length}, skills=${existing.skills.length}`);

  // Build sets of already-present paths so we don't duplicate
  const existingAgentPaths = new Set(existing.agents.map(a => a.path));
  const existingSkillPaths = new Set(existing.skills.map(s => s.path));

  // Scan new content
  const newAgents = scanAgents().filter(a => !existingAgentPaths.has(a.path));
  const newSkills = scanSkills().filter(s => !existingSkillPaths.has(s.path));

  console.log(`New BTP agents to add: ${newAgents.length}`);
  console.log(`New BTP skills to add: ${newSkills.length}`);

  if (newAgents.length === 0 && newSkills.length === 0) {
    // Re-scan and REPLACE existing BTP entries (for content updates)
    console.log('All paths already present — updating existing BTP entries...');
    const updatedAgents = scanAgents();
    const updatedSkills = scanSkills();

    const updatedAgentMap = new Map(updatedAgents.map(a => [a.path, a]));
    const updatedSkillMap = new Map(updatedSkills.map(s => [s.path, s]));

    existing.agents = existing.agents.map(a => updatedAgentMap.get(a.path) ?? a);
    existing.skills = existing.skills.map(s => updatedSkillMap.get(s.path) ?? s);

    // Add any genuinely new ones
    for (const [p, a] of updatedAgentMap) {
      if (!existingAgentPaths.has(p)) existing.agents.push(a);
    }
    for (const [p, s] of updatedSkillMap) {
      if (!existingSkillPaths.has(p)) existing.skills.push(s);
    }
  } else {
    existing.agents = [...existing.agents, ...newAgents];
    existing.skills = [...existing.skills, ...newSkills];
  }

  console.log(`Final: agents=${existing.agents.length}, skills=${existing.skills.length}`);
  console.log('Writing components.json ...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
  console.log('Done.');

  // Summary by category
  const btpAgents = existing.agents.filter(a =>
    ['integration-suite','cap-development','abap-cloud','btp-devops','hana-cloud',
     'btp-security','ai-foundation','fiori-ui5','btp-architecture','event-mesh','sap-build'].includes(a.category)
  );
  const btpSkills = existing.skills.filter(s => s.category === 'sap-btp');
  console.log(`\nBTP agents in JSON: ${btpAgents.length}`);
  console.log(`BTP skills in JSON: ${btpSkills.length}`);
  for (const a of btpAgents) console.log(`  agent: ${a.category}/${a.name}`);
  for (const s of btpSkills) console.log(`  skill: ${s.name}`);
}

main();
