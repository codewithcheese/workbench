import type { RequestHandler } from "./$types";

export const POST = (async ({ request }) => {
  const { serviceId, sdkId, baseURL } = (await request.json()) as {
    serviceId: string;
    sdkId: string;
    baseURL: string;
  };

  const apiKey = request.headers.get("Authorization");

  if (!apiKey) {
    return new Response("Missing API key", {
      status: 401,
    });
  }

  if (!sdkId) {
    return new Response("Missing service", {
      status: 400,
    });
  }

  switch (serviceId) {
    case "perplexity":
      return await fetchPerplexityModels();
  }

  switch (sdkId) {
    case "openai":
      return await fetchOpenAIModels(apiKey, baseURL || undefined);
    case "azure":
      if (!baseURL) {
        return new Response("Azure OpenAI endpoint is required as the baseURL", {
          status: 400,
        });
      }
      return await fetchAzureModels(apiKey, baseURL);
    case "anthropic":
      return await fetchAnthropicModels(apiKey, baseURL || undefined);
    case "cohere":
      return await fetchCohereModels(apiKey);
    case "mistral":
      return await fetchMistralModels(apiKey, baseURL || undefined);
    case "google-gen-ai":
      return await fetchGoogleModels(apiKey, baseURL || undefined);
    default:
      return new Response(`Unsupported provider ${sdkId}`, {
        status: 400,
      });
  }
}) satisfies RequestHandler;

async function fetchOpenAIModels(apiKey: string, baseURL = "https://api.openai.com/v1") {
  const resp = await fetch(`${baseURL}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!resp.ok) {
    return new Response(resp.statusText, {
      status: resp.status,
    });
  }
  const data = (await resp.json()) as { data: any[] };
  return new Response(JSON.stringify(data.data.map((m) => ({ ...m, name: m.id }))), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// TODO: azure concats the deployment name with the model name, no support for deployment names input yet
async function fetchAzureModels(apiKey: string, baseURL: string) {
  const url = `${baseURL}/openai/models?api-version=2024-06-01`;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
      },
    });

    if (!resp.ok) {
      return new Response(resp.statusText, {
        status: resp.status,
      });
    }

    const data = (await resp.json()) as any;

    // Transform the data to match the format of your OpenAI function
    const transformedData = data.data.map((deployment: any) => ({
      name: deployment.id,
    }));

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response("An error occurred while fetching models", {
      status: 500,
    });
  }
}

async function fetchAnthropicModels(apiKey: string, baseUrl = "https://api.anthropic.com") {
  // does anthropic have a models endpoint?
  const models = [
    {
      name: "claude-3-opus-20240229",
    },
    {
      name: "claude-3-sonnet-20240229",
    },
    {
      name: "claude-3-haiku-20240307",
    },
    {
      name: "claude-3-5-sonnet-20240620",
    },
  ];
  return new Response(JSON.stringify(models), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function fetchMistralModels(apiKey: string, baseUrl = "https://api.mistral.ai/v1") {
  const resp = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!resp.ok) {
    return new Response(resp.statusText, {
      status: resp.status,
    });
  }
  const data = (await resp.json()) as { data: any[] };
  return new Response(JSON.stringify(data.data.map((m) => ({ ...m, name: m.id }))), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function fetchGoogleModels(
  apiKey: string,
  baseUrl = "https://generativelanguage.googleapis.com/v1beta",
) {
  const resp = await fetch(`${baseUrl}/models?key=${apiKey}`);
  if (!resp.ok) {
    return new Response(resp.statusText, {
      status: resp.status,
    });
  }
  const data = (await resp.json()) as { models: any[] };
  console.log(data);
  return new Response(
    JSON.stringify(
      data.models.map((m: any) => ({
        name: m.name,
      })),
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

async function fetchPerplexityModels() {
  const models = [
    {
      name: "llama-3.1-sonar-small-128k-online",
      displayName: "Llama 3.1 Sonar Small 128K Online",
      parameters: "8B",
      contextWindow: 127072,
      type: "Chat Completion",
    },
    {
      name: "llama-3.1-sonar-small-128k-chat",
      displayName: "Llama 3.1 Sonar Small 128K Chat",
      parameters: "8B",
      contextWindow: 131072,
      type: "Chat Completion",
    },
    {
      name: "llama-3.1-sonar-large-128k-online",
      displayName: "Llama 3.1 Sonar Large 128K Online",
      parameters: "70B",
      contextWindow: 127072,
      type: "Chat Completion",
    },
    {
      name: "llama-3.1-sonar-large-128k-chat",
      displayName: "Llama 3.1 Sonar Large 128K Chat",
      parameters: "70B",
      contextWindow: 131072,
      type: "Chat Completion",
    },
  ];

  return new Response(JSON.stringify(models), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function fetchCohereModels(apiKey: string) {
  const url = "https://api.cohere.ai/v1/models";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as any;

    // Transform the data to match a similar format to the previous examples
    const transformedData = data.models.map((model: any) => ({
      name: model.name,
    }));

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response("An error occurred while fetching models", {
      status: 500,
    });
  }
}
