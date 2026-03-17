---
name: sap-ai-core
description: |
  SAP AI Core skill for deploying and operating ML models on SAP BTP AI Foundation.
  Use when configuring AI Core resource groups, creating serving templates and training
  workflows, managing model deployments via AI API, consuming GenAI Hub LLMs
  (GPT-4o, Claude, Gemini, Mistral), implementing RAG with Document Grounding,
  setting up AI Launchpad, or using the AI Core Python/JavaScript SDK.

  Keywords: sap ai core, ai foundation, genai hub, llm, gpt-4o, claude, gemini,
  serving template, training pipeline, argo workflow, ai api, deployment, resource group,
  document grounding, rag, vector store, ai launchpad, orchestration
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/sap-ai-core
---

# SAP AI Core & Generative AI Hub Skill

## Related Skills
- **sap-cloud-sdk-ai**: SAP Cloud SDK for AI to consume GenAI Hub from Node.js/Python
- **sap-cap-capire**: Integrating AI capabilities into CAP services
- **sap-btp-cloud-platform**: BTP subaccount setup for AI Core entitlements

## GenAI Hub — Available Models

| Model | Provider | Best For |
|---|---|---|
| GPT-4o | Azure OpenAI | Complex reasoning, multimodal |
| Claude 3.5 Sonnet | Anthropic | Long context, nuanced analysis |
| Gemini 1.5 Pro | Google | Large context, multimodal |
| Mistral Large | Mistral AI | Structured extraction, cost-efficient |
| Meta LLaMA 3 | Meta | Open-weight, fine-tuning |

## Quick Start — Node.js with AI Core SDK
```javascript
const { AzureOpenAI } = require('openai');
const xsenv = require('@sap/xsenv');

// Get credentials from BTP service binding
const { aicore } = xsenv.getServices({ aicore: { tag: 'aicore' } });

async function getAccessToken(creds) {
  const res = await fetch(`${creds.url}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientid,
      client_secret: creds.clientsecret
    })
  });
  const { access_token } = await res.json();
  return access_token;
}

const client = new AzureOpenAI({
  baseURL: `${aicore.serviceurls.AI_API_URL}/v2/inference/deployments/${process.env.DEPLOYMENT_ID}`,
  apiKey: await getAccessToken(aicore),
  apiVersion: '2024-02-01',
  defaultHeaders: { 'AI-Resource-Group': 'default' }
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful SAP BTP expert.' },
    { role: 'user',   content: 'Explain CAP multitenancy in 3 sentences.' }
  ],
  temperature: 0.2,
  max_tokens: 500
});
console.log(response.choices[0].message.content);
```

## Python SDK
```python
from gen_ai_hub.proxy.core.proxy_clients import get_proxy_client
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI

proxy_client = get_proxy_client('gen-ai-hub')

# Using LangChain integration
llm = ChatOpenAI(proxy_model_name='gpt-4o', proxy_client=proxy_client)
result = llm.invoke("Summarise the key benefits of SAP BTP Integration Suite.")
print(result.content)
```

## Serving Template (Custom ML Model)
```yaml
apiVersion: ai.sap.com/v1alpha1
kind: ServingTemplate
metadata:
  name: invoice-classifier-serving
  annotations:
    scenarios.ai.sap.com/name: "invoice-classification"
    executables.ai.sap.com/name: "invoice-classifier"
spec:
  inputs:
    parameters:
      - name: modelVersion
        type: string
        default: "latest"
  template:
    apiVersion: "serving.kserve.io/v1beta1"
    spec:
      predictor:
        containers:
          - name: kserve-container
            image: your-registry.azurecr.io/invoice-classifier:{{inputs.parameters.modelVersion}}
            ports:
              - containerPort: 8080
            resources:
              limits:   { memory: "2Gi", cpu: "1" }
              requests: { memory: "1Gi", cpu: "500m" }
```

## AI Orchestration with Document Grounding (RAG)
```python
from ai_core_sdk.ai_core_v2_client import AICoreV2Client
import json

client = AICoreV2Client(
    base_url=AI_CORE_URL,
    auth_url=AUTH_URL,
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
)

# Create orchestration deployment with grounding
orchestration_config = {
    "module_configurations": {
        "llm_module_config": {
            "model_name": "gpt-4o",
            "model_params": { "temperature": 0.1, "max_tokens": 1000 }
        },
        "grounding_module_config": {
            "type": "document_grounding_service",
            "config": {
                "input_params": ["query"],
                "output_param": "grounded_context",
                "filters": [{
                    "data_repository_type": "vector",
                    "data_repository_id": "your-vector-repo-id"
                }]
            }
        },
        "templating_module_config": {
            "template": [
                { "role": "system", "content": "You are a SAP BTP expert. Use the provided context only." },
                { "role": "user",   "content": "Context: {{?grounded_context}}\n\nQuestion: {{?query}}" }
            ]
        }
    }
}
```

## AI API — Deploy and Call
```bash
# List available models in GenAI Hub
curl -X GET "${AI_API_URL}/v2/lm/models" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "AI-Resource-Group: default"

# Create deployment from configuration
curl -X POST "${AI_API_URL}/v2/lm/deployments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "AI-Resource-Group: default" \
  -H "Content-Type: application/json" \
  -d '{ "configurationId": "your-config-id" }'

# Chat completion via deployment
curl -X POST "${DEPLOYMENT_URL}/chat/completions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "Hello" }]
  }'
```

## Resource Group Management
```python
# Create resource group (tenant isolation)
client.resource_groups.create(resource_group_id="production")

# Register Docker secret
client.docker_registry_secrets.create(
    name="my-registry",
    data={ ".dockerconfigjson": json.dumps(docker_config) }
)

# Register object store (for model artefacts)
client.object_store_secrets.create(
    name="s3-store",
    data={
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "...",
        "AWS_DEFAULT_REGION": "eu-central-1",
        "ARN": "arn:aws:s3:::my-ai-bucket"
    }
)
```

## Documentation Links
- SAP AI Core: https://help.sap.com/docs/sap-ai-core
- Generative AI Hub: https://help.sap.com/docs/generative-ai-hub
- AI Core SDK (Python): https://pypi.org/project/ai-core-sdk/
- Gen AI Hub SDK: https://pypi.org/project/generative-ai-hub-sdk/
