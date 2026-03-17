---
name: sap-cloud-sdk-ai
description: |
  SAP Cloud SDK for AI skill. Use when consuming SAP AI Core and Generative AI Hub
  via the @sap-ai-sdk/ai-api, @sap-ai-sdk/foundation-models, @sap-ai-sdk/orchestration
  packages in Node.js/TypeScript. Covers LLM orchestration, embedding generation,
  prompt templating, content filtering, and multi-provider LLM abstraction.

  Keywords: sap cloud sdk ai, ai sdk, @sap-ai-sdk, foundation models, orchestration,
  content filtering, llm abstraction, azure openai, gen ai hub, embedding, langchain sap
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  sdk_version: "@sap-ai-sdk/* 1.x"
---

# SAP Cloud SDK for AI

## Installation
```bash
npm install @sap-ai-sdk/ai-api
npm install @sap-ai-sdk/foundation-models   # LLM + embedding calls
npm install @sap-ai-sdk/orchestration        # Orchestration pipeline
npm install @sap-ai-sdk/langchain            # LangChain integration
```

## Foundation Models — Chat Completion
```typescript
import { OpenAiChatClient } from '@sap-ai-sdk/foundation-models';

const client = new OpenAiChatClient({ modelName: 'gpt-4o' });

const response = await client.run({
  messages: [
    { role: 'system', content: 'You are an SAP BTP expert assistant.' },
    { role: 'user',   content: 'What is the difference between CAP and RAP?' }
  ],
  max_tokens: 800,
  temperature: 0.2
});

console.log(response.getContent());
console.log(`Tokens used: ${response.getTokenUsage().total_tokens}`);
```

## Orchestration Pipeline (RAG + Filtering)
```typescript
import { OrchestrationClient, buildDocumentGroundingConfig } from '@sap-ai-sdk/orchestration';

const orchestrationClient = new OrchestrationClient({
  llm: {
    model_name: 'gpt-4o',
    model_params: { max_tokens: 1000, temperature: 0.1 }
  },
  templating: {
    template: [
      { role: 'system', content: 'Answer using only provided context.' },
      { role: 'user',   content: '{{?query}}' }
    ]
  },
  grounding: buildDocumentGroundingConfig({
    inputParams: ['query'],
    outputParam: 'groundingOutput',
    filters: [{ dataRepositoryType: 'vector', dataRepositoryId: 'hr-policies' }]
  }),
  filtering: {
    input:  { filters: [{ type: 'azure_content_safety', config: { Hate: 0, SelfHarm: 0, Sexual: 0, Violence: 0 } }] },
    output: { filters: [{ type: 'azure_content_safety' }] }
  }
});

const result = await orchestrationClient.chatCompletion({
  inputParams: { query: 'What is the parental leave policy?' }
});
console.log(result.getContent());
```

## Embeddings
```typescript
import { OpenAiEmbeddingClient } from '@sap-ai-sdk/foundation-models';

const embeddingClient = new OpenAiEmbeddingClient({ modelName: 'text-embedding-3-small' });

const response = await embeddingClient.run({
  input: ['SAP CAP is a framework for cloud applications', 'HANA Cloud is an in-memory database']
});

const vectors = response.getEmbeddings();
console.log(`Embedding dimensions: ${vectors[0].length}`); // 1536
```

## LangChain Integration
```typescript
import { ChatOpenAI } from '@sap-ai-sdk/langchain';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const llm = new ChatOpenAI({ modelName: 'gpt-4o', maxTokens: 500 });

const result = await llm.invoke([
  new SystemMessage('You are an SAP integration expert.'),
  new HumanMessage('How do I configure an SFTP adapter in Cloud Integration?')
]);
console.log(result.content);

// With streaming
const stream = await llm.stream([new HumanMessage('Explain iFlow error handling')]);
for await (const chunk of stream) {
  process.stdout.write(chunk.content as string);
}
```

## AI API Management
```typescript
import { AiApiClient } from '@sap-ai-sdk/ai-api';

const aiClient = new AiApiClient();

// List deployments
const deployments = await aiClient.deployment.query({ resourceGroup: 'default' });
deployments.resources.forEach(d =>
  console.log(`${d.id}: ${d.scenarioId} — ${d.status}`)
);

// Get model by name
const models = await aiClient.model.query({ resourceGroup: 'default' });
const gpt4o = models.resources.find(m => m.name === 'gpt-4o');
```

## Documentation Links
- SDK GitHub: https://github.com/SAP/ai-sdk-js
- npm packages: https://www.npmjs.com/search?q=%40sap-ai-sdk
- GenAI Hub Docs: https://help.sap.com/docs/generative-ai-hub
