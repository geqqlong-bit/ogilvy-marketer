import fs from 'fs';
import path from 'path';

function parseArgs(argv) {
  const params = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      params[key] = next;
      i += 1;
    } else {
      params[key] = true;
    }
  }
  return params;
}

function env(name, fallback) {
  return process.env[name] || fallback;
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Usage: node ogilvy-cli.mjs [options]\n\nOptions:\n  --projectName <text>\n  --productName <text>\n  --brief <text>\n  --objective <text>\n  --targetAudience <text>\n  --primaryPlatform <text>\n  --brandTone <text>\n  --templateId <launch_cn|promotion_cn|content_matrix_cn|weekly_report_cn>\n  --model <model>\n  --out <file>\n`);
    process.exit(0);
  }

  const marketerclawUrl = env('OGILVY_MARKETERCLAW_URL', 'http://127.0.0.1:8787');
  const llmBaseUrl = env('OGILVY_LLM_BASE_URL', 'http://127.0.0.1:8999/v1');
  const llmApiKey = env('OGILVY_LLM_API_KEY', 'test-key');
  const defaultModel = env('OGILVY_DEFAULT_MODEL', 'bailian/qwen3.5-plus');
  const temperature = toNumber(env('OGILVY_TEMPERATURE', '0.7'), 0.7);
  const maxTokens = toNumber(env('OGILVY_MAX_TOKENS', '4000'), 4000);
  const timeoutMs = toNumber(env('OGILVY_TIMEOUT_MS', '120000'), 120000);

  const {
    projectName = 'Marketing Research Task',
    productName = 'Unknown Product',
    brief = 'Run a broad market and competitor scan.',
    objective = 'Provide strategic insight and actionable marketing recommendations.',
    targetAudience = 'General consumers',
    primaryPlatform = 'Xiaohongshu',
    brandTone = 'Professional and objective',
    templateId = 'content_matrix_cn',
    model = defaultModel,
    out
  } = args;

  console.log(`[Ogilvy] Connecting to MarketerClaw: ${marketerclawUrl}`);
  const setupRes = await fetch(`${marketerclawUrl}/api/workflows/setup`);
  if (!setupRes.ok) {
    console.error(`[Ogilvy] Could not reach setup endpoint: ${setupRes.status} ${setupRes.statusText}`);
    process.exit(1);
  }

  const setup = await setupRes.json();
  const selectedTemplate = setup.templates.find((t) => t.id === templateId) || setup.templates[0];

  const roles = setup.roles.map((role) => ({
    roleId: role.id,
    enabled: true,
    displayName: role.label,
    model: {
      mode: 'openai',
      baseUrl: llmBaseUrl,
      apiKey: llmApiKey,
      model,
      temperature,
      maxTokens,
      timeoutMs,
      systemPrompt: role.defaultPrompt
    }
  }));

  const payload = {
    campaign: {
      projectName,
      productName,
      brief,
      objective,
      targetAudience,
      primaryPlatform,
      secondaryPlatforms: [],
      campaignWindow: 'near-term',
      regionFocus: 'China',
      brandTone,
      budgetRange: 'TBD',
      kpis: 'Brand awareness, consideration, and conversion efficiency',
      deliverableSpec: 'Structured markdown report with strategic recommendations',
      channelConstraints: '',
      riskNotes: '',
      productProofPoints: [],
      competitorNotes: [],
      competitorEntries: []
    },
    templateId: selectedTemplate.id,
    roles,
    workflowControl: {
      maxTokensPerStep: Math.max(maxTokens, 4096),
      maxDepth: 10,
      skipApprovals: true,
      humanInLoop: false
    }
  };

  console.log(`[Ogilvy] Starting workflow with template: ${selectedTemplate.id}`);
  const res = await fetch(`${marketerclawUrl}/api/workflows/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Ogilvy] Workflow start failed: ${text}`);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalMarkdown = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const line = part.split('\n').find((entry) => entry.startsWith('data: '));
      if (!line) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'stage_start') {
          console.log(`[Ogilvy] Stage: ${data.data.stageId}`);
        }
        if (data.type === 'step_complete' && data.data?.output) {
          console.log(`[Ogilvy] Step complete: ${data.data.roleId}`);
          finalMarkdown += `\n\n## ${data.data.roleId}\n\n${data.data.output}`;
        }
        if (data.type === 'workflow_done' && data.data?.finalOutput) {
          finalMarkdown += `\n\n# Final Output\n\n${data.data.finalOutput}`;
        }
        if (data.type === 'error') {
          console.error(`[Ogilvy] Workflow error: ${data.data?.message || 'unknown error'}`);
        }

        // Compatibility for current MarketerClaw SSE payloads
        if (data && data.roleId && data.content) {
          finalMarkdown += `\n\n## ${data.roleId}${data.outputTitle ? ` · ${data.outputTitle}` : ''}\n\n${data.content}`;
        }
        if (data && data.deliverables) {
          if (data.deliverables.strategySummary) {
            finalMarkdown += `\n\n# Strategy Summary\n\n${data.deliverables.strategySummary}`;
          }
          if (Array.isArray(data.deliverables.knowledgeCards) && data.deliverables.knowledgeCards.length) {
            finalMarkdown += `\n\n# Knowledge Cards\n\n- ${data.deliverables.knowledgeCards.join('\n- ')}`;
          }
          if (Array.isArray(data.review?.nextActions) && data.review.nextActions.length) {
            finalMarkdown += `\n\n# Next Actions\n\n- ${data.review.nextActions.join('\n- ')}`;
          }
        }
      } catch {
        // Ignore malformed chunks.
      }
    }
  }

  if (!finalMarkdown.trim()) {
    finalMarkdown = '# Ogilvy Output\n\nWorkflow completed, but no final markdown body was captured from the stream.';
  }

  if (out) {
    const outPath = path.resolve(process.cwd(), out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, finalMarkdown, 'utf8');
    console.log(`[Ogilvy] Wrote report to ${outPath}`);
  } else {
    console.log(finalMarkdown);
  }
}

main().catch((error) => {
  console.error('[Ogilvy] Fatal error:', error);
  process.exit(1);
});
