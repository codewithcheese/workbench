import type { RequestHandler } from "@sveltejs/kit";
import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";

export const POST = (async ({ request }) => {
  let {
    data,
    fileName,
    language = "eng",
    baseURL = "https://api.unstructuredapp.io/general/v0/general",
  } = (await request.json()) as {
    data: string;
    fileName: string;
    language: string;
    baseURL: string;
  };

  const apiKey = request.headers.get("Authorization");
  if (!apiKey) {
    return new Response("Missing API key", {
      status: 401,
    });
  }

  const client = new UnstructuredClient({
    serverURL: baseURL,
    security: {
      apiKeyAuth: apiKey,
    },
  });

  try {
    const resp = await client.general.partition({
      partitionParameters: {
        files: {
          content: data,
          fileName: fileName,
        },
        strategy: Strategy.Auto,
        languages: [language],
      },
    });
    if (resp.statusCode !== 200) {
      return new Response(`Unstructured error: ${resp.statusCode}`, {
        status: resp.statusCode,
      });
    }
    const jsonElements = JSON.stringify(resp.elements, null, 2);
    console.log("Unstructured response", jsonElements);
    return new Response(jsonElements, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e: unknown) {
    return new Response(e instanceof Error ? e.message : "Unknown error", {
      status: 500,
    });
  }
}) satisfies RequestHandler;
