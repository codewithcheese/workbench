import { SupportedServices } from "@/app/services";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id } = await req.json();

  const apiKey = req.headers.get("X_API_KEY");

  if (!apiKey) {
    return new Response("Missing API key", {
      status: 401,
    });
  }

  if (!id) {
    return new Response("Missing service", {
      status: 400,
    });
  }

  const service = SupportedServices.find((s) => s.id === id);

  if (!service) {
    return new Response("Unsupported service", {
      status: 400,
    });
  }

  switch (service.compatability) {
    case "openai":
      return await fetchOpenAIModels(apiKey, service.baseUrl);
    case "anthropic":
      return await fetchAnthropicModels(apiKey, service.baseUrl);
    default:
      return new Response("Unsupported service", {
        status: 400,
      });
  }
}

async function fetchOpenAIModels(
  apiKey: string,
  baseUrl = "https://api.openai.com/v1"
) {
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
  const data = await resp.json();
  return new Response(JSON.stringify(data.data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function fetchAnthropicModels(
  apiKey: string,
  baseUrl = "https://api.anthropic.com"
) {
  // const resp = await fetch(`${baseUrl}/v1/models`, {
  //   headers: {
  //     Authorization: `Bearer ${apiKey}`,
  //   },
  // });
  // if (!resp.ok) {
  //   return new Response(resp.statusText, {
  //     status: resp.status,
  //   });
  // }
  // const data = await resp.json();
  // return new Response(JSON.stringify(data), {
  //   status: 200,
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
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
