import type { RequestHandler } from "./$types";

export const POST = (async ({ request }) => {
  const { providerId, baseURL } = (await request.json()) as {
    providerId: string;
    baseURL: string;
  };

  const apiKey = request.headers.get("Authorization");

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

  switch (providerId) {
    case "openai":
      return await fetchOpenAIModels(apiKey, baseURL || undefined);
    case "anthropic":
      return await fetchAnthropicModels(apiKey, baseURL || undefined);
    case "mistral":
      return await fetchMistralModels(apiKey, baseURL || undefined);
    case "google":
      return await fetchGoogleModels(apiKey, baseURL || undefined);
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
  return new Response(JSON.stringify(data.data.map((m) => ({ ...m, name: m.id }))), {
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
