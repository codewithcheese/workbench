import type { RequestHandler } from "./$types";

export const POST = (async ({ request }) => {
  const { providerId, baseURL } = (await request.json()) as {
    providerId: string;
    baseURL: string;
  };

  const apiKey = request.headers.get("X_API_KEY");

  if (!apiKey) {
    return new Response("Missing API key", {
      status: 401,
    });
  }

  if (!providerId) {
    return new Response("Missing service", {
      status: 400,
    });
  }

  if (!baseURL) {
    return new Response("Missing baseURL", {
      status: 400,
    });
  }

  switch (providerId) {
    case "openai":
      return await fetchOpenAIModels(apiKey, baseURL);
    case "anthropic":
      return await fetchAnthropicModels(apiKey, baseURL);
    case "mistral":
      return await fetchMistralModels(apiKey, baseURL);
    case "google":
      return await fetchGoogleModels(apiKey, baseURL);
    default:
      return new Response(`Unsupported provider ${providerId}`, {
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
  return new Response(JSON.stringify(data.data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function fetchAnthropicModels(apiKey: string, baseUrl = "https://api.anthropic.com") {
  // does anthropic have a models endpoint?
  const models = [
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
    },
    {
      id: "claude-3-sonnet-20240229",
      name: "Claude 3 Sonnet",
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
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
  return new Response(JSON.stringify(data.data), {
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
        id: m.name,
        name: m.displayName,
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
