import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';

export const GET: APIRoute = async ({ request }) => {
  const password = request.headers.get('x-admin-password');
  if (password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const headers = [
    'name', 'type', 'path', 'description', 'category', 'tags',
    'platform', 'author', 'version', 'published', 'featured', 'github_url', 'content',
  ];

  const examples = [
    {
      name: 'SAP Integration Expert',
      type: 'agent',
      path: 'agents/integration-suite/sap-integration-expert',
      description: 'Specialist agent for SAP Integration Suite iFlow development and API management.',
      category: 'integration',
      tags: 'sap,integration,iflow,api',
      platform: 'claude',
      author: 'Consulting 2.0',
      version: '1.0.0',
      published: 'true',
      featured: 'false',
      github_url: '',
      content: `---
name: SAP Integration Expert
description: Specialist for SAP Integration Suite iFlow development
tools: Read, Write, Bash
---

You are an expert in SAP Integration Suite. Help users design and build iFlows, configure APIs, and troubleshoot integration issues.`,
    },
    {
      name: 'HANA SQL Expert',
      type: 'skill',
      path: 'skills/sap-btp/sap-hana-sql',
      description: 'Reusable skill for writing optimized SAP HANA SQL and SQLScript.',
      category: 'database',
      tags: 'sap,hana,sql,sqlscript',
      platform: 'claude',
      author: 'Consulting 2.0',
      version: '1.0.0',
      published: 'true',
      featured: 'false',
      github_url: '',
      content: `---
name: HANA SQL Expert
description: Write optimized HANA SQL and SQLScript
---

When writing HANA SQL: prefer column store tables, use calculation views for reporting, avoid row-by-row processing.`,
    },
    {
      name: 'Deploy to Cloud Foundry',
      type: 'command',
      path: 'commands/btp/deploy-cf',
      description: 'Slash command to deploy MTA projects to SAP BTP Cloud Foundry.',
      category: 'devops',
      tags: 'sap,btp,cf,deploy,mta',
      platform: 'claude',
      author: 'Consulting 2.0',
      version: '1.0.0',
      published: 'true',
      featured: 'false',
      github_url: '',
      content: `---
name: Deploy to Cloud Foundry
description: Deploy MTA to SAP BTP Cloud Foundry
argument-hint: "[space] [org]"
---

Run mbt build then cf deploy with the generated .mtar file. Check cf login status first.`,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(examples, { header: headers });

  // Column widths
  ws['!cols'] = [
    { wch: 30 }, // name
    { wch: 12 }, // type
    { wch: 45 }, // path
    { wch: 60 }, // description
    { wch: 18 }, // category
    { wch: 30 }, // tags
    { wch: 12 }, // platform
    { wch: 20 }, // author
    { wch: 10 }, // version
    { wch: 10 }, // published
    { wch: 10 }, // featured
    { wch: 40 }, // github_url
    { wch: 80 }, // content
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Components');

  // Add a Notes sheet
  const notes = [
    { Field: 'name', Required: 'Yes', Description: 'Display name of the component' },
    { Field: 'type', Required: 'Yes', Description: 'One of: skill, agent, command, hook, mcp, setting, template' },
    { Field: 'path', Required: 'Yes', Description: 'Unique slug e.g. agents/integration-suite/my-agent' },
    { Field: 'description', Required: 'No', Description: 'Short description shown on cards' },
    { Field: 'category', Required: 'No', Description: 'Category e.g. integration, devops, database' },
    { Field: 'tags', Required: 'No', Description: 'Comma-separated tags e.g. sap,btp,hana' },
    { Field: 'platform', Required: 'No', Description: 'claude | joule | both (default: claude)' },
    { Field: 'author', Required: 'No', Description: 'Author name (default: Consulting 2.0)' },
    { Field: 'version', Required: 'No', Description: 'Version string (default: 1.0.0)' },
    { Field: 'published', Required: 'No', Description: 'true | false (default: true)' },
    { Field: 'featured', Required: 'No', Description: 'true | false (default: false)' },
    { Field: 'github_url', Required: 'No', Description: 'GitHub repository URL if applicable' },
    { Field: 'content', Required: 'No', Description: 'Full markdown content of the component' },
  ];
  const wsNotes = XLSX.utils.json_to_sheet(notes);
  wsNotes['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Field Guide');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="c20-import-template.xlsx"',
    },
  });
};
